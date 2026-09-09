---
linkTitle: Fork Features
title: Fork Features
weight: 10
---

This fork of [Hextra](https://github.com/imfing/hextra) adds a set of features on top of the upstream theme. This section documents everything that is unique to the fork, how each feature works internally, and how to configure it.

<!--more-->

## What's different from upstream?

| Feature        | Upstream                                                        | This fork                                                                               |
| -------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Typography     | Fixed system font stack                                         | Configurable [Google Fonts](google-fonts) for headings, body, and code                  |
| Theme color    | Single HSL primary color (`--primary-hue/saturation/lightness`) | Full 11-shade [accent palette](accent-color) in `oklch`                                 |
| Neutral colors | Flat `bg-white` / `#111` backgrounds                            | Dedicated 11-shade [light and dark palettes](color-palettes) in `oklch`                 |
| Code blocks    | Borderless, `rounded-xl`, faint highlight                       | [Bordered blocks](code-blocks), `rounded-sm`, accent line highlighting, file-type icons |
| Blog           | Single-column list                                              | [Three-column layout](blog) with identity rail, post cards, share buttons, and widgets  |
| Favicons       | Flat files in `static/`                                         | Organized under `static/icons/` with [dark-mode favicon](favicons) support              |
| Dev workflow   | npm scripts only                                                | [Makefile, devcontainer, and upstream-sync helpers](dev-tooling)                        |
| Authoring      | Read the docs to recall every parameter                         | [89 VS Code snippets](vscode-snippets) for shortcodes, front matter, and code fences    |

{{< cards >}}
{{< card link="google-fonts" title="Google Fonts" icon="sparkles" subtitle="Configurable heading, body, and code fonts with variable-font axes" >}}
{{< card link="accent-color" title="Accent Color" icon="color-swatch" subtitle="An 11-shade oklch accent palette used across every component" >}}
{{< card link="color-palettes" title="Color Palettes" icon="adjustments" subtitle="Neutral light and dark palettes replacing the flat backgrounds" >}}
{{< card link="code-blocks" title="Code Blocks" icon="code" subtitle="Borders, tighter radii, accent line highlighting, and file-type icons" >}}
{{< card link="blog" title="Blog Layout" icon="newspaper" subtitle="Identity rail, post cards, share buttons, and sidebar widgets" >}}
{{< card link="favicons" title="Favicons" icon="photograph" subtitle="Organized icon directory and automatic dark-mode favicon" >}}
{{< card link="dev-tooling" title="Dev Tooling" icon="terminal" subtitle="Makefile, devcontainer, and upstream sync workflow" >}}
{{< card link="vscode-snippets" title="VS Code Snippets" icon="cursor-click" subtitle="Tab-completion for every shortcode, front matter key, and code fence attribute" >}}
{{< /cards >}}

{{< callout type="info" >}}
The fork tracks upstream closely — upstream releases are merged in regularly and the compiled CSS is rebuilt after every merge. See [Dev Tooling](dev-tooling#syncing-with-upstream) for the sync workflow.
{{< /callout >}}
