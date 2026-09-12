---
title: "Guide: Dev Tooling and VS Code Snippets"
date: 2026-09-08
authors:
  - name: smit-io
    link: https://github.com/smit-io
tags:
  - Guide
  - Fork Features
series:
  - Fork Guides
seriesOrder: 6
---

Working on a Hugo theme means juggling a two-step CSS pipeline, a dev server, a production preview, and a pile of shortcode syntax you half-remember. The fork attacks all four: a self-documenting **Makefile** that encodes the build ordering, a Docker Compose **devcontainer** with an always-on preview server, **upstream sync helpers**, and **49 VS Code snippets** covering every shortcode and front matter block. This guide is the working tour.

<!--more-->

## The Makefile

Run `make help` for the full annotated list. The targets you'll actually live in:

### Developing

| Target           | What it does                                                                        |
| ---------------- | ----------------------------------------------------------------------------------- |
| `make dev`       | Dev server with the full theme pipeline (writes `hugo_stats.json` on every rebuild) |
| `make serve`     | Dev server without the theme pipeline — faster startup when only editing content    |
| `make css`       | Compile production CSS — regenerates stats first, so it's always correct            |
| `make css-watch` | Recompile CSS on change; run alongside `make dev`                                   |

The dependency chaining is the point. Tailwind tree-shakes against `docs/hugo_stats.json`, so compiling CSS after a template change requires regenerating stats _first_. Upstream's raw npm scripts make you remember that two-step dance; `make css` encodes it — it depends on `make stats`, and `make build` depends on `make css`. You can't get the order wrong.

### Writing content

| Target                            | What it does                                                                                         |
| --------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `make new-blog NAME=my-post`      | Scaffold a blog post as a draft, with tags, excerpt marker, and commented author/cover/pinned fields |
| `make new-doc NAME=guide/my-page` | Scaffold a docs page; `weight` left commented for manual placement                                   |
| `make new-doc-auto NAME=...`      | Like `new-doc`, but `weight` is set to one past the section's last page                              |

Blog posts start as drafts (`draft: true`): visible on the dev server and preview, excluded from `make build` until you remove the flag. `new-doc-auto` computes `weight` by scanning the target folder at creation time — spaced weight conventions (10, 20, 30…) yield 31, not 40, so it slots after without renumbering.

### Building, previewing, testing

| Target              | What it does                                                                             |
| ------------------- | ---------------------------------------------------------------------------------------- |
| `make build`        | Full production build into `docs/public`, drafts excluded — what ships                   |
| `make preview`      | Production build **including drafts**, served at [localhost:8043](http://localhost:8043) |
| `make test`         | Full Playwright suite against a fresh draft-free production build                        |
| `make test-a11y`    | Accessibility tests only (WCAG 2.2 AA)                                                   |
| `make test-preview` | Rebuild the preview, then test the live preview container                                |
| `make fmt`          | Prettier over templates, CSS, and JS                                                     |
| `make doctor`       | Diagnose toolchain problems (Hugo/Node versions, stale binaries)                         |

## The devcontainer

The fork runs its devcontainer under Docker Compose with two services:

- **`dev`** — the Go devcontainer image your editor attaches to. Devcontainer features install Hugo Extended (pinned) and Node 22; `postCreateCommand` runs `npm install`, so the container is build-ready on first open.
- **`preview`** — a tiny (~258 kB) static file server that serves `docs/public` read-only with `Cache-Control: no-store`, so you never debug a stale page. It starts with the dev container and stays up: re-running `make build` or `make preview` updates the served site with no restart.

A named volume masks `node_modules` inside the container, so the container keeps Linux-native npm binaries while your host keeps macOS ones — running `npm install` on one side no longer breaks the other.

### The two ports

| Port   | Service                     | What you get                                          |
| ------ | --------------------------- | ----------------------------------------------------- |
| `1313` | Hugo dev server             | Live-reloading development build                      |
| `8043` | Always-on preview container | The last **production** build — minified, tree-shaken |

The split matters: `1313` is fast iteration, `8043` is what production actually looks like. Check `8043` before releasing.

{{< callout type="warning" >}}
`make test` and `make build` bake the config's `baseURL` into `docs/public`, so after either, the preview at `8043` serves a build whose absolute URLs point elsewhere. Re-run `make preview` to restore it — or use `make test-preview`, which tests the preview build itself and leaves `8043` correct.
{{< /callout >}}

## Syncing with upstream

Two targets track [imfing/hextra](https://github.com/imfing/hextra):

- **`make sync-setup`** — one-time wiring: adds the `upstream` remote, fetches tags, creates an `upstream-main` branch as a fast-forward-only mirror. Never commit to it.
- **`make sync-status`** — shows drift (commits behind/ahead, latest upstream tag) and prints the fork-owned files expected to conflict on every merge: `assets/css/styles.css`, the Google Fonts files, accent-themed components, `static/icons/`, `.devcontainer/`, and the Makefile itself.

The merge discipline that keeps this painless: merge one release tag at a time (small, testable conflicts), resolve conflicts toward the fork's tokens (apply accent/palette classes to upstream's new components as part of the merge), and never hand-resolve generated files — take either side of `assets/css/compiled/main.css` and `docs/hugo_stats.json`, then run `make css` to regenerate.

## VS Code snippets

The fork ships `.vscode/hextra.code-snippets` — 49 hand-written snippets covering every Hextra shortcode, the front matter keys the layouts read, and the code-fence attributes the render hooks understand. Open the repo in VS Code and they work immediately; no extension, no configuration.

Type a prefix in any Markdown file and press `Tab`:

| Prefix    | Covers                     |
| --------- | -------------------------- |
| `hx`      | All shortcodes             |
| `hxfm-`   | Front matter blocks        |
| `hxcode-` | Fenced code block variants |

So `hxcallout` + `Tab` inserts a callout and lands you on a **dropdown of valid types** (`default`, `info`, `warning`, `error`, `important`) — enum parameters are choice placeholders, not free text. Same for badge colors, gallery types, `linenos` modes, and page width values.

Two details make these snippets more than autocomplete:

1. **They encode the notation trap.** Three shortcodes (`steps`, `details`, `include`) use `{{%/* … */%}}` percent delimiters so their inner content renders as Markdown; everything else uses `{{</* … */>}}`. Get it wrong and your content renders as literal text. Each snippet carries the right delimiters for its shortcode.
2. **They're sourced from the templates, not the docs.** Every parameter name comes from the `.Get "…"` calls in `layouts/_shortcodes/`, and every enum value from the style maps in `layouts/_partials/shortcodes/` — so they can't drift the way docs can. Deprecated parameters (`tabs items=`, `card tagType=`) are deliberately absent.

### Using them in your own site

The file is self-contained. Copy it into any Hugo site using Hextra:

```bash
mkdir -p .vscode
curl -o .vscode/hextra.code-snippets \
  https://raw.githubusercontent.com/smit-io/hextra/main/.vscode/hextra.code-snippets
```

{{< callout type="warning" >}}
You can also install the file globally in your user snippets directory, but then the snippets fire in **every** Markdown file you open — including non-Hugo projects, where `hxcallout` inserts syntax that renders as literal text. Prefer the per-project `.vscode/` copy unless Hextra is most of what you write.
{{< /callout >}}

Full references: [Dev Tooling](/docs/fork/dev-tooling) and [VS Code Snippets](/docs/fork/vscode-snippets) in the docs.
