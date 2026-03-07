import { spawn } from "node:child_process";
import { createInterface } from "node:readline";

const HANDLE_PREFIX = "codex-cli:v1:";

class RuntimeError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "RuntimeError";
    this.code = code;
  }
}

function encodeState(state) {
  return `${HANDLE_PREFIX}${Buffer.from(JSON.stringify(state), "utf8").toString("base64url")}`;
}

function decodeState(runtimeSessionName) {
  if (typeof runtimeSessionName !== "string" || !runtimeSessionName.startsWith(HANDLE_PREFIX)) {
    return null;
  }
  const encoded = runtimeSessionName.slice(HANDLE_PREFIX.length);
  if (!encoded) return null;
  try {
    const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

function waitForClose(child) {
  return new Promise((resolve) => {
    child.once("close", (code, signal) => resolve({ code, signal }));
    child.once("error", (error) => resolve({ code: null, signal: null, error }));
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class CodexCliRuntime {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.healthy = false;
    this.sessions = new Map();
    this.inFlight = new Map();
  }

  async probeAvailability() {
    const result = await this._spawnAndCollect(["--version"]);
    this.healthy = result.ok;
    return result;
  }

  isHealthy() {
    return this.healthy;
  }

  async ensureSession(input) {
    if (!input?.sessionKey) {
      throw new RuntimeError("ACP_SESSION_INIT_FAILED", "sessionKey is required");
    }

    const mode = input.mode === "oneshot" ? "oneshot" : "persistent";
    const cwd = input.cwd || this.config.cwd;
    const existing = this.sessions.get(input.sessionKey);

    const state = {
      sessionKey: input.sessionKey,
      mode,
      cwd,
      codexSessionId: existing?.codexSessionId,
    };

    this.sessions.set(input.sessionKey, state);

    return {
      sessionKey: input.sessionKey,
      backend: "codex-cli",
      runtimeSessionName: encodeState(state),
      cwd,
    };
  }

  async *runTurn(input) {
    const state = this._resolveState(input.handle);
    const runState = { ...state };

    const args = this._buildRunArgs(runState);
    const child = spawn(this.config.command, args, {
      cwd: runState.cwd,
      env: process.env,
      stdio: ["pipe", "pipe", "pipe"],
    });

    this.inFlight.set(runState.sessionKey, child);

    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });

    child.stdin.on("error", () => {
      // Ignore EPIPE when process exits quickly.
    });
    child.stdin.end(input.text ?? "");

    const onAbort = () => {
      void this._terminateSession(runState.sessionKey, "abort");
    };
    if (input.signal) {
      if (input.signal.aborted) {
        onAbort();
      } else {
        input.signal.addEventListener("abort", onAbort, { once: true });
      }
    }

    let sawError = false;
    let sawText = false;
    const rl = createInterface({ input: child.stdout, crlfDelay: Infinity });

    try {
      for await (const line of rl) {
        let event;
        try {
          event = JSON.parse(line);
        } catch {
          continue;
        }

        if (event?.type === "thread.started" && typeof event.thread_id === "string") {
          if (runState.mode === "persistent") {
            runState.codexSessionId = event.thread_id;
            this.sessions.set(runState.sessionKey, runState);
          }
          continue;
        }

        if (event?.type === "item.completed" && event.item?.type === "agent_message") {
          const text = typeof event.item.text === "string" ? event.item.text : "";
          if (text) {
            sawText = true;
            yield { type: "text_delta", text };
          }
          continue;
        }

        if (event?.type === "error") {
          sawError = true;
          yield {
            type: "error",
            message: typeof event.message === "string" ? event.message : "codex exec error",
            code: "CODEX_EXEC_ERROR",
          };
        }
      }

      const closeResult = await waitForClose(child);

      if (closeResult.error) {
        this.healthy = false;
        throw new RuntimeError("ACP_BACKEND_UNAVAILABLE", closeResult.error.message);
      }

      if ((closeResult.code ?? 0) !== 0 && !sawError) {
        yield {
          type: "error",
          code: "ACP_TURN_FAILED",
          message: stderr.trim() || `codex exited with code ${String(closeResult.code)}`,
        };
        return;
      }

      if (!sawError) {
        if (!sawText) {
          this.logger?.warn?.("codex turn produced no agent_message item");
        }
        yield { type: "done" };
      }
    } finally {
      this.inFlight.delete(runState.sessionKey);
      if (input.signal) {
        input.signal.removeEventListener("abort", onAbort);
      }
    }
  }

  async getStatus(input) {
    const state = this._resolveState(input.handle);
    return {
      summary: state.codexSessionId
        ? `codex session active (${state.codexSessionId})`
        : "codex session not created yet",
      details: {
        mode: state.mode,
        cwd: state.cwd,
        codexSessionId: state.codexSessionId ?? null,
      },
    };
  }

  async doctor() {
    const version = await this._spawnAndCollect(["--version"]);
    if (!version.ok) {
      return {
        ok: false,
        code: "codex-not-available",
        message: "codex CLI command is not available",
        details: [version.stderr || version.error || "unknown spawn error"],
      };
    }

    return {
      ok: true,
      message: `codex CLI available: ${version.stdout.trim()}`,
    };
  }

  async cancel(input) {
    await this._terminateSession(input.handle.sessionKey, input.reason || "cancel");
  }

  async close(input) {
    await this._terminateSession(input.handle.sessionKey, input.reason || "close");
    this.sessions.delete(input.handle.sessionKey);
  }

  _resolveState(handle) {
    const current = this.sessions.get(handle.sessionKey);
    if (current) return current;

    const decoded = decodeState(handle.runtimeSessionName);
    if (!decoded || decoded.sessionKey !== handle.sessionKey) {
      return {
        sessionKey: handle.sessionKey,
        mode: "persistent",
        cwd: this.config.cwd,
        codexSessionId: undefined,
      };
    }

    const resolved = {
      sessionKey: decoded.sessionKey,
      mode: decoded.mode === "oneshot" ? "oneshot" : "persistent",
      cwd: typeof decoded.cwd === "string" && decoded.cwd ? decoded.cwd : this.config.cwd,
      codexSessionId:
        typeof decoded.codexSessionId === "string" && decoded.codexSessionId
          ? decoded.codexSessionId
          : undefined,
    };
    this.sessions.set(handle.sessionKey, resolved);
    return resolved;
  }

  _buildRunArgs(state) {
    if (state.mode === "persistent" && state.codexSessionId) {
      const resumeOptions = ["--json", "--skip-git-repo-check"];
      if (this.config.model) resumeOptions.push("--model", this.config.model);
      return ["exec", "resume", ...resumeOptions, state.codexSessionId, "-"];
    }

    const execOptions = ["--json", "--skip-git-repo-check"];
    if (this.config.model) execOptions.push("--model", this.config.model);
    if (this.config.sandbox) execOptions.push("--sandbox", this.config.sandbox);
    if (this.config.extraArgs.length > 0) execOptions.push(...this.config.extraArgs);
    return ["exec", ...execOptions, "-"];
  }

  async _spawnAndCollect(args) {
    return await new Promise((resolve) => {
      const child = spawn(this.config.command, args, {
        cwd: this.config.cwd,
        env: process.env,
        stdio: ["ignore", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (chunk) => {
        stdout += String(chunk);
      });
      child.stderr.on("data", (chunk) => {
        stderr += String(chunk);
      });

      child.once("error", (error) => {
        resolve({ ok: false, stdout, stderr, error: error.message });
      });
      child.once("close", (code) => {
        resolve({ ok: (code ?? 1) === 0, stdout, stderr, code });
      });
    });
  }

  async _terminateSession(sessionKey, reason) {
    const child = this.inFlight.get(sessionKey);
    if (!child) return;

    this.logger?.info?.(`terminating codex process for ${sessionKey}: ${reason}`);
    child.kill("SIGTERM");
    await sleep(this.config.cancelGraceMs);
    if (!child.killed) {
      child.kill("SIGKILL");
    }
    this.inFlight.delete(sessionKey);
  }
}
