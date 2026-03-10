# OpenClaw Codex 插件（龙虾机器人 · 用 Codex 干活）

> **一句话**：在 **OpenClaw（龙虾机器人）** 里，用你自己的 **Codex 订阅额度** 来干活——在 Telegram、Discord 或 IDE 里和龙虾机器人对话时，说「用 Codex 做这件事」，请求就会走你本机的 `codex`，**扣的是你的 Codex 额度**，不占主模型额度。

**相关链接**：[本仓库](https://github.com/sunsiyuan/openclaw-codex-cli-session) · [说明页（GitHub Pages）](https://sunsiyuan.github.io/openclaw-codex-cli-session/) · [OpenClaw 插件文档](https://docs.openclaw.ai/tools/plugin) · [社区插件列表](https://docs.openclaw.ai/plugins/community) · [ClawHub（技能库）](https://docs.openclaw.ai/tools/clawhub)

---

## 你能得到什么

- **已有 Codex 订阅**：装好并配置一次后，在 OpenClaw（龙虾机器人）里说「用 Codex 做这件事」或发一条开 Codex 的指令，就会真的走本机 Codex，额度算在 Codex 上。
- **体验统一**：同一套对话入口（Telegram / Discord / IDE），需要时切到 Codex，多轮连续、可验证，不用时关掉或换回别的后端即可。

---

## 谁适合用

- 你已经有 **Codex 订阅**，想在同一套 OpenClaw（龙虾机器人）里把这份额度用起来。
- 你希望「用 Codex」的对话能多轮连续、可验证，需要时能关掉或换回别的后端。

---

## 第一次使用：安装与配置

下面几步做完一次即可，之后日常只要在聊天里发指令或说人话即可。

### 1. 先确认环境

- 本机已安装并登录 **Codex CLI**（在终端执行 `codex --version` 能跑通）。
- 已安装 **OpenClaw（龙虾机器人）**，并能执行 `openclaw` 命令。

### 2. 安装插件并启用

```bash
git clone git@github.com:sunsiyuan/openclaw-codex-cli-session.git
cd openclaw-codex-cli-session
```

用「本地链接」方式安装并启用（第二行是依赖，一起启用即可）：

```bash
openclaw plugins install -l .
openclaw plugins enable codex-cli-session
openclaw plugins enable acpx
```

### 3. 让龙虾机器人用你本机的 Codex

```bash
openclaw config set acp.enabled true
openclaw config set acp.backend codex-cli
```

### 4. 重启网关

```bash
openclaw restart
```

---

## 日常怎么用：聊天里就能搞定

配置好后，在 **OpenClaw（龙虾机器人）的聊天里**（Telegram / Discord / IDE 等）可以这样用。

### 先确认真的在用 Codex

在任意会话里发：

```text
/acp doctor
```

如果看到类似下面这些，就说明已经走本机 Codex，额度会扣在 Codex 上：

- `configuredBackend: codex-cli`
- `registeredBackend: codex-cli`
- `healthy: yes`
- `runtimeDoctor: ok (codex CLI available: ...)`

### 开一个 Codex 会话（推荐方式）

**最省事**：直接发快捷指令，默认就是持久多轮会话，在本 thread 继续聊即可：

```text
/codex
```

需要一次性跑完就结束可以带参数：

```text
/codex --mode oneshot
```

**想细调时**可以用原生 ACP 指令，例如：

- 持久多轮：`/acp spawn codex --mode persistent --thread off`
- 一次性：`/acp spawn codex --mode oneshot --thread off`
- 当前频道支持「按 thread 绑定」时：`/acp spawn codex --mode persistent --thread auto`

常用参数：

| 参数 | 含义 |
|------|------|
| `--mode persistent` | 持久会话，多轮对话复用同一 Codex session |
| `--mode oneshot` | 单次执行，不保留会话 |
| `--thread auto` | 能绑 thread 就绑（当前在 thread 里就绑当前 thread） |
| `--thread here` | 必须在已有 thread 里使用，绑定当前 thread |
| `--thread off` | 不绑定 thread |
| `--cwd /path` | 指定工作目录 |
| `--label 名字` | 给会话起个标签，方便后面用 `/acp close 名字` 等 |

### 说人话也可以

在 OpenClaw（龙虾机器人）里直接说，例如：

- 「用 Codex 做这件事」
- 「在 thread 里开一个持久的 Codex 会话，专注在这个任务上」
- 「用 Codex 一次性跑完并总结结果」

配置好本插件并指向 codex-cli 后，这类请求会被路由到本机 Codex，消耗你的 Codex 额度。

### 常用指令速查

**本插件快捷指令（发在聊天里直接执行）：**

| 指令 | 作用 |
|------|------|
| `/codex` | 直接开 Codex 会话（默认持久；可带参数如 `--mode oneshot`） |
| `/codex_status` | 查看后端是否在用 codex-cli、是否健康 |
| `/codex_off` | 关闭当前 Codex 会话，但保留可执行状态 |
| `/codex_danger` | 直接开带 danger-full-access 的 Codex 会话（如 WSL2 等权限受限环境） |

**原生 ACP 指令（/acp 开头，可细调参数）：**

| 指令 | 作用 |
|------|------|
| `/acp doctor` | 完整诊断：是否在用本机 Codex、环境是否正常 |
| `/acp spawn codex ...` | 开 Codex 会话（可加 --thread、--cwd、--label 等） |
| `/acp status` | 看当前会话状态、模式、超时等 |
| `/acp sessions` | 列出最近的 Codex 会话（查 id/标签时用） |
| `/acp close` | 关闭当前会话并解除绑定 |
| `/acp close <session-id或标签>` | 关闭指定会话（多会话时用） |
| `/acp cancel` | 取消当前正在执行的一轮，不关会话 |
| `/acp steer <一句话>` | 给当前会话发一条「指导」（如：收紧日志、继续）不替换上下文 |
| `/acp timeout <秒数>` | 设置超时 |
| `/acp model <模型名>` | 设置模型覆盖（若后端支持） |
| `/acp cwd <路径>` | 设置/改工作目录 |
| `/acp reset-options` | 清掉当前会话的运行时覆盖项 |
| `/acp install` | 打印安装与启用步骤（方便复现环境） |

多会话时：先用 `/acp sessions` 看列表，再用 `/acp close <session-id或标签>` 关指定会话。

### 小结：你实际在做什么

1. **目标**：在 OpenClaw（龙虾机器人）里用 Codex 额度干活。
2. **一次配置**：装插件 → 启用本插件和依赖 acpx → 设为用 codex-cli → 重启。
3. **平时用**：在聊天里发 `/codex` 直接开 Codex 会话，或 `/acp spawn codex ...`、自然语言「用 Codex 做 xxx」。
4. **确认**：`/acp doctor` 里看到在用 codex-cli 且 healthy。
5. **管理**：`/acp status`、`/acp sessions`、`/acp close`、`/acp cancel`、`/acp steer` 等。

这样，凡是「用 Codex」的对话都走本机 `codex`，**额度从你的 Codex 订阅扣**。

---

## 遇到问题时

| 现象 | 可能原因 | 处理 |
|------|----------|------|
| 报后端缺失或未就绪 | 依赖插件未启用或网关未重启 | 执行 `openclaw plugins enable acpx` 并 `openclaw restart` |
| 发现还在用 acpx、没走 Codex | 未切到 codex-cli | `openclaw config set acp.backend codex-cli` 后重启 |
| 报 codex 不可用 | 本机 codex 未装或未登录 | 终端跑 `codex --version`，检查安装与登录 |
| 插件提示 `plugins.allow is empty` | 安全建议（允许列表为空） | 仅提示，不阻塞功能；需要时可配置 `plugins.allow` |

---

## 技术边界（给想深挖的人）

- 本插件只做 **会话级 Codex CLI 接入**：每轮调本机 `codex exec`，持久会话用 `codex exec resume`。
- **不做**：多 provider 路由、Gemini/其他 provider 切换、`/model` 别名体系；仅保证「用 Codex」时的最小可用链路。

---

## 发布与生态（维护者向）

- 这是 **插件** 仓库，不是技能仓库。**技能** 发 ClawHub，**插件** 通过 npm + 社区插件列表 PR 暴露。
- 发布插件：发 npm 包（`openclaw.extensions` 指向入口）→ 用户 `openclaw plugins install <npm-spec>` → 向 OpenClaw 社区插件页提 PR。

---

## GitHub Pages

仓库内已有 Pages 工作流与页面：

- [`.github/workflows/deploy-pages.yml`](https://github.com/sunsiyuan/openclaw-codex-cli-session/blob/master/.github/workflows/deploy-pages.yml)
- [`docs/index.html`](https://github.com/sunsiyuan/openclaw-codex-cli-session/blob/master/docs/index.html)

在仓库设置中启用 Pages（Source = GitHub Actions），推送到默认分支后会自动部署。**说明页地址**：[https://sunsiyuan.github.io/openclaw-codex-cli-session/](https://sunsiyuan.github.io/openclaw-codex-cli-session/)

---

## English (short)

**Goal:** Use your Codex subscription from **OpenClaw (龙虾机器人 / Lobster Robot)**—when you ask OpenClaw to use Codex or spawn a Codex session, it runs your local `codex` CLI and consumes your Codex quota.

**Quick setup:** Clone → `openclaw plugins install -l .` → enable `codex-cli-session` and `acpx` (dependency) → `openclaw config set acp.backend codex-cli` → `openclaw restart`. In chat: `/acp doctor` to verify, then `/codex` (or `/acp spawn codex --mode persistent --thread off`), or use natural language like “run this in Codex”. Use `/acp status`, `/acp close`, `/acp cancel`, `/acp sessions` to manage sessions. See the Chinese section above for the full command list.
