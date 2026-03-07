import { registerAcpRuntimeBackend, unregisterAcpRuntimeBackend } from "openclaw/plugin-sdk";
import { resolveConfig } from "./config.js";
import { CodexCliRuntime } from "./runtime.js";

export function createCodexCliAcpService(params = {}) {
  let runtime = null;

  return {
    id: "codex-cli-session-backend",
    async start(ctx) {
      const config = resolveConfig(params.pluginConfig, ctx.workspaceDir);
      runtime = new CodexCliRuntime(config, ctx.logger);

      registerAcpRuntimeBackend({
        id: "codex-cli",
        runtime,
        healthy: () => runtime?.isHealthy() ?? false,
      });

      const probe = await runtime.probeAvailability();
      if (probe.ok) {
        ctx.logger.info(`codex-cli backend ready: ${probe.stdout.trim()}`);
      } else {
        ctx.logger.warn(`codex-cli backend registered but unhealthy: ${probe.stderr || probe.error || "unknown"}`);
      }
    },
    async stop() {
      unregisterAcpRuntimeBackend("codex-cli");
      runtime = null;
    },
  };
}
