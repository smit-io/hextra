---
title: Color Palettes
weight: 3
---

Upstream Hextra paints its backgrounds flat — `bg-white` in light mode, a single
`#111` in dark — and reaches for Tailwind's blue-tinted `gray` and `slate` for
everything else. The fork uses one achromatic family, **Tailwind's `neutral`**,
for every surface, border and piece of text.

<!--more-->

## One family, both modes

Every neutral in the theme is a `neutral-*` utility. Light mode uses the low end,
dark mode the high end, paired on the element:

```html
<div class="hx:bg-neutral-100 hx:dark:bg-neutral-900">…</div>
```

`neutral` is genuinely achromatic, unlike `gray` and `slate`, which carry a blue
cast. That matters most for body text, which is on screen the whole time a reader
is on the page: a warm accent against cool grey text reads as a mismatch even
when nothing looks obviously wrong.

## The levels

The theme uses four background levels per mode, and keeps them consistent so a
surface always sits where you expect relative to the page:

| Role                                 | Light         | Dark          |
| ------------------------------------ | ------------- | ------------- |
| Page background                      | `neutral-100` | `neutral-900` |
| Raised surface — code blocks, cards  | `neutral-50`  | `neutral-950` |
| Chrome — filename bars, menus, cards | `neutral-200` | `neutral-800` |
| Hover and raised-most                | `neutral-200` | `neutral-800` |

Note the direction flips between modes. In light mode a raised surface is
_lighter_ than the page; in dark mode it is _darker_. Borders run the other way
in both — `neutral-400` in light, `neutral-700`/`800` in dark.

## Customizing

Tailwind v4 exposes its own theme colors as CSS custom properties, so overriding
a shade is the same one-liner as [the accent color](accent-color) — put it in
your site's `assets/css/custom.css`, which Hextra loads after the theme's own
stylesheet:

```css {filename="assets/css/custom.css"}
:root {
  /* Warmer page background */
  --color-neutral-100: oklch(97.3% 0.005 85);

  /* Slightly blue-tinted dark background */
  --color-neutral-900: oklch(21% 0.01 250);
}
```

You only need to override the shades you want to change; the rest keep Tailwind's
defaults.

{{< callout type="warning" >}}
Keep the ordering of the ramp intact — each shade lighter or darker than its
neighbor, as in the defaults. Components assume the ramp is monotonic, so
inverting shades produces invisible borders and low-contrast text.
{{< /callout >}}

## Why `neutral` and not a custom ramp?

Earlier versions of the fork shipped four of its own ramps — `hextra-light-*`,
`hextra-dark-*`, `hextra-white-*` and `hextra-black-*` — alongside `gray`,
`slate` and `neutral`. Seven families for one job, with no rule about which to
reach for, and the two mode-specific ramps numbered in opposite directions:
`hextra-light-100` was nearly white while `hextra-dark-100` was nearly black.

Consolidating removes the ambiguity, and it removes a defect with it. The dark
ramp's `oklch` lightness values had been derived as `byte / 255` rather than
converted, so all eleven shades collapsed into the range `#000000`–`#262626` —
the first four were within two points of each other. `neutral` gives real
separation across its whole range.

`hextra-accent-*` is unaffected; the accent palette is still the fork's own. See
[Accent Color](accent-color).
