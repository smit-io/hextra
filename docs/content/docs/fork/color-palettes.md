---
title: Color Palettes
weight: 3
---

Beyond the [accent color](accent-color), the fork replaces upstream's flat backgrounds (`bg-white` in light mode, `#111` in dark mode) with dedicated **neutral palettes** — eleven shades each for light and dark mode, defined in `oklch`.

<!--more-->

## The palettes

All palettes live in `assets/css/styles.css` and are exposed as Tailwind v4 color tokens, so they can be used as utility classes anywhere in the theme (`hx:bg-hextra-light-200`, `hx:dark:border-hextra-dark-900`, …).

### Light mode — `hextra-light-*`

A tight greyscale ramp from near-white down to mid-grey:

| Token | Value | Hex |
|---|---|---|
| `hextra-light-50` | `oklch(98.8% 0 0)` | `#fcfcfc` |
| `hextra-light-100` | `oklch(97.3% 0 0)` | `#f8f8f8` |
| `hextra-light-200` | `oklch(93.7% 0 0)` | `#efefef` |
| `hextra-light-300` | `oklch(90.6% 0 0)` | `#e7e7e7` |
| `hextra-light-400` | `oklch(87.1% 0 0)` | `#dedede` |
| `hextra-light-500` | `oklch(83.5% 0 0)` | `#d5d5d5` |
| `hextra-light-600` | `oklch(80.4% 0 0)` | `#cdcdcd` |
| `hextra-light-700` | `oklch(76.9% 0 0)` | `#c4c4c4` |
| `hextra-light-800` | `oklch(73.3% 0 0)` | `#bbbbbb` |
| `hextra-light-900` | `oklch(70.2% 0 0)` | `#b3b3b3` |
| `hextra-light-950` | `oklch(66.7% 0 0)` | `#aaaaaa` |

### Dark mode — `hextra-dark-*`

A ramp of dark greys from near-black up:

| Token | Value | Hex |
|---|---|---|
| `hextra-dark-50` | `oklch(3.1% 0 0)` | `#080808` |
| `hextra-dark-100` | `oklch(6.7% 0 0)` | `#111111` |
| `hextra-dark-200` | `oklch(9.0% 0 0)` | `#171717` |
| `hextra-dark-300` | `oklch(11.0% 0 0)` | `#1c1c1c` |
| `hextra-dark-400` | `oklch(13.3% 0 0)` | `#222222` |
| `hextra-dark-500` | `oklch(15.7% 0 0)` | `#282828` |
| `hextra-dark-600` | `oklch(17.6% 0 0)` | `#2d2d2d` |
| `hextra-dark-700` | `oklch(20.0% 0 0)` | `#333333` |
| `hextra-dark-800` | `oklch(22.4% 0 0)` | `#393939` |
| `hextra-dark-900` | `oklch(24.3% 0 0)` | `#3e3e3e` |
| `hextra-dark-950` | `oklch(26.7% 0 0)` | `#444444` |

### Extra ramps — `hextra-white-*` and `hextra-black-*`

Two additional full-range greyscale ramps (`#ffffff` → `#292929` and `#f6f6f6` → `#000000`) are defined for cases where you need higher-contrast neutrals than the tight `light`/`dark` ramps provide.

## Where they are used

- **Page background** — `body` uses `hextra-light-100` in light mode and `hextra-dark-600` in dark mode (instead of upstream's pure white / `#111`). Dark mode is intentionally *not* pure black: content surfaces (code blocks at `hextra-dark-50`, headers at `hextra-dark-700`) sit visibly above or below the page background.
- **Code blocks** — backgrounds, borders, and filename headers; see [Code Blocks](code-blocks).
- **Section borders** — e.g. `h2` underline borders use `hextra-dark-900` in dark mode.
- **Component chrome** — search, sidebar, steps, alerts, gallery, navbar, and jupyter components were all migrated from `primary`-tinted greys to the palette tokens.

## Customizing

The palette variables follow the same pattern as the accent color — override them in `assets/css/custom.css`:

```css {filename="assets/css/custom.css"}
:root {
  /* Warmer light background */
  --color-hextra-light-100: oklch(97.3% 0.005 85);

  /* Slightly blue-tinted dark background */
  --color-hextra-dark-600: oklch(17.6% 0.01 250);
}
```

You only need to override the shades you want to change; the rest keep their defaults.

{{< callout type="warning" >}}
Keep the *ordering* of the ramp intact (each shade darker/lighter than its neighbor as in the defaults). Components assume the ramp is monotonic — inverting shades will produce invisible borders or low-contrast text.
{{< /callout >}}

## Why `oklch`?

`oklch` is a perceptually uniform color space: equal steps in the lightness channel look like equal steps to the eye, which hex/HSL cannot guarantee. For greyscale ramps this means the visual distance between `100` and `200` matches the distance between `800` and `900`. It also makes tinting trivial — add a small chroma value and a hue to any shade without re-tuning its lightness. Every shade carries its hex equivalent in a comment in `styles.css` for reference.
