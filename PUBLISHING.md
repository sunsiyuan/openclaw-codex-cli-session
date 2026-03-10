# Publishing Guide

## 1) Publish this plugin to npm

```bash
npm login
npm publish --access public
```

Then verify install path:

```bash
openclaw plugins install <your-npm-package>
```

## 2) Add to OpenClaw Community Plugins page

Official page:
- https://docs.openclaw.ai/plugins/community

Submission requirements (from docs):
- Package published on npmjs
- Public GitHub repo
- Setup/use docs + issue tracker
- Clear maintenance signal

**提交方式**：在 [openclaw/openclaw](https://github.com/openclaw/openclaw) 仓库中编辑 `docs/plugins/community.md`，在 “Listed plugins” 下按格式追加一条，然后提 PR。

**本插件可用的条目（复制到 community.md 的 Listed plugins 下）：**

```markdown
- **Codex CLI Session** — Use your Codex subscription from OpenClaw: run local Codex CLI in chat via `/codex` and ACP commands; supports persistent and oneshot sessions.
 npm: `codex-cli-session`
 repo: `https://github.com/sunsiyuan/openclaw-codex-cli-session`
 install: `openclaw plugins install codex-cli-session`
```

**操作步骤：**
1. Fork https://github.com/openclaw/openclaw
2. 克隆你的 fork，新建分支（如 `docs/add-codex-cli-session-plugin`）
3. 编辑 `docs/plugins/community.md`，在 “## Listed plugins” 里 WeChat 那条之后追加上面这段
4. 提交并 push 到你的 fork，在 GitHub 上对 `openclaw/openclaw` 的 `main` 开 PR，标题例如：`docs(plugins): add Codex CLI Session community plugin`
5. 在 PR 里说明：npm 已发布、仓库有 README/Issues、维护者会持续维护

## 3) If you also build a Skill version (optional)

Skill registry (ClawHub):
- https://docs.openclaw.ai/tools/clawhub
- https://clawhub.ai

Install CLI:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

Publish skill:

```bash
clawhub publish ./skills/<skill-folder> \
  --slug <skill-slug> \
  --name "<Skill Name>" \
  --version 1.0.0 \
  --tags latest
```

## 4) Publish GitHub Pages for this repo

This repo already includes:
- `.github/workflows/deploy-pages.yml`
- `docs/index.html`

After pushing to `master`, enable GitHub Pages in repo settings:
- Settings -> Pages -> Source: GitHub Actions
