import { getAcpRuntimeBackend } from "openclaw/plugin-sdk";

function resolveConfiguredBackend(config) {
  return config?.acp && typeof config.acp === "object" ? config.acp.backend : undefined;
}

function boolLabel(value) {
  return value ? "yes" : "no";
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

function renderSpawnHint(args = "") {
  const suffix = args.trim();
  const mapped = suffix ? `/acp spawn codex ${suffix}` : "/acp spawn codex --mode persistent --thread off";
  return [
    "Codex shortcut:",
    `- mapped command: ${mapped}`,
    "",
    "Send the mapped /acp command in chat to start the Codex ACP session.",
  ].join("\n");
}

export function registerCodexCommands(api) {
  api.registerCommand({
    name: "codex",
    description: "Shortcut helper for Codex ACP session commands.",
    acceptsArgs: true,
    handler: async (ctx) => {
      const raw = (ctx.args ?? "").trim();
      const action = raw.toLowerCase();

      if (!action || action === "on" || action === "start") {
        return { text: renderSpawnHint("") };
      }
      if (action === "status") {
        return { text: renderStatusText(ctx) };
      }
      if (action === "off" || action === "close") {
        return {
          text: [
            "Codex shortcut:",
            "- mapped command: /acp close",
            "",
            "Send /acp close in chat to close the current ACP session.",
          ].join("\n"),
        };
      }

      return { text: renderSpawnHint(raw) };
    },
  });

  api.registerCommand({
    name: "codex_status",
    description: "Check Codex ACP backend status quickly.",
    handler: async (ctx) => ({ text: renderStatusText(ctx) }),
  });

  api.registerCommand({
    name: "codex_off",
    description: "Show quick command to close current Codex ACP session.",
    handler: async () => ({
      text: [
        "Codex shortcut:",
        "- mapped command: /acp close",
        "",
        "Send /acp close in chat to close the current ACP session.",
      ].join("\n"),
    }),
  });
}
