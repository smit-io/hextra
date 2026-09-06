---
title: Code Blocks
weight: 4
---

The fork restyles code blocks for a crisper, more "editor-like" look: visible borders in both modes, tighter corner radii, palette-based backgrounds, and accent-colored line highlighting. All changes live in `assets/css/highlight.css` and require no configuration — they apply to every fenced code block.

<!--more-->

## What changed vs upstream

| Aspect | Upstream | This fork |
|---|---|---|
| Border | None | 1px border: `hextra-light-900` (light), `neutral-700` (dark) |
| Corner radius | `rounded-xl` | `rounded-sm` |
| Background | Translucent primary tint (`primary-700/5`) | Solid palette: `hextra-light-50` / `hextra-dark-50` |
| Filename header | Primary-tinted, `rounded-t-xl` | Palette background (`hextra-light-200` / `hextra-dark-700`) with border, `rounded-t-sm` |
| Line highlight | Faint `primary-800/10` wash | Accent background + 2px accent left border, tuned per mode |
| Copy button | Broken contrast in light mode | Fixed, accent-styled |

## Line highlighting

Highlight lines the standard Hugo way; the fork styles them with the [accent palette](accent-color):

````markdown {filename="Markdown"}
```go {hl_lines=[3,4]}
package main

import "fmt"       // highlighted
func main() {}     // highlighted
```
````

will be rendered as:

```go {hl_lines=[3,4]}
package main

import "fmt"       // highlighted
func main() {}     // highlighted
```

Rendering:

- **Light mode**: `hextra-accent-200` background at 60% opacity with a 2px `hextra-accent-500` left border
- **Dark mode**: `hextra-accent-950` background at 60% opacity with the same `hextra-accent-500` border

Because these are accent tokens, changing your accent color automatically recolors highlights.

## Line numbers

Blocks with `linenos=table` get special border handling. Chroma renders line-numbered code as a two-cell table (numbers | code), which breaks a naive border. The fork splits the border across the cells:

- First cell (`.lntd:first-child pre`): left + top/bottom borders, rounded left corners
- Last cell (`.lntd:last-child pre`): right + top/bottom borders, rounded right corners

The result is one continuous border around the whole table. Highlighted lines inside the code cell also drop their left accent border (it would otherwise appear mid-block, between numbers and code).

````markdown {filename="Markdown"}
```go {linenos=table,hl_lines=[2]}
package main
func main() {}
```
````

will be rendered as:

```go {linenos=table,hl_lines=[2]}
package main
func main() {}
```

## Filename headers

````markdown {filename="Markdown"}
```yaml {filename="hugo.yaml"}
params:
  fonts:
    enable: true
```
````

will be rendered as:

```yaml {filename="hugo.yaml"}
params:
  fonts:
    enable: true
```

The filename bar sits flush on top of the block with its own border and palette background (`hextra-light-200` light / `hextra-dark-700` dark), visually reading as an editor tab.

## All together

Filename, line numbers, and accent highlighting combine:

````markdown {filename="Markdown"}
```python {filename="hello.py",linenos=table,hl_lines=[2,5]}
def say_hello():
    print("Hello!")

def main():
    say_hello()
```
````

will be rendered as:

```python {filename="hello.py",linenos=table,hl_lines=[2,5]}
def say_hello():
    print("Hello!")

def main():
    say_hello()
```

## Code font

When [Google Fonts](google-fonts) are enabled, code blocks (and inline code) use the configured `code` font via `var(--font-code)` — no extra setup.

## Customizing

Everything is driven by the palette and accent tokens, so the usual override path applies — set variables in `assets/css/custom.css`:

```css {filename="assets/css/custom.css"}
:root {
  /* Lighter code block background in dark mode */
  --color-hextra-dark-50: oklch(9% 0 0);
}
```

For structural changes (radius, border width), override the classes directly:

```css {filename="assets/css/custom.css"}
.hextra-code-block pre:not(.lntable pre) {
  border-radius: 0.5rem; /* back to a rounder look */
}
```
