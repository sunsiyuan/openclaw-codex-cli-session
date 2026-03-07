# openclaw-codex-cli-session 落地计划（仅计划，不执行）

> 目标：在**不侵入主 Telegram 通道**、且不把运行中的 claw 单向“打死”**（避免粗暴接管/重启）**的前提下，完成 `openclaw-codex-cli-session` 的可运行 MVP 交付与首版提交。
>
## 0. 执行边界与原则

- 本计划只围绕 **session 级 Codex CLI 接入**，不做 router/switcher，不做 gemini，不做 `/model` 别名。
- 先验证环境与约定，再最小实现插件骨架，再做可运行验证。
- 全程优先“旁路验证”，避免占用/污染主运行实例。
- 若发现与 OpenClaw 官方 plugin API 不一致，先对齐文档再改代码，不编造接口。

---

## 1. 风险控制：避免占用主通道、避免单向打死运行 claw

### 1.1 隔离策略

1. **不在主 OpenClaw 进程上做破坏性重启**，先做离线/本地 smoke 验证。
2. **不对现网主进程做强制 kill / 独占接管**，先旁路验证后再灰度切换。
3. 需要联调时，优先：
   - 使用本地插件链接安装（`--link`）
   - 使用独立测试会话/临时 agent
   - 避免在主 Telegram 通道进行持续测试
4. 配置改动采用“最小可回滚”方式：
   - 先读取现有配置并备份
   - 新增独立 plugin entry（如 `codex-cli-session`）
   - 不覆盖主 provider 配置

### 1.2 回滚预案

- 任何 OpenClaw 配置变更前先备份。
- 若出现异常：
  1. 禁用插件 entry
  2. 恢复备份配置
  3. 重启/热重载回原路径
- Git 侧通过单独 commit 管理，确保可一键回退。

---

## 2. 分阶段实施计划

## 阶段 A：环境与现状核查（只读）

**目标**：确认可交付条件，避免后续中断。

检查项：
1. 当前目录是否为 `openclaw-codex-cli-session`（或是否需创建）。
2. Git 可用性：`git --version`、当前 repo 状态、默认分支策略。
3. SSH/Deploy key：
   - 远程连通性（`ssh -T` 对应 git host）
   - `git remote -v` 与权限是否可 push。
4. Codex CLI 可用性：`codex --version`、登录状态、`codex exec` 最小回显。
5. OpenClaw plugin 约定来源：
   - 读取官方/现有 plugin manifest 与 API 文档
   - 明确入口函数、注册方式、生命周期。
6. OpenClaw 当前运行状态（只读探测）：
   - 确认正在运行实例
   - 不进入主通道执行压力测试。

**阶段产出**：
- 核查结果清单（通过/阻塞）
- 若阻塞，列出最小解法（例如 SSH 权限失败、CLI 未登录）

---

## 阶段 B：仓库初始化与对接

**目标**：保证 repo 可提交、可推送、结构清晰。

步骤：
1. 本地目录不存在则创建：`/home/sun/.openclaw/workspace/openclaw-codex-cli-session`。
2. 如果本地非 git repo：`git init`。
3. 配置或校正 `origin` 到指定 SSH remote。
4. 若远端已有内容：
   - `git fetch`
   - 基于远端默认分支对齐（避免覆盖）
5. 若存在未提交改动：
   - 保持不破坏；必要时新建分支或分离提交。

**阶段产出**：
- 可正常 `git status`、`git remote -v`
- 具备 commit/push 条件

---

## 阶段 C：MVP 工程骨架实现（真实可运行）

**目标**：交付最小但真实执行链路。

必备文件：
1. `package.json`
   - `name: openclaw-codex-cli-session`
   - `main`/`type`/`scripts`（如 smoke/test）
2. `openclaw.plugin.json`（或官方约定的 manifest）
   - 插件 id/name/version/entry
   - 配置 schema（command/cwd/sandbox 等）
3. `src/index.js`
   - 插件入口，导出并注册 backend
4. `src/service.js`
   - OpenClaw plugin 生命周期与 backend 注册
5. `src/runtime.js`
   - 最小 `runTurn`：调用 `codex exec --json`
   - 解析事件流并抽取回复文本
   - persistent 下记录/复用 session/thread id（最小实现）
6. `src/config.js`
   - 默认值、配置校验、错误提示
7. `scripts/smoke.mjs`
   - 不依赖主通道的最短本地验证脚本

实现约束：
- 不伪造“已接管 session”；只实现已完成能力。
- 不引入多 provider 抽象层。
- 错误处理优先明确诊断（命令不可用、JSON 解析失败、超时）。

**阶段产出**：
- 本地可运行 smoke
- 插件可被 OpenClaw 识别（至少 doctor 可见）

---

## 阶段 D：README 与可验证说明

**目标**：让使用者可独立安装、配置、验证。

