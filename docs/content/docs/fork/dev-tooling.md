---
title: Dev Tooling
weight: 6
---

The fork ships a development workflow on top of upstream's npm scripts: a self-documenting **Makefile**, a Docker Compose–based **devcontainer** with an always-on preview server, and helpers for **syncing with upstream**.

<!--more-->

## Makefile

Run `make help` for the full annotated list. The important targets:

| Target | What it does |
|---|---|
| `make dev` | Dev server with the full theme pipeline (writes `hugo_stats.json` on every rebuild) |
| `make serve` | Dev server without the theme pipeline — faster startup when you're only editing content |
| `make stats` | Regenerate `docs/hugo_stats.json` (the class inventory Tailwind tree-shakes against) |
| `make css` | Compile production CSS — regenerates stats first, so it's always correct |
| `make css-watch` | Recompile CSS on change; run alongside `make dev` |
| `make build` | Full production build into `docs/public` (compiles CSS first) |
| `make test` / `test-mobile` / `test-build` | Playwright suites |
| `make fmt` | Prettier over templates, CSS, and JS |
| `make doctor` | Diagnose toolchain problems (Hugo/Node versions, stale binaries) |
| `make reset` | Wipe and reinstall `node_modules` — fixes host/devcontainer binary clashes |
| `make clean` / `clean-stats` / `clean-all` | Remove build output, stats churn, or everything |

{{< callout type="info" >}}
The dependency chaining is the point: `make css` depends on `stats`, `make build` depends on `css`. Upstream's raw npm scripts require you to remember the two-step "regenerate stats, then build CSS" dance ([why](https://github.com/smit-io/hextra/blob/main/CLAUDE.md)); the Makefile encodes it.
{{< /callout >}}

There is also an `npm run watch:css` script (fork-only) mirroring `make css-watch` for those who prefer npm.

## Devcontainer

Upstream uses a plain devcontainer image. The fork runs the devcontainer under **Docker Compose** (`.devcontainer/docker-compose.yml`) with two services:

- **`dev`** — the Go devcontainer image your editor attaches to, with the repo mounted at `/workspaces/hextra`.
- **`preview`** — a tiny (~258 kB) static file server (`pierrezemb/gostatic`) that serves `docs/public` read-only, with `Cache-Control: no-store` so you never debug a stale page. It starts with the dev container and stays up: re-running `make build` updates the served site with no container restart.

`devcontainer-lock.json` is tracked for reproducible tool versions.

A named volume masks `node_modules` inside the container, so the container keeps its own Linux-native npm binaries (e.g. `lightningcss`) while the host keeps macOS ones — running `npm install` on one side no longer breaks the other.

## Syncing with upstream

The fork adds two Makefile targets for tracking [imfing/hextra](https://github.com/imfing/hextra):

### `make sync-setup`

One-time wiring: adds the `upstream` remote, fetches tags, and creates an `upstream-main` branch as a **fast-forward-only mirror** of `upstream/main`. Never commit to it.

### `make sync-status`

Shows current drift — commits behind/ahead of upstream, the latest upstream tag — and prints the list of **fork-owned files** that are expected to conflict on every merge:

- `assets/css/styles.css` — accent/light/dark palettes
- `assets/css/fonts.css` and `layouts/_partials/google-fonts.html` — fork-only Google Fonts
- `assets/css/components/*.css` and `layouts/_partials/*.html` — accent theming
- `static/icons/` — favicon reorg
- `.devcontainer/`, `Makefile` — fork-only tooling

### Sync workflow

{{% steps %}}

### Merge one release tag at a time

Merge `v0.x.y` tags individually rather than jumping straight to `upstream/main` — conflicts stay small and each merge is testable.

### Resolve conflicts toward the fork's tokens

When upstream adds new components, apply the accent/palette tokens to them as part of the merge (see the fork's history: "Apply accent theming to upstream's new components").

### Regenerate, don't merge, build artifacts

`assets/css/compiled/main.css` and `docs/hugo_stats.json` are generated files. Never hand-resolve conflicts in them — take either side, then run `make css` to regenerate.

{{% /steps %}}
