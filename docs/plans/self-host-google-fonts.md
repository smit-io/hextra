# Self-hosting Google Fonts: a `fonts.mode` param, inlined faces and preload

> **Status:** scoped 2026-09-13, not implemented. Scope agreed with the two
> decisions recorded under "Decisions taken" below.

## Context

`layouts/_partials/google-fonts.html` emits **three render-blocking
`<link rel="stylesheet">` elements** to `fonts.googleapis.com` — one each for the
heading, body and code family — plus two `preconnect` hints. Each of those
stylesheets then triggers woff2 requests to `fonts.gstatic.com`.

A browser cannot begin downloading a font until it has parsed a CSS rule naming
it. So every page today waits on two sequential round trips, to two
third-party hosts, before any text can render:

```
HTML → fetch googleapis CSS → read @font-face → fetch gstatic woff2 → text
```

This is not theoretical. A screen recording of `/docs/guide/shortcodes/cards/`
shows the card titles and subtitles still absent at 7 seconds, with "Waiting for
fonts.gstatic.com" in the status bar, while every image on the page had already
painted.

Self-hosting makes both hops same-origin. Inlining the `@font-face` rules and
preloading the font removes one hop altogether — and preloading is _only_
possible once we self-host, because while Google owns the CSS it also owns the
woff2 URLs, and rotates them.

## Measured facts

Families configured at `docs/hugo.yaml:224-246` — Sora (heading), Mozilla Text
(body), Google Sans Code (code). Fetched with a Chrome User-Agent:

| family                                   | `@font-face` blocks  | all subsets |
| ---------------------------------------- | -------------------- | ----------- |
| Sora `wght@100..800`                     | 2 (latin, latin-ext) | 48 KB       |
| Mozilla Text `wght@200..700`             | 2 (latin, latin-ext) | 31 KB       |
| Google Sans Code `ital,wght@0,300;1,300` | 22                   | 104 KB      |
| **total**                                | **26**               | **184 KB**  |

A Latin-script visitor downloads only 32 + 22 + 13 = **67 KB**. `unicode-range`
gating behaves identically when self-hosted, so publishing 26 subsets does not
cause anyone to download 26.

**Google serves different formats depending on User-Agent.** This will silently
ruin the feature if missed — baking TTF would be worse than doing nothing:

```
no User-Agent:  format('truetype')
Chrome UA:      format('woff2')
```

The heading and body families ship only latin and latin-ext, so Japanese,
Chinese and Persian text already falls back to system fonts today. Self-hosting
does not regress non-Latin coverage; there is nothing there to regress.

## Decisions taken

1. **A `fonts.mode` param, defaulting to current behaviour.** This is a theme
   other people install. Nobody's build should start calling Google because they
   upgraded the theme.
2. **Inline the `@font-face` rules and preload the Latin subset.** Hosting the
   files alone leaves the two-hop chain intact and would not close the
   blank-text window, which is the actual complaint.

## Design

`params.fonts.mode`, read in `google-fonts.html`:

- **`remote`** (default) — exactly what ships today. No behaviour change for any
  existing site and no new network dependency on upgrade.
- **`bake`** — fetch from Google at build time and self-host.
- **`local`** — the site vendored its own woff2 files and supplies the
  `@font-face` CSS at `assets/css/fonts-local.css`, which the partial inlines.
  This keeps the theme out of the business of guessing filenames, and gives
  anyone who wants zero build-time network an escape hatch.

`assets/css/variables.css:17-20` derives the family names and fallback stacks.
It is **not** touched: `mode` changes delivery only, never what is requested.

## Mechanism for `bake`

Follow the pattern already proven in
`layouts/_partials/scripts/medium-zoom.html`, which fetches a remote asset at
build time with `try`, handles `.Err`, then `resources.Copy` and `fingerprint`.

