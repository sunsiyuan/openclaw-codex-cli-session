# openclaw-codex-cli-session

Session-level Codex CLI integration for OpenClaw via plugin (ACP runtime backend).

## 这个插件解决什么问题

目标是让 OpenClaw 把会话级对话委托给本机已登录的 `codex` CLI，从而走 ChatGPT/Codex 订阅路径，而不是直接走按量 API provider。

## 为什么不能只靠 prompt

Prompt/skill 只能影响模型输出文本，不能注册网关级 runtime backend，也不能真实接管会话执行进程。

这个仓库实现的是 OpenClaw plugin 层：
- 通过 `registerAcpRuntimeBackend` 注册真实 backend（`codex-cli`）
- 每个 ACP turn 实际调用本机 `codex exec --json`
- persistent 模式下使用 `codex exec resume` 复用 Codex session

## 当前版本做了什么（MVP）

- 提供可加载的 OpenClaw 插件骨架（含 `openclaw.plugin.json`）
- 注册 ACP backend id：`codex-cli`
- `runTurn` 真实执行 `codex exec`，解析 JSON 事件并回传文本
- persistent 会话最小保持（记录 Codex thread id 并在后续 turn resume）
- 提供 `doctor()` 和本地 `npm run smoke` 可运行验证

## 当前版本没做什么

- 不做 gemini / 其他 provider
- 不做多模型路由器/切换器
- 不做 `/model` 别名体系
- 不做复杂容错编排和完整事件映射（当前只映射核心文本事件）

## 安装

### 1. 克隆仓库

```bash
git clone git@github.com:sunsiyuan/openclaw-codex-cli-session.git
cd openclaw-codex-cli-session
```

### 2. 作为本地插件安装到 OpenClaw

```bash
openclaw plugins install -l .
openclaw config set plugins.entries.codex-cli-session.enabled true
```

`-l/--link` 会把本地目录加入 `plugins.load.paths`，适合开发迭代。

## 配置

在 OpenClaw 配置里启用 ACP，并指定 backend 为 `codex-cli`：

```json5
{
  acp: {
    enabled: true,
    dispatch: { enabled: true },
    backend: "codex-cli",
    defaultAgent: "codex",
    allowedAgents: ["codex"]
  },
  plugins: {
    entries: {
      "codex-cli-session": {
        enabled: true,
        config: {
          command: "codex",
          cwd: "/home/sun/.openclaw/workspace",
          sandbox: "workspace-write"
        }
      }
    }
  }
}
```

改完后重启 OpenClaw gateway。

## 最短验证步骤

### A. 插件骨架本地可运行

```bash
npm run smoke
```

预期：输出来自 Codex 的文本回复。

### B. OpenClaw 侧 backend 可见

在 OpenClaw 对话里执行：

```text
/acp doctor
```

预期：backend 指向 `codex-cli`，且健康状态可用。

### C. 会话委托路径验证

```text
/acp spawn codex --mode persistent --thread off
```

然后继续发送两条消息，确认第二条仍基于同一 Codex 会话上下文（本插件使用 `codex exec resume`）。

## 开发说明

主要文件：
- `src/index.js`: 插件入口
- `src/service.js`: backend 注册与生命周期
- `src/runtime.js`: Codex CLI 调用与 ACP event 适配
- `src/config.js`: 插件配置解析
