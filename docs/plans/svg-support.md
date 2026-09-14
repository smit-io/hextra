# Site-wide SVG support: dimensions, inlining, and a raster fallback for social

> **Status:** concept, 2026-09-14. Not scoped to a file list — the mechanisms
> are sketched but none is chosen. Written after `64bee54` closed the one
> unguarded code path and made the shape of the real gap visible.

## Where things stand

Six places in the theme process an image. Five check for SVG and skip; the sixth
did not until `64bee54`:

| file                                         | guard                            |
| -------------------------------------------- | -------------------------------- |
| `layouts/_shortcodes/card.html:45`           | `ne .MediaType.SubType "svg"`    |
| `layouts/_markup/render-image.html:63`       | `not (in (slice "svg" "gif") …)` |
| `layouts/_partials/utils/page-image.html:60` | `eq .MediaType.SubType "svg"`    |
| `layouts/_shortcodes/gallery-item.html:41`   | `$isSVG`                         |
| `layouts/_partials/blog/identity.html:28`    | `cond (eq … "svg") …`            |
| `layouts/list.rss.xml`                       | added by `64bee54`               |

They exist because Hugo's `.Process` / `.Resize` are raster-only, and Hugo
classifies `image/svg+xml` as resource type `image`, so an SVG reaches them
unless something stops it. `card.html:44` states it plainly: *".Process does not
work on svgs"*.

## The actual problem

Every guard is written as **skip the whole treatment**, not **take a different
path**. So an SVG gets none of the work the theme does for a raster image:

| what a raster image gets            | what an SVG gets |
| ----------------------------------- | ---------------- |
| `width`/`height` attributes         | nothing          |
| LQIP blur placeholder (inline WebP) | nothing          |
| WebP conversion at a capped width   | n/a, fine        |
| `data-zoom-src` for medium-zoom     | nothing          |

The first is the one that costs something real. `render-image.html`'s doc
comment says the point of the hook is that an image *"reserves its space before
it loads"* — that is Cumulative Layout Shift, and it is exactly what SVGs do not
get. A theme that works hard to avoid CLS has one image format that reintroduces
it.

The second matters less: an SVG small enough to be worth using is usually
smaller than the placeholder would be.

## Why this is worth doing now

Nothing about SVG was interesting until there was a reason to produce them in
bulk. There now is: `freeze` renders code snippets to SVG with the font embedded
as base64 `@font-face`, so the text stays selectable and searchable and renders
identically without the font installed.

Measured on a 17-line Makefile excerpt: **364 KB SVG against 1.1 MB PNG**. Less
than the 20× a vector format suggests, because the embedded font dominates — but
still 3×, and it scales and diffs properly.

Code snippets as SVG are the motivating case. Diagrams and logos are the same
shape of problem.

## Mechanisms, none chosen

### 1. Read dimensions out of the file

Hugo cannot give `.Width` on an SVG, but it can give `.Content`, and an SVG
declares its own geometry in the root element — `width`/`height` attributes, or
`viewBox` when those are absent. A partial could parse them with `findRE` and
return the pair, letting every call site emit real `width`/`height` and close
the CLS gap without touching `.Process`.

Unknowns: SVGs with neither attribute nor `viewBox`; percentage widths;
`preserveAspectRatio`. Needs a decision on what to emit when geometry is
unreadable — probably nothing, i.e. today's behaviour, rather than a guess.

### 2. Inline rather than link

`layouts/_partials/utils/icon.html` already does this: reads `.Content`, strips
`width`/`height`/`class`, injects `fill="currentColor"` and caller attributes,
returns `safeHTML`. That is how icons follow the theme's colours in both modes.

The same machinery could serve content SVGs, which would let a diagram inherit
the page's text colour instead of shipping two files for light and dark. It also
removes a request.

Costs: inlined markup is not cacheable separately, bloats the HTML, and the
sanitisation question is real for user-supplied files in a way it is not for
`data/icons.yaml`. Probably opt-in per call rather than a default.

### 3. Rasterise for social

Open Graph is the one place SVG cannot work at all. `page-image.html` feeds
`opengraph.html`, and Twitter, Facebook and LinkedIn do not render SVG preview
images — an SVG cover yields a card with no image.

Hugo cannot rasterise SVG natively. Options are all unattractive: require a PNG
sibling by convention, take a `cover` and an `ogImage` separately, or shell out
in a build step. The cheapest honest answer may be to document that covers must
be raster and warn at build time when one is not.

### 4. Say so in the skill

Whatever lands, `skills/hextra/references/markdown.md` and the `card` entry
should state where SVG is and is not appropriate. An agent given a `.svg` today
has nothing to go on.

## Sketch of a shape

A `utils/svg-dimensions.html` partial returning `{width, height}` or an empty
dict, called from the five guards that currently skip. Smallest change that
fixes the thing that actually costs something, and it does not commit to
inlining or to a social-image answer.

Inlining and OG rasterisation are separate decisions and should not ride along.

## Open questions

- Is CLS on SVG images observable on this site today, or theoretical? Worth
  measuring before building anything — `docs/` uses few SVGs, which may be
  precisely because they behave worse.
- Should `gif` come along? `render-image.html` skips it for a different reason
  (processing flattens the animation) but loses the same attributes.
- Does `imageZoom` do anything useful on a vector? Zooming an SVG is a no-op
  visually; possibly it should be suppressed rather than fixed.
- Should the theme refuse an SVG cover loudly, or quietly pass it through as it
  does now?

## Gotchas

- **Hugo counts SVG as resource type `image`.** `.Resources.ByType "image"` and
  `.Resources.GetMatch "*cover*"` both return them. That is the root cause of
  the RSS bug and any future one.
- **`.Width` is not available**, so guards must test `.MediaType.SubType`, never
  branch on a dimension being zero.
- **Six call sites, not one.** Any change needs applying consistently or the
  theme grows a second inconsistency of the kind `64bee54` just closed.
- **`64bee54` is unverified.** It was committed on the strength of the
  inconsistency, not a reproduction. Confirm it before building on it: put an
  SVG named `featured.svg` in a blog post's page bundle and `make build` on that
  commit and its parent.
