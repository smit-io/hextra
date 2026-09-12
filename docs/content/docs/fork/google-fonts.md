---
title: Google Fonts
weight: 1
---

The fork adds first-class Google Fonts support: separate, individually configurable fonts for **headings**, **body text**, and **code**, using Google's modern variable-font `axes` syntax, with fallback stacks for when the fonts fail to load.

<!--more-->

## Quick start

Enable fonts in your site's `hugo.yaml`:

```yaml {filename="hugo.yaml"}
params:
  fonts:
    enable: true

    heading:
      family: "Sora"
      axes: "wght@100..800"
      display: "swap"

    body:
      family: "Inter"
      axes: "ital,wght@0,400;0,500;1,400"
      display: "swap"

    code:
      family: "JetBrains Mono"
      axes: "wght@400;500"
      display: "swap"

    # Used while fonts load and if Google Fonts is unreachable
    fallbacks:
      heading: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      body: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      code: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace"
```

That's it — no template overrides, no custom CSS required.

{{< callout type="warning" >}}
When `enable: true` is set, define **all three** font groups (`heading`, `body`, `code`) and the `fallbacks` block. The CSS variable generation reads all of them.
{{< /callout >}}

## Parameters

| Parameter           | Type    | Description                                                                                                                  |
| ------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `enable`            | boolean | Master switch. When `false` (or omitted), the theme uses the system font stack and loads nothing from Google.                |
| `<group>.family`    | string  | Exact Google Fonts family name, e.g. `"Inter"`, `"JetBrains Mono"`. Spaces are allowed — they are URL-encoded automatically. |
| `<group>.axes`      | string  | Variable-font axes spec from the Google Fonts embed URL (see below).                                                         |
| `<group>.display`   | string  | `font-display` strategy: `auto`, `block`, `swap`, `fallback`, or `optional`. Use `swap` unless you have a reason not to.     |
| `fallbacks.<group>` | string  | CSS font stack appended after the Google font.                                                                               |

`<group>` is one of `heading`, `body`, or `code`.

## Finding the `axes` value

Google Fonts moved from simple weight lists to an axes-based URL format. To get the right value:

{{% steps %}}

### Pick a font

Go to [fonts.google.com](https://fonts.google.com/), select a font, choose the styles/weights you want, and click **Get font** → **Get embed code**.

### Copy the embed URL

The embed code contains a link like:

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
```

### Extract family and axes

Everything before the `:` is the family (`Inter`); everything between the `:` and the `&` is the axes string (`ital,wght@0,400;0,500;0,600;0,700;1,400`).

{{% /steps %}}

Common axes patterns:

| Pattern                    | Meaning                                                                   |
| -------------------------- | ------------------------------------------------------------------------- |
| `wght@400;700`             | Static weights 400 and 700                                                |
| `wght@100..800`            | Full variable weight range 100–800 (single small file for variable fonts) |
| `ital,wght@0,400;1,400`    | Regular and italic at weight 400                                          |
| `opsz,wght@6..12,200..900` | Optical size + weight ranges                                              |

{{< callout type="info" >}}
Prefer range syntax (`wght@100..800`) for variable fonts — you get every weight from one request instead of one file per static weight.
{{< /callout >}}

## How it works internally

Three pieces cooperate, all build-time (no client-side JavaScript):

{{% steps %}}

### `layouts/_partials/google-fonts.html`

Included from `head.html`. When `params.fonts.enable` is true it emits `<link rel="preconnect">` hints for `fonts.googleapis.com` and `fonts.gstatic.com`, then one stylesheet `<link>` per configured group, building the `css2` URL from `family`, `axes`, and `display`. Each group is wrapped in `with`, so a group with no config produces no request.

### `assets/css/variables.css`

This file is executed as a Hugo template (`resources.ExecuteAsTemplate`), so it can read site params at build time. It defines three CSS custom properties on `:root`:

```css
:root {
  --font-heading: "Sora", system-ui, ...;
  --font-body: "Inter", system-ui, ...;
  --font-code: "JetBrains Mono", ui-monospace, ...;
}
```

When fonts are disabled, these resolve to the plain system stacks — the rest of the CSS never needs to know the difference.

### `assets/css/fonts.css`

Applies the variables: `html` gets `var(--font-body)`, `h1`–`h6` (and the typography plugin's headings) get `var(--font-heading)`, and `pre`, `code`, `kbd`, `samp`, and Hextra code blocks get `var(--font-code)`. In production builds this file is concatenated into the compiled stylesheet in `head.html`.

{{% /steps %}}

## Recipes

### One font everywhere

```yaml {filename="hugo.yaml"}
params:
  fonts:
    enable: true
    heading: { family: "Inter", axes: "wght@100..900", display: "swap" }
    body:    { family: "Inter", axes: "wght@100..900", display: "swap" }
    code:    { family: "JetBrains Mono", axes: "wght@400;500", display: "swap" }
    fallbacks:
      heading: "system-ui, sans-serif"
      body: "system-ui, sans-serif"
      code: "ui-monospace, monospace"
```

### Editorial look (serif headings)

```yaml {filename="hugo.yaml"}
params:
  fonts:
    enable: true
    heading: { family: "Fraunces", axes: "opsz,wght@9..144,300..900", display: "swap" }
    body:    { family: "Source Sans 3", axes: "wght@300..700", display: "swap" }
    code:    { family: "IBM Plex Mono", axes: "wght@400;500", display: "swap" }
    fallbacks:
      heading: "Georgia, 'Times New Roman', serif"
      body: "system-ui, sans-serif"
      code: "ui-monospace, monospace"
```

### This demo site

The site you are reading uses Sora for headings, Mozilla Text for body copy, and Google Sans Code for code — see [`docs/hugo.yaml`](https://github.com/smit-io/hextra/blob/main/docs/hugo.yaml) for the live configuration.

## Troubleshooting

- **Font doesn't change** — check the family name matches Google Fonts exactly (including spaces and capitalization), and hard-refresh: the stylesheet link only appears when `params.fonts.enable` is true.
- **Some weights render faux-bold** — the requested `axes` don't include that weight. Add it (or use a range).
- **Layout shift on load** — expected with `display: swap`; pick fallback stacks with similar metrics to reduce it, or use `display: optional` to prefer the fallback on slow connections.
- **Privacy/GDPR** — fonts are served from Google's CDN. If you must self-host, leave `fonts.enable: false` and add `@font-face` rules in `assets/css/custom.css` instead, then set the `--font-heading`/`--font-body`/`--font-code` variables yourself.
