# Accent contrast in light mode, and the oklch palette conversion bug

> **Status:** investigated 2026-09-14, not implemented. Two entangled problems
> found while auditing `text-hextra-accent-600`. Fix the palette question first —
> it changes every contrast number below.

## Why this exists

`tests/accessibility.spec.ts:6` disables the `color-contrast` rule for the
site-wide axe sweep:

```ts
// TODO: Re-enable once known baseline issues are resolved and tracked.
const DISABLED_RULES = ["color-contrast", "target-size"];
```

So nothing in CI checks contrast except one component — the page context menu
test at line 140 re-enables it for `.hextra-page-context-menu` only. That hole is
how a description line shipped at 4.475:1 on ~300 pages with the suite green,
which the file's own comment records.

Three contrast fixes have already merged on `fix/toc-active-indicator`, all
found by hand rather than by a test:

| commit    | what                                                                   |
| --------- | ---------------------------------------------------------------------- |
| `e279eeb` | context menu dropdown rows: accent tint, `accent-700` not `accent-600` |
| `b95d31d` | theme + language switcher hover, `accent-600` → `accent-700`           |
| `559a055` | archive and pager link hover, `accent-600` → `accent-700`              |

Those cleared every `hover:text-hextra-accent-600` under `layouts/`. Seventeen
more uses remain in `assets/css/`, which is what this plan covers.

## The palette bug — read this before trusting any ratio

`assets/css/styles.css:35-83` defines the light and dark neutral ramps in
`oklch()`, each with a hex comment recording the intended colour. **Every
percentage is the hex byte divided by 255**, written into the lightness slot:

```
#2d2d2d → 45/255 = 17.6471%  →  --color-hextra-dark-600: oklch(17.6471% 0 0); /* #2d2d2d */
```

oklch lightness is perceptual, not a channel fraction, so the two are not the
same colour. Near white the error is invisible; near black it is enormous:

| token              | oklch written | renders   | comment intends | off by |
| ------------------ | ------------- | --------- | --------------- | ------ |
| `hextra-light-50`  | 98.8235%      | `#fbfbfb` | `#fcfcfc`       | 1      |
| `hextra-light-100` | 97.2549%      | `#f6f6f6` | `#f8f8f8`       | 2      |
| `hextra-light-500` | 83.5294%      | `#c9c9c9` | `#d5d5d5`       | 12     |
| `hextra-light-950` | 66.6667%      | `#949494` | `#aaaaaa`       | 22     |
| `hextra-dark-50`   | 3.1373%       | `#000000` | `#080808`       | 8      |
| `hextra-dark-100`  | 6.6667%       | `#010101` | `#111111`       | 16     |
| `hextra-dark-600`  | 17.6471%      | `#111111` | `#2d2d2d`       | 28     |
| `hextra-dark-950`  | 26.6667%      | `#262626` | `#444444`       | 30     |

All 22 tokens are affected. The dark ramp was meant to span `#080808`–`#444444`
and actually spans `#000000`–`#262626`; `dark-50` and `dark-100` are within one
step of pure black, so the bottom of the ramp is nearly flat. This is why dark
mode reads as near-black rather than dark grey.

**The decision this forces.** Fixing the palette moves the dark page background
from `#111111` to `#2d2d2d`, which _lowers_ contrast for every light-on-dark
pairing. `accent-600` on `#111111` is 4.71:1 and passes; on `#2d2d2d` it is
3.36:1 and fails. So:

- Fix the palette first, then re-audit contrast against the corrected values, or
- Decide the current near-black dark mode is the intended look, correct the
  misleading comments instead, and audit against what renders today.

Doing contrast first and the palette later means doing contrast twice, and the
second pass would find failures the first pass declared clean.

## Reference values, as rendered today

Converted from the `oklch()` declarations, not from the hex comments.

| surface                     | colour    |
| --------------------------- | --------- |
| page background, light      | `#f6f6f6` |
| blog card background, light | `#fbfbfb` |
| page background, dark       | `#111111` |

| accent | on `#f6f6f6` | on `#fbfbfb` | on `#111111` |
| ------ | ------------ | ------------ | ------------ |
| 400    | —            | —            | 8.67         |
| 500    | —            | —            | 6.97         |
| 600    | **3.71**     | **3.88**     | 4.71         |
| 700    | 5.41         | 5.66         | 3.23         |
| 800    | 6.94         | 7.27         | —            |

The accent ramp is `--color-accent-color-*` at `styles.css:125-135`, default
sky. It is **user-configurable**, so every number here holds for the default
only. A site with a different accent needs its own audit — which is an argument
for enabling the axe rule rather than hard-coding shades.

## The seventeen sites

Backgrounds are assumed to be the page background unless noted. That assumption
is exactly what produced the wrong numbers in the first pass; verify each in a
browser before acting.

### Failing — light mode, `accent-600` at 3.71:1 against a 4.5:1 floor

| file:line           | selector                                 | note                                  |
| ------------------- | ---------------------------------------- | ------------------------------------- |
| `typography.css:31` | `:where(a)` in prose                     | every Markdown link on the site       |
| `blog.css:88`       | `.hextra-blog-sponsor-link`              |                                       |
| `blog.css:118`      | `.hextra-blog-chip[aria-current="page"]` | `text-sm`, so 14px                    |
| `blog.css:157`      | blog list title link, hover              |                                       |
| `blog.css:215`      | `.hextra-blog-card-title a`, hover       | on `#fbfbfb` card → 3.88, still fails |
| `page-meta.css:35`  | `.hextra-page-license-link:hover`        |                                       |
| `search.css:250`    | `.hextra-search-match`                   | background not verified — in dialog   |
| `series.css:86`     | series link hover                        |                                       |
| `series.css:91`     | `.hextra-series__current`                |                                       |
| `series.css:127`    | series nav hover                         |                                       |
| `tags.css:13`       | `.hextra-tag-chip` hover                 | chip is `bg-transparent`              |
| `tags.css:24`       | `.hextra-tag-count`                      |                                       |

