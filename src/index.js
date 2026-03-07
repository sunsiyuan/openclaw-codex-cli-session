import { createCodexCliAcpService } from "./service.js";

const plugin = {
  id: "codex-cli-session",
  name: "Codex CLI Session Backend",
  description: "ACP runtime backend that delegates turns to local Codex CLI.",
  configSchema: {
    type: "object",
    additionalProperties: false,
    properties: {},
  },
  register(api) {
    api.registerService(
      createCodexCliAcpService({
        pluginConfig: api.pluginConfig,
      }),
    );
  },
};

export default plugin;
