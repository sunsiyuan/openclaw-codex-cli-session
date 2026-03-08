import { getAcpRuntimeBackend } from "openclaw/plugin-sdk";

const ACP_MANAGER_MODULE =
  process.env.OPENCLAW_ACP_MANAGER_MODULE ?? "file:///usr/lib/node_modules/openclaw/dist/reply-DhtejUNZ.js";

function resolveConfiguredBackend(config) {
  return config?.acp && typeof config.acp === "object" ? config.acp.backend : undefined;
}

function boolLabel(value) {
  return value ? "yes" : "no";
}

async function loadAcpSessionManager() {
  const mod = await import(ACP_MANAGER_MODULE);
  if (typeof mod?.Br !== "function") {
    throw new Error("ACP session manager export not found in current OpenClaw build");
  }
  return mod.Br();
}

function resolveSessionKey(ctx) {
  const channel = typeof ctx.channel === "string" ? ctx.channel.trim() : "";
  const from = typeof ctx.from === "string" ? ctx.from.trim() : "";
  if (!channel || !from) {
    throw new Error("missing channel/from in command context");
  }

  const prefix = `${channel}:`;
  const peer = from.startsWith(prefix) ? from.slice(prefix.length) : from;
  if (!peer) {
    throw new Error("cannot resolve peer id from context");
  }
  return `agent:main:${channel}:direct:${peer}`;
}

function renderStatusText(ctx) {
  const configuredBackend = resolveConfiguredBackend(ctx.config);
  const backend = getAcpRuntimeBackend("codex-cli");
  const registered = Boolean(backend);
  const healthy = Boolean(backend?.healthy?.());

  return [
    "Codex shortcut status:",
    `- configuredBackend: ${configuredBackend ?? "(unset)"}`,
    `- registeredBackend(codex-cli): ${registered ? "codex-cli" : "(none)"}`,
    `- healthy: ${boolLabel(healthy)}`,
    "",
    "Use /acp doctor for full ACP diagnostics.",
  ].join("\n");
}

function parseMode(rawArgs) {
  const raw = rawArgs.trim().toLowerCase();
  if (!raw) return "persistent";
  if (raw.includes("oneshot")) return "oneshot";
  return "persistent";
}

async function startCodexSession(params) {
  const mgr = await loadAcpSessionManager();
  const sessionKey = resolveSessionKey(params.ctx);
  const initialized = await mgr.initializeSession({
    cfg: params.ctx.config,
    sessionKey,
    agent: "codex",
    mode: params.mode,
  });

  if (params.sandbox) {
    await mgr.setSessionConfigOption({
      cfg: params.ctx.config,
      sessionKey,
      key: "sandbox",
      value: params.sandbox,
    });
  }

  return { sessionKey, initialized };
}

async function closeCodexSession(params) {
  const mgr = await loadAcpSessionManager();
  const sessionKey = resolveSessionKey(params.ctx);
  await mgr.closeSession({
    cfg: params.ctx.config,
    sessionKey,
    reason: params.reason ?? "codex-shortcut-close",
    clearMeta: Boolean(params.clearMeta),
    allowBackendUnavailable: true,
  });
  return { sessionKey };
}

export function registerCodexCommands(api) {
  api.registerCommand({
    name: "codex",
    description: "Shortcut helper for Codex ACP session commands.",
    acceptsArgs: true,
    handler: async (ctx) => {
      const raw = (ctx.args ?? "").trim();
      const action = raw.toLowerCase();

      if (action === "status") {
        try {
          const mgr = await loadAcpSessionManager();
          const sessionKey = resolveSessionKey(ctx);
          const status = await mgr.getSessionStatus({
            cfg: ctx.config,
            sessionKey,
          });
          return {
            text: [
              renderStatusText(ctx),
              "",
              "Session:",
              `- key: ${status.sessionKey}`,
              `- backend: ${status.backend}`,
              `- mode: ${status.mode}`,
              `- state: ${status.state}`,
            ].join("\n"),
          };
        } catch {
          return { text: renderStatusText(ctx) };
        }
      }
      if (action === "off" || action === "close") {
        try {
          const { sessionKey } = await closeCodexSession({
            ctx,
            reason: "codex-shortcut-close-keep-binding",
            clearMeta: false,
          });
          return {
            text: [
              "Codex session closed (ACP binding kept).",
              `- key: ${sessionKey}`,
              "",
              "This thread can still execute tasks.",
            ].join("\n"),
          };
        } catch (error) {
          return { text: `Failed to close Codex ACP session: ${String(error)}` };
        }
      }

      try {
        const mode = parseMode(raw);
        const { sessionKey, initialized } = await startCodexSession({
          ctx,
          mode,
        });

        return {
          text: [
            "Codex ACP session started.",
            `- key: ${sessionKey}`,
            `- backend: ${initialized.meta.backend}`,
            `- mode: ${initialized.meta.mode}`,
            "",
            "Now just continue chatting in this thread.",
          ].join("\n"),
        };
      } catch (error) {
        return { text: `Failed to start Codex ACP session: ${String(error)}` };
      }
    },
  });

  api.registerCommand({
    name: "codex_status",
    description: "Check Codex ACP backend status quickly.",
    handler: async (ctx) => ({ text: renderStatusText(ctx) }),
  });

  api.registerCommand({
    name: "codex_danger",
    description: "Start Codex ACP session with sandbox=danger-full-access.",
    acceptsArgs: true,
    handler: async (ctx) => {
      try {
        const mode = parseMode((ctx.args ?? "").trim());
        const { sessionKey, initialized } = await startCodexSession({
          ctx,
          mode,
          sandbox: "danger-full-access",
        });
        return {
          text: [
            "Codex ACP session started (danger mode).",
            `- key: ${sessionKey}`,
            `- backend: ${initialized.meta.backend}`,
            `- mode: ${initialized.meta.mode}`,
            "- sandbox: danger-full-access",
            "",
            "Now just continue chatting in this thread.",
          ].join("\n"),
        };
      } catch (error) {
        return { text: `Failed to start Codex ACP danger session: ${String(error)}` };
      }
    },
  });

  api.registerCommand({
    name: "codex_off",
    description: "Close current Codex session but keep ACP execution enabled for this thread.",
    handler: async (ctx) => {
      try {
        const { sessionKey } = await closeCodexSession({
          ctx,
          reason: "codex-shortcut-close-keep-binding",
          clearMeta: false,
        });
        return {
          text: [
            "Codex session closed (ACP binding kept).",
            `- key: ${sessionKey}`,
            "",
            "This thread can still execute tasks.",
          ].join("\n"),
        };
      } catch (error) {
        return { text: `Failed to close Codex ACP session: ${String(error)}` };
      }
    },
  });
}
