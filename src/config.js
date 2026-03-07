import path from "node:path";

export function resolveConfig(rawConfig, workspaceDir) {
  const cfg = rawConfig && typeof rawConfig === "object" ? rawConfig : {};

  const command = typeof cfg.command === "string" && cfg.command.trim() ? cfg.command.trim() : "codex";
  const cwdInput = typeof cfg.cwd === "string" && cfg.cwd.trim() ? cfg.cwd.trim() : workspaceDir;
  const cwd = path.isAbsolute(cwdInput) ? cwdInput : path.resolve(workspaceDir, cwdInput);

  return {
    command,
    cwd,
    model: typeof cfg.model === "string" && cfg.model.trim() ? cfg.model.trim() : undefined,
    sandbox: typeof cfg.sandbox === "string" && cfg.sandbox.trim() ? cfg.sandbox.trim() : undefined,
    extraArgs: Array.isArray(cfg.extraArgs)
      ? cfg.extraArgs.filter((v) => typeof v === "string" && v.length > 0)
      : [],
    cancelGraceMs:
      typeof cfg.cancelGraceMs === "number" && Number.isFinite(cfg.cancelGraceMs)
        ? Math.max(100, Math.min(60000, Math.floor(cfg.cancelGraceMs)))
        : 2500,
  };
}