1. Build the same `css2?family=…` URL the partial builds today.
2. `resources.GetRemote` it **with a Chrome `User-Agent` header**.
3. Extract the `https://fonts.gstatic.com/…woff2` URLs from the response.
4. `resources.GetRemote` each woff2, `resources.Copy` to `fonts/<name>.woff2`.
5. `replace` each remote URL in the CSS with the local `.RelPermalink`.
6. **Split the result** rather than inlining all of it:
   - inline the latin and latin-ext blocks — about 6 blocks, ~2–3 KB
   - concat the remaining ~20 subsets into one fingerprinted same-origin
     stylesheet, loaded non-blocking
7. `<link rel="preload" as="font" type="font/woff2" crossorigin>` each inlined
   latin woff2.
8. Drop both `preconnect` hints — nothing third-party is left to connect to.

The split in step 6 is the point. Inlining all 26 blocks would add ~15.6 KB to
**every** HTML page, uncacheable between pages, and 20 of those blocks are
subsets almost nobody on this site needs. Inlining Latin only keeps the critical
path near zero while full script coverage stays available behind one cached
request.

## Files

- `layouts/_partials/google-fonts.html` — the whole change. Currently 30 lines
  of three near-identical blocks; these should collapse into one loop over
  heading/body/code as the modes are added.
- `layouts/_partials/head.html:30` — the call site. `head.html:40` already
  concats, minifies and fingerprints stylesheets and is the model for step 6.
- `docs/hugo.yaml:224` — add `mode: bake` for the docs site.
- `docs/content/blog/guide-google-fonts.md` and the font sections under
  `docs/content/docs/` — document the new param, in all four languages.

## Gotchas

- **`crossorigin` is mandatory on a font preload, even same-origin.** Without
  it the browser discards the preload and fetches the font again, which is
  strictly worse than not preloading at all.
- Google's woff2 URLs carry content hashes that rotate when a font is updated,
  so a warm cache and a cold build can disagree. `[caches.getresource]` maxAge
  governs how often it re-checks.
- A failed fetch must fall back to the remote `<link>`, **not** `errorf`.
  Unlike medium-zoom, a missing font is cosmetic and must never break a build.
- `font-display: swap` is already configured and should stay — it keeps text
  visible in the fallback while the woff2 arrives.
- Licensing permits self-hosting (OFL / Apache), but a theme redistributing font
  files should ship the license files alongside them.
- CI needs egress to `fonts.googleapis.com` and `fonts.gstatic.com` for the docs
  build once; the resource cache covers it after that.

## Reuse

- `layouts/_partials/scripts/medium-zoom.html` — the `try` / `.Err` /
  `resources.Copy` / `fingerprint` sequence for a build-time remote fetch.
- `layouts/_partials/head.html:40` — `resources.Concat` + `minify` +
  `fingerprint` over a slice of stylesheets.
- `assets/css/variables.css:17-20` — already produces the family names and
  fallback stacks; do not duplicate that logic.

## Verification

```bash
make fmt-check && make css && make build && make test
```

- `grep -r 'fonts.googleapis\|fonts.gstatic' docs/public --include='*.html'`
  must return nothing in `bake` mode. That is the entire point of the change.
- Confirm the inlined `<style>` carries only latin and latin-ext blocks, and the
  deferred stylesheet carries the rest.
- Confirm every preload has `crossorigin`, and that devtools does **not** warn
  "preloaded but not used" — that warning means `as` or `crossorigin` is wrong.
- Throttle to Slow 3G with cache disabled on `/docs/guide/shortcodes/cards/`,
  the page from the recording. Card titles must render in the fallback
  immediately and then swap, rather than staying blank.
- Set `mode: remote` and diff the rendered HTML against `main`. Must be
  byte-identical apart from fingerprints, proving the default is untouched.
- Set `mode: local` with a hand-written `assets/css/fonts-local.css` and confirm
  no remote fetch occurs.
- Check all four languages still render. Japanese, Chinese and Persian rely on
  the fallback stacks, which must be unaffected.
- Compare total transferred bytes for a cold load of `/` before and after.
