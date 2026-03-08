# openclaw-codex-cli-session

> OpenClaw 的会话级 Codex CLI 后端插件（ACP Runtime Backend）。

## 中文（先看这里）

### 这个仓库到底有多有用

如果你想让 OpenClaw 的 ACP 会话真正走本机 `codex` CLI（并复用 Codex thread/session），这个仓库直接提供可运行方案，而不是概念示例。

它解决的是「会话执行链路」问题，不是「提示词润色」问题：
- 通过插件注册真实 ACP backend：`codex-cli`
- 每个 turn 真调用 `codex exec --json`
- 持久会话使用 `codex exec resume`
- 支持 `doctor()` 与本地 smoke 校验

适合人群：
- 已经在用 OpenClaw ACP
- 希望会话持续复用 Codex 上下文
- 需要可调试、可验证、可回滚的插件化接入

### 已实现能力（MVP）

- OpenClaw 插件骨架与 manifest
- ACP backend 注册（`codex-cli`）
- turn 事件流解析（`agent_message` -> text）
- persistent resume（已修复 resume 参数兼容问题）
- 本地验证脚本：`npm run smoke`

### 明确边界（没做）

- 不做多 provider 路由器
- 不做 gemini/provider 切换层
- 不做 `/model` 别名系统
- 不做复杂事件语义映射（仅最小文本链路）

## 安装与使用（中文）

### 1) 克隆仓库

```bash
git clone git@github.com:sunsiyuan/openclaw-codex-cli-session.git
cd openclaw-codex-cli-session
```

### 2) 以本地链接方式安装插件

```bash
openclaw plugins install -l .
openclaw plugins enable codex-cli-session
openclaw plugins enable acpx
```

### 3) 配置 ACP 后端为 `codex-cli`

```bash
openclaw config set acp.enabled true
openclaw config set acp.backend codex-cli
```

### 4) 重启 OpenClaw Gateway

```bash
openclaw restart
```

### 5) 验证你真的在用 Codex

在聊天里执行：

```text
/acp doctor
```

预期至少包含：
- `configuredBackend: codex-cli`
- `registeredBackend: codex-cli`
- `healthy: yes`
- `runtimeDoctor: ok (codex CLI available: ...)`

随后开启会话并测试：

```text
/acp spawn codex --mode persistent --thread off
Reply with exactly FIRST_OK
Now reply with exactly SECOND_OK and nothing else
```

### 6) 关闭 ACP 会话

```text
/acp close
```

多会话时：

```text
/acp ps
/acp close <session-id>
```

## 故障排查（中文）

- 报 `ACP_BACKEND_MISSING`：通常是 `acpx` 没启用，或网关未重启
- 报 `configuredBackend: acpx`：说明还没切到 `acp.backend=codex-cli`
- 报 `codex not available`：检查 `codex --version` 和登录状态
- 插件告警 `plugins.allow is empty`：安全建议，不是功能阻塞

## 发布到 OpenClaw 生态（中文）

先说结论：
- 这是 **插件仓库**，不是技能仓库
- **技能** 发布到 ClawHub
- **插件** 主要通过 npm + 社区插件列表 PR 暴露

### A. 发布插件（推荐路径）

1. 发布 npm 包（确保 `openclaw.extensions` 指向入口）
2. 用户安装：`openclaw plugins install <npm-spec>`
3. 向 OpenClaw 社区插件页面提 PR（附名称、npm 包、GitHub、安装命令）

### B. 发布技能（仅当你另做 skill）

如果你另建 `skills/<name>/SKILL.md` 技能包，可用 `clawhub` 发布到 ClawHub。

## GitHub Pages（项目说明页）

本仓库已提供 Pages 工作流与页面文件：
- `.github/workflows/deploy-pages.yml`
- `docs/index.html`

推送到 `master` 后会自动部署（需仓库 Settings 中启用 Pages: Source = GitHub Actions）。

---

## English

### Why this repo is useful

This repository provides a real, session-level ACP backend plugin for OpenClaw that delegates turns to the local `codex` CLI, with persistent resume support.

It solves execution-path integration (not prompt tricks):
- Registers a real ACP backend: `codex-cli`
- Executes each turn via `codex exec --json`
- Reuses Codex thread/session with `codex exec resume`
- Includes health checks and smoke testing

### MVP capabilities

- Loadable OpenClaw plugin + manifest
- ACP backend registration (`codex-cli`)
- JSON event parsing to text output
- Persistent session resume support
- Local smoke validation script (`npm run smoke`)

### Out of scope

- Multi-provider router/switcher
- Gemini/provider abstraction layer
- `/model` alias system
- Full event semantic mapping beyond core text path

## Install and use

### 1) Clone

```bash
git clone git@github.com:sunsiyuan/openclaw-codex-cli-session.git
cd openclaw-codex-cli-session
```

### 2) Install plugin (linked)

```bash
openclaw plugins install -l .
openclaw plugins enable codex-cli-session
openclaw plugins enable acpx
```

### 3) Configure ACP backend

```bash
openclaw config set acp.enabled true
openclaw config set acp.backend codex-cli
```

### 4) Restart gateway

```bash
openclaw restart
```

### 5) Verify you are actually using Codex

Run in chat:

```text
/acp doctor
```

Expected fields:
- `configuredBackend: codex-cli`
- `registeredBackend: codex-cli`
- `healthy: yes`
- `runtimeDoctor: ok (codex CLI available: ...)`

Then run a persistent session test:

```text
/acp spawn codex --mode persistent --thread off
Reply with exactly FIRST_OK
Now reply with exactly SECOND_OK and nothing else
```

### 6) Close ACP session

```text
/acp close
```

For multiple sessions:

```text
/acp ps
/acp close <session-id>
```

## Troubleshooting

- `ACP_BACKEND_MISSING`: `acpx` not enabled, or gateway restart missing
- Backend still `acpx`: set `acp.backend=codex-cli`
- `codex not available`: check `codex --version` and auth state
- `plugins.allow is empty`: security recommendation, non-blocking

## Publishing to OpenClaw ecosystem

This repo is a **plugin**, not a skill.

Plugin distribution path:
1. Publish npm package with valid `openclaw.extensions`
2. Install via `openclaw plugins install <npm-spec>`
3. Submit to OpenClaw community plugins page via PR

Skill distribution path (separate artifact):
- Publish skills via ClawHub (`clawhub` CLI / clawhub.ai)

## GitHub Pages

This repo includes a Pages workflow and site:
- `.github/workflows/deploy-pages.yml`
- `docs/index.html`

After pushing to `master`, Pages deploy runs automatically (if repo Pages is set to GitHub Actions).
