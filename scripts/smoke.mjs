import { resolveConfig } from "../src/config.js";
import { CodexCliRuntime } from "../src/runtime.js";

const prompt = process.argv.slice(2).join(" ") || "Reply with exactly: codex-cli-session-smoke-ok";

const runtime = new CodexCliRuntime(
  resolveConfig(
    {
      command: process.env.CODEX_COMMAND || "codex",
      cwd: process.cwd(),
      sandbox: process.env.CODEX_SANDBOX || "workspace-write",
    },
    process.cwd(),
  ),
  console,
);

const probe = await runtime.probeAvailability();
if (!probe.ok) {
  console.error("codex not available", probe);
  process.exit(1);
}

const handle = await runtime.ensureSession({
  sessionKey: "smoke-session",
  agent: "codex",
  mode: "persistent",
  cwd: process.cwd(),
});

for await (const event of runtime.runTurn({
  handle,
  text: prompt,
  mode: "prompt",
  requestId: `smoke-${Date.now()}`,
})) {
  if (event.type === "text_delta") {
    process.stdout.write(event.text + "\n");
  }
  if (event.type === "error") {
    console.error("error", event);
    process.exitCode = 1;
  }
}