README 必须覆盖：
1. 解决的问题与边界（session 级 Codex CLI 接入）。
2. 为什么 prompt/skill 不足以实现该目标。
3. MVP 已实现能力。
4. 明确未实现能力（避免误导）。
5. 安装步骤（clone / install plugin / enable）。
6. 配置示例（OpenClaw 配置片段）。
7. 最短验证路径：
   - 本地 smoke
   - OpenClaw doctor
   - persistent 连续对话验证
8. 故障排查（CLI 未登录、权限、路径、超时）。

---

## 阶段 E：验证策略（不占主通道）

**目标**：在不影响主业务通道前提下完成验收。

验证顺序：
1. **静态检查**：`npm run lint`（如有）
2. **本地功能验证**：`npm run smoke`
3. **OpenClaw 插件识别验证**：`/acp doctor`
4. **会话复用验证**：在测试会话中发送两轮消息，确认 resume 生效

验收标准：
- 命令成功退出码为 0
- 输出包含可识别 Codex 文本
- doctor 显示 backend=`codex-cli`
- 不需要占用 Telegram 主通道完成上述验证

---

## 阶段 F：交付与发布动作

**目标**：完成可追踪交付。

步骤：
1. `git add` + 语义化 commit（首版 MVP）。
2. `git push origin <当前分支>`。
3. 输出结果：
   - 成功：commit hash / 分支 / push 结果
   - 失败：明确卡点（SSH 权限、远端保护策略、网络问题）
4. 给出“下一步人工验证清单”。

---

## 3. 里程碑与完成定义（DoD）

满足以下即视为第一版完成：
- 本地 repo 建立且可提交
- `origin` 配置完成
- 插件骨架代码齐全（入口/manifest/runtime/config）
- README 安装配置验证完整
- 至少 1 次 commit
- 可 push 则已 push，失败则有明确阻塞说明

---

## 4. 本计划执行顺序（建议）

1. 阶段 A（环境核查）
2. 阶段 B（仓库对接）
3. 阶段 C（骨架实现）
4. 阶段 D（文档完善）
5. 阶段 E（验证）
6. 阶段 F（commit/push 汇报）

> 说明：当前文档仅为执行计划，不包含实际执行结果。

---

## 5. 清晰度与可行性快速结论

### 5.1 清晰度结论

当前计划整体**清晰可执行**：
- 范围边界明确（仅 codex-cli session 接入，不扩张 router/switcher）。
- 分阶段结构完整（环境核查→实现→验证→交付）。
- 风险控制与回滚路径可操作（旁路验证、配置备份、可回退）。

### 5.2 可行性结论

当前计划在工程上**可行**，前提是阶段 A 的 4 个关键前置条件通过：
1. 本机 `codex` CLI 可执行且已登录；
2. OpenClaw 当前版本暴露可用 plugin/runtime backend 注册接口；
3. deploy key 对目标远端具备 push 权限；
4. 测试可在隔离会话完成（不依赖主通道）。

### 5.3 建议补充的 Go/No-Go 闸门（执行时使用）

- **Go（继续）**：上述 4 项均通过。
- **No-Go（暂缓）**：任一前置条件失败；先修复阻塞项再进入阶段 C。

> 说明：本结论用于回答“计划是否足够清晰/可行”，不改变原实施范围。

---

## 6. 哪些步骤需要真实 OpenClaw 安装

结论先行：**并非所有步骤都依赖真实 OpenClaw 安装**。可以先完成大部分离线工作，再进入少量在线联调步骤。

### 6.1 不需要真实 OpenClaw 安装（可离线完成）

1. 阶段 A 的通用环境检查（目录、git、ssh、codex CLI 登录状态）。
2. 阶段 B 仓库初始化与 remote 对接。
3. 阶段 C 的插件代码骨架开发（`package.json`、`openclaw.plugin.json`、`src/*`、`scripts/smoke.mjs`）。
4. 阶段 D 的 README 与安装/配置文档撰写。
5. 阶段 E 中的本地脚本验证：`npm run smoke`（仅验证 codex-cli 调用链，不验证 OpenClaw 集成点）。

### 6.2 需要真实 OpenClaw 安装（在线联调）

1. 插件装载验证：`openclaw plugins install -l .`（或等效插件安装命令）。
2. OpenClaw backend 注册可见性验证：`/acp doctor`。
3. persistent 会话复用联调：在测试会话里连续两轮消息，验证 resume 生效。
4. 灰度启用与回滚演练：仅在真实实例上验证配置变更、禁用插件、恢复备份是否可用。

### 6.3 建议执行顺序（最小化风险）

1. 先做 6.1 全部离线项；
2. 离线项通过后，再进入 6.2 的在线项；
3. 在线项只在隔离测试会话执行，避免影响主通道。

> 这样可以把“必须依赖真实 claw”的步骤压缩到最少，降低现网风险。