`typography.css:31` is the one that matters most — it has **no `dark:` variant**,
so it is the single rule governing link colour in both modes across every docs
page and blog post. The underline satisfies 1.4.1 Use of Color; it does nothing
for 1.4.3 Contrast.

### Failing — dark mode, `accent-600` at 4.09:1 against the same 4.5:1 floor

| file:line                | selector                                                     | note                             |
| ------------------------ | ------------------------------------------------------------ | -------------------------------- |
| `nav-active.css:7` dark  | `accent-600` on `accent-400`@10% over `#111111` = 4.09:1      | `text-sm` semibold, so 14px      |

This one was filed under **Passing** in the first two passes, on the unstated
assumption that `font-semibold` buys the 3:1 large-text floor. It does not: WCAG
large text is 18pt (24px), or 14pt (18.66px) when bold. Both elements the rule
styles are 14px — `layouts/_partials/sidebar.html:291` and `blog.css:58` are
`hx:text-sm`, and `nav-active.css:7` adds `hx:font-semibold` — so the 4.5:1
floor applies exactly as it does to the 3.71:1 and 3.88:1 entries above, and
4.09:1 is under it.

It is the current-page indicator for the docs sidebar and the blog rail: always
on screen, on every docs page and every blog page, in dark mode. Treat it as
part of the same sweep, not as a margin to watch.

### Passing, and why

| file:line                     | reason                                                       |
| ----------------------------- | ------------------------------------------------------------ |
| `stats.css:22`                | `.hextra-stat__value` is `text-3xl` (30px) → large text, 3:1 |
| `blog.css:72`, `:318`, `:322` | icon-only `h-9 w-9` buttons → SC 1.4.11 non-text, 3:1        |
| `nav-active.css:7` light      | `accent-800` on `accent-200` = 5.66:1                        |
| every `dark:text-accent-400`  | 8.67:1 on `#111111`                                          |

### Corrections to the first pass

Recorded because the reasoning, not just the numbers, was wrong:

- `typography.css:31` was reported as failing in **both** modes at 3.36:1 dark.
  Dark passes at 4.71:1. Only light fails.
- `nav-active.css:7` dark was reported as the worst failure at 2.82:1. The real
  figure is 4.09:1 — still a failure, just not that one. The second pass then
  over-corrected and filed it as passing; see the dark-mode table above.
- Both errors came from reading hex out of the `/* */` comments beside the
  `oklch()` declarations instead of converting the declarations.

## The fix, once the palette question is settled

Same shape as the three merged commits: `accent-600` → `accent-700` in light,
which is 5.41:1 on the page and 5.66:1 on a card. Two need more than that:

- `typography.css:31` has no dark variant. Adding `dark:text-hextra-accent-400`
  makes it 8.67:1 and survives a palette correction, where bare `accent-600`
  would not.
- `nav-active.css:7` fails in dark mode at 4.09:1 against the 4.5:1 floor, on a
  translucent background. Moving its dark half to `accent-400` gives 7.52:1.

## Do this first

Get a real baseline instead of extending the hand-computed one. Delete
`"color-contrast"` from `DISABLED_RULES` in `tests/accessibility.spec.ts:6` and
run `make test-a11y`.

That is the only step here that measures rather than models. It sees computed
font sizes, real stacked backgrounds, opacity, and every element neither pass
looked at — hover states excepted, which axe cannot reach and which is how all
three merged fixes were found by hand.

Expect failures beyond this list. The rule has been off long enough that the
comment calls them "known baseline issues", and none of them are enumerated
anywhere.

## Files

| path                             | why                                                          |
| -------------------------------- | ------------------------------------------------------------ |
| `assets/css/styles.css:35-83`    | the 22 miscoverted oklch tokens                              |
| `assets/css/styles.css:125-135`  | the accent ramp, user-configurable                           |
| `assets/css/typography.css:31`   | prose links, no dark variant                                 |
| `assets/css/components/*.css`    | the other sixteen sites, listed above                        |
| `tests/accessibility.spec.ts:6`  | `DISABLED_RULES` — the gate to re-enable                     |
| `tests/accessibility.spec.ts:26` | precedent: the context menu test re-enables it per-component |

## Gotchas

- **Rebuild CSS after touching a class.** Tailwind tree-shakes from
  `docs/hugo_stats.json`. `make css` regenerates stats then compiles, in that
  order. Removing the last use of a class changes the stylesheet too — `657a763`
  exists only because `559a055` deleted the last `hover:text-hextra-accent-600`
  in `layouts/` and shrank `main.css` by 81 bytes on the next build.
- **Hover states are invisible to axe.** Every fix merged so far was a hover
  state. Re-enabling the rule will not find the next one.
- **Do not switch to APCA.** `AGENTS.md` mandates WCAG 2.2 AA and axe-core
  implements the WCAG 2 ratio. APCA is WCAG 3 draft and non-normative; findings
  from it cannot be confirmed by this repo's own gate.
- **`make test-a11y`'s budget scales with the sitemap.** A timeout there is a
  slow test, not a violation.
