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

Submit via PR with:
- Plugin name
- npm package name
- GitHub repo URL
- One-line description
- Install command

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
