# Ad slots for Hextra: an `ad` shortcode plus named layout slots

> **Status:** implemented on `feat/ad-slots`. Scope agreed 2026-09-12.
> The design below is what shipped; the "What changed during implementation"
> section at the end records where reality differed from the plan.

## Context

Hextra has no way to place advertising. Today the only route is a site author
hand-writing `<script>` tags into `layouts/_partials/custom/head-end.html`, which
gives no per-page control, no layout reservation (so ads cause layout shift), no
dev/production separation, and no opt-out.

The goal is monetization that the author places deliberately: an `ad` shortcode
for arbitrary positions in Markdown — including mid-article, which is the only
way to get an ad between two paragraphs — plus four config-driven slots at fixed
points in the blog and docs layouts. Four providers are supported — AdSense,
EthicalAds, Carbon, and a raw-HTML escape hatch — because a docs theme's
audience is split between publishers who want AdSense revenue and those who want
the privacy-friendlier developer networks.

Two constraints discovered while scoping, both of which shape the design:

1. **There is no consent layer in this theme.** No CSP, no Hugo `privacy` block,
   and `params.banner` is dismiss-only with nothing reading its state. EU
   personalized ads therefore require a CMP configured in the publisher's own
   AdSense account. That is documented, not built.
2. **The demo site says it carries no ads.** `docs/hugo.yaml:360` reads
   `text: Hextra is built in the open, with no ads and no trackers.` So
   `params.ads` ships **commented out** in `docs/hugo.yaml`, and the docs page
   demos the `custom` provider, which needs no ad network. Nothing changes on the
   published demo site.

## Design

One renderer, two entry points. `layouts/_partials/ads/slot.html` produces all ad
markup; the shortcode and the layout slots are both thin callers. This is the
same shape as `layouts/_partials/shortcodes/button.html` and keeps provider logic
in exactly one file.

Loading follows the established store-flag dispatch: the renderer sets
`hasAds` and records which providers a page actually used, and
`layouts/_partials/scripts.html` emits each provider's loader once at body end —
identical to `hasChart` → `scripts/chart.html`. Every slot and every shortcode
renders inside the `main` block, which `baseof.html:45` runs before
`scripts.html`, so the flags are always set in time.

### The four slots

| Slot         | Where exactly                                                                             |
| ------------ | ----------------------------------------------------------------------------------------- |
| `blogBottom` | Blog post, immediately below the article body, above "last updated" and the share buttons |
| `blogEnd`    | Blog post, below the prev/next pager, immediately above the comments                      |
| `blogList`   | Blog index, interleaved after every Nth post card (`every`, default 4)                    |
| `docsBottom` | Docs page, immediately below the page body, above "last updated"                          |

Nothing in the navbar, footer, sidebar, TOC column, or home page.

Anything mid-article is the shortcode's job — auto-inserting there would mean
slicing rendered `.Content` HTML, which breaks on nested shortcodes and tables.

### Reserved: the left and right rails

The two fixed rails on blog pages are **deliberately excluded from this work and
reserved for sponsor placements**, which are a different product from ad-network
inventory and should not share a code path with it.

| Rail  | File                                  | Currently holds                                          |
| ----- | ------------------------------------- | -------------------------------------------------------- |
| Left  | `layouts/_partials/blog/rail.html`    | profile, tagline, sponsor box, language + theme switches |
| Right | `layouts/_partials/blog/widgets.html` | recent posts, pinned posts, trending tags                |

Why they stay separate:

- A sponsor is a named relationship with fixed creative, a fixed term, and a
  price agreed off-site. An ad slot is anonymous inventory an ad network fills
  per impression. They differ in how they are configured (one entry per sponsor
  versus one slot id), in whether they need a loader script (sponsors do not),
  and in whether they need a consent layer (sponsors do not).
- The machinery already exists and is already sponsor-shaped:
  `layouts/_partials/blog/sponsor.html` renders from
  `params.blog.rail.sponsor` (`docs/hugo.yaml:358-363`). A sponsor feature
  extends that. Routing it through `ads/slot.html` would drag an ad-network
  abstraction, a provider switch, and a production gate onto something that is
  just a link, an icon, and two lines of text.
- Both rails vanish below the `md` breakpoint. That is acceptable for a sponsor
  thank-you and poor for paid ad inventory, which is another reason not to
  conflate them.

Practical consequence for this plan: `ads/slot.html` is never called from
`blog/rail.html` or `blog/widgets.html`, and `params.ads.slots` has no rail key.
When sponsor slots are built, they extend
`layouts/_partials/blog/sponsor.html` and `params.blog.rail`, not this feature.

## Files

### New

**`layouts/_partials/ads/config.html`** — resolves `params.ads` + front matter
into one dict, modelled directly on `layouts/_partials/blog/config.html`
(presence is the switch, explicit `false` opts back out, Hugo lowercases keys so
index with lowercase names). Returns
`(dict "enable" ... "provider" ... "label" ... "slots" ... "creds" ...)`.

Rules:

- Disabled entirely when `params.ads` is absent — a site with no config renders
  byte-identical output to today.
- **Master kill switch: `params.ads.enable: false`.** Silences everything —
  loader, layout slots, shortcode output, and the dev placeholder — while
  leaving the client id and slot ids in place to switch back on. Read as
  `not (eq (index . "enable") false)`, the same presence-is-on /
  explicit-false-is-off test `blog/config.html:24` uses, so a bare `ads:` block
  with no `enable` key is still on.
- This switch outranks everything downstream, including a page that sets
  `ads: true` in front matter. Precedence, highest first:
  `params.ads` absent → `params.ads.enable: false` → front matter `ads: false`
  → per-slot config → shortcode call. The resolver returns early on the first
  two, so callers never have to re-check.
- Page opt-out `ads: false` in front matter, read with the nil-safe
  `cond (ne $p nil) $p $global` idiom from
  `layouts/_partials/components/page-context-menu.html:1-4`. A plain
  `| default` would swallow a legitimate `false`.
- `provider` defaults to `adsense`; anything outside
  `adsense|ethicalads|carbon|custom` gets `warnf` and disables the slot.
- Missing credentials for the selected provider (`adsense.client`,
  `ethicalads.publisher`, `carbon.serve`+`carbon.placement`) → `warnf` naming
  the missing key, and disable. `warnf` not `errorf`: a misconfigured ad must
  never break someone's build.

**`layouts/_partials/ads/slot.html`** — the renderer. Params:
`context` (page), `slot` (id or `true`), `provider`, `format`, `layout`,
`layoutKey`, `fullWidth`, `height`, `label`, `variant` (`""` | `list`),
`inner` (custom HTML). It emits the ad and nothing around it — no `<li>`, no
grid cell — so each caller supplies whatever wrapper its context requires.

- Outside `hugo.IsProduction`: emits `.hextra-ad--placeholder`, a dashed box at
  the reserved height labelled with provider, slot id and format. Never contacts
  an ad network locally, and never risks a policy strike from a dev build.
- Under production, per provider:
  - **adsense** — `<ins class="adsbygoogle" data-ad-client data-ad-slot
data-ad-format data-full-width-responsive>` followed by an inline
    `(adsbygoogle = window.adsbygoogle || []).push({})`. Push-before-loader is
    correct and deliberate: `adsbygoogle` is a queue array, which is exactly why
    the shared loader can sit at body end.
  - **ethicalads** — `<div data-ea-publisher data-ea-type
class="horizontal|vertical">`; loader shared.
  - **carbon** — `<script async src="//cdn.carbonads.com/carbon.js?serve=…&placement=…"
id="_carbonads_js">` emitted **inline at the slot**, because Carbon injects
    at its own script position. Second Carbon slot on a page gets `warnf` and
    renders nothing — Carbon serves one placement per page.
  - **custom** — renders a named creative from `params.ads.custom` through
    `safeHTML`. No loader, no network.
- Provider recording: read `adsProviders` off `.Page.Store` (`| default slice`),
  append if absent, set back. `scripts/ads.html` ranges it.
- `height` is interpolated into a `style="--hextra-ad-min-height:…"` attribute,
  so it is validated with `findRE "^[0-9]+(px|rem|em|vh)?$"` first; a
  non-matching value gets `warnf` and the default. An unvalidated param reaching
  a `style` attribute is an injection hole.
- Label from `(T "advertisement") | default "Advertisement"`, matching every
  other shortcode's i18n-with-fallback pattern.

**`layouts/_shortcodes/ad.html`** — thin wrapper. Doc comment written in the
no-trim `{{/* … */}}` form, with every `@example` closing on its own `>}}` line;
both are hard requirements recorded in `AGENTS.md:321-340`. Params via
`.Get "x" | default (.Get 0)`; booleans via the `eq (printf "%v" (.Get "x")) "true"`
comparison (a `| default` treats `false` as empty). Always self-closing — see the
implementation notes on why it cannot read inner content.

```
{{< ad slot="1234567890" >}}
{{< ad provider="ethicalads" type="text" >}}
{{< ad provider="carbon" >}}
{{< ad provider="custom" slot="sponsor" >}}
```

**`layouts/_partials/scripts/ads.html`** — loaders, one per provider actually
used on the page, ranged off the store slice:

- adsense: `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client={{ $client }}" crossorigin="anonymous">`, preceded by
  `<link rel="preconnect">` — the same preconnect courtesy
  `components/analytics/analytics.html:4` gives Google Tag Manager.
- ethicalads: `<script async src="https://media.ethicalads.io/media/client/ethicalads.min.js">`
- carbon: nothing (inline at the slot).

**`assets/css/components/ads.css`** — `.hextra-ad`, `__label`, `__slot`,
`--placeholder`, `--list`. All `@apply hx:` utilities, `hx:print:hidden` on the
wrapper, `min-height` from the CSS var so the space is reserved before the ad
paints (this is the whole CLS story). The `--list` variant matches the post
card's own margins so an interleaved ad sits on the list's rhythm rather than
crowding the card above it.

**`docs/content/docs/guide/shortcodes/ad.md`** — front matter is a bare
`title:`, per the house pattern in `swatches.md`. Live examples use
`provider="custom"` only. Covers the AdSense obligations the theme cannot handle:
`static/ads.txt`, a CMP for EU traffic, no ads on thin or error pages, never
click your own ads.

### Modified

| File                                  | Change                                                                                                                                                        |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `layouts/_partials/scripts.html`      | `hasAds` branch, appended in the existing flat dispatch style (see `:27-30`)                                                                                  |
| `layouts/blog/single.html:63`         | `blogBottom` slot after the `.content` div, before `last-updated`                                                                                             |
| `layouts/blog/single.html:89`         | `blogEnd` slot after the pagination block, before `components/comments.html`                                                                                  |
| `layouts/blog/list.html:22` and `:27` | `blogList` interleave — **both** loops need it, see below                                                                                                     |
| `layouts/docs/single.html:19`         | `docsBottom` slot after the `.content` div, before `last-updated`                                                                                             |
| `layouts/_shortcodes/include.html:80` | add `"hasAds"` to the propagation slice — `RenderShortcodes` binds `.Page` to the included page, so without this an included ad renders markup with no loader |
| `assets/css/styles.css:242`           | `@import "./components/ads.css";` before the `borderless-table.css` comment block                                                                             |
| `i18n/en.yaml`                        | `advertisement: "Advertisement"` — first entry in the `# User-facing UI text` group, which is alphabetized. Only `en.yaml`; the `                             | default` fallback makes the other 20 locales optional |
| `docs/hugo.yaml`                      | a commented-out `ads:` block near `imageZoom` (`:408`), with a note that the demo site deliberately runs no ads                                               |

`layouts/404.html` is intentionally untouched: it bypasses `baseof.html`, so it
gets no slots and no loader for free — which is what AdSense policy requires of
an error page.

### The blog index interleave

`layouts/blog/list.html` has **two** mutually exclusive render branches and the
slot has to work in both:

- **Card mode** (`:21-25`, what the demo site uses) — posts are `<li>` children
  of `<ul class="hextra-blog-list">`. A bare `<div>` there is invalid HTML, so
  the call site wraps the partial in its own
  `<li class="hextra-blog-list__ad">`.
- **Plain mode** (`:27-43`) — posts are sibling `<div class="hx:mb-10">`s, so
  the partial is emitted directly.

Both become `{{- range $i, $p := $paginator.Pages -}}` and test
`eq (mod (add $i 1) $every) 0` after each card. Two guards:

- Never after the final card on a page — the ad would land against the pager,
  effectively duplicating `blogEnd` two elements later.
- `every` is coerced with `int` and floored at 1; a `0` would divide by zero and
  fail the build.

The interleave count comes from `params.ads.slots.blogList.every`, so that one
slot takes a map where the others take a bare id. The resolver normalises both
shapes, the same way `blog/config.html` accepts `series: true` and
`series: { enable: true }`.

### Config shape

```yaml
params:
  ads:
    # Master switch. Flip to false to silence every ad on the site while
    # keeping the configuration below intact. Omit the key and ads stay on.
    enable: true
    provider: adsense # adsense | ethicalads | carbon | custom
    label: true # show the "Advertisement" caption
    adsense:
      client: ca-pub-XXXXXXXXXXXXXXXX
    slots:
      # Blog post, below the article body
      blogBottom: "1111111111"
      # Blog post, above the comments
      blogEnd: "2222222222"
      # Blog index, after every 4th post card
      blogList:
        slot: "3333333333"
        every: 4
      # Docs page, below the page body
      docsBottom: "4444444444"
```

A slot value is an AdSense slot id, or bare `true` for providers that need no
id, or a map when it carries extra keys like `every`. All three are accepted via
the dual-shape `printf "%v"` tolerance already used in `baseof.html:15-32`.
Omitting a slot leaves that position empty. Per-language override comes free —
`docs/hugo.yaml:37-67` shows params being overridden per language today.

Mid-article placement is not a slot and deliberately has no config: type
`{{< ad slot="…" >}}` at the point you want it, in a post or a docs page.

### Generated + registry files (CI-fatal if skipped)

- `scripts/build-skill.mjs:379` — new `CATEGORIES` entry `{ title: "Ads", names: ["ad"] }`.
  Without it the shortcode lands in an "Uncategorized" dump section.
- `.vscode/hextra.code-snippets` — `"Hextra: ad"` entry, prefix `hxad`, provider
  as a `${1|adsense,ethicalads,carbon,custom|}` choice so the generator picks up
  the enum. Strict JSON, no trailing commas.
- `skills/hextra/references/site-config.md` — an `## Ads` section. Required, not
  optional: `coverageGaps()` (`scripts/build-skill.mjs:644`) reports every new
  `site.Params.*` read that nothing under `skills/hextra/**/*.md` documents.
- `docs/content/docs/guide/shortcodes/_index.md` + `.fa.md` + `.ja.md` +
  `.zh-cn.md` — one `{{< card link="ad" title="Ad" icon="…" >}}` line each. The
  `icon=` value **must** exist in `data/icons.yaml`; an unknown name renders
  nothing, silently. Pick and verify before writing.
- `docs/content/docs/fork/vscode-snippets.md` + `.fa` + `.ja` + `.zh-cn` —
  prefix table row.
- `docs/content/docs/guide/configuration.md` — an `## Ads` section alongside the
  analytics ones.
- `AGENTS.md:73-85` — add `ad` to the hand-maintained grouped shortcode list.
- Then `npm run build:skill` and commit the regenerated
  `skills/hextra/references/shortcodes.md`. `--check` runs at
  `.github/workflows/test-build.yml:40` and exits 1 on any drift.

## Reuse

Nothing here invents a pattern. Each piece copies an existing one:

- config resolver → `layouts/_partials/blog/config.html`
- nil-safe page override → `layouts/_partials/components/page-context-menu.html:1-4`
- production gate → `layouts/_partials/components/analytics/analytics.html:1`
- store flag + dispatch → `layouts/_shortcodes/chart.html:32` and `scripts.html:27-30`
- shared loader with preconnect → `components/analytics/analytics.html:4`
- i18n with fallback → `layouts/_shortcodes/video.html:92`
- dual-shape config tolerance → `layouts/baseof.html:15-32`
- `warnf "ad: …"` recoverable-value wording → `layouts/_shortcodes/video.html:53`

## Verification

Commands to run (in the devcontainer, per `AGENTS.md:305`):

```bash
make fmt-check                 # confirms the new partials survive Prettier
npm run build:skill            # must leave a clean tree
make stats && make css         # in that order — Tailwind tree-shakes from hugo_stats.json
make build
make test                      # the a11y spec auto-enrolls the new docs page via sitemap.xml
```

Then three checks the commands above do not cover:

1. **Rendered-output diff.** Build `docs/` to a separate directory before and
   after and compare. With `params.ads` absent the HTML must be identical —
   that is the proof that existing sites are unaffected. Normalise asset
   fingerprints, `lastmod`, `wordCount` and the lastmod-ordered "Recently
   updated" widget first; they move whenever files are touched.
   Then diff a third build with the full `ads:` block present but
   `enable: false`: it must match the `params.ads`-absent build exactly. A kill
   switch that leaves a stray wrapper div or a preconnect behind is not a kill
   switch.
2. **Production markup.** Temporarily set `params.ads.adsense.client` and a
   `blogBottom` slot, then `hugo --environment production --themesDir=../..
--source=docs`. Confirm exactly one loader `<script>` per page, one `<ins>`
   per slot, and that the placeholder box is gone. Revert before committing.
3. **Keyboard, screen reader, and valid markup.** The ad wrapper must not be
   focusable or sit in the tab order, and the "Advertisement" caption must be
   real text rather than an `aria-label` on a div. Then check the blog index in
   both render branches — set `blog.list.card.enable` true and false — and run
   the resulting HTML through a validator: an interleaved ad must be an `<li>`
   in card mode and must not be one in plain mode.

Land on a `feat/ad-shortcode` branch through a PR. `test-build.yml`,
`test-accessibility.yml` and `test-mobile-menu.yml` all trigger on
`pull_request` only — a push to `main` runs none of them, including the
`build-skill --check` gate.

## What changed during implementation

Four things the plan got wrong, all found by building the site.

**`custom` cannot take inner content.** Hugo decides whether a shortcode is
paired by inspecting the template for a read of the shortcode's body, statically
and once — so a template that reads it for one provider makes `{{< ad slot="…"

> }}` illegal for _every_ provider:

```
failed to extract shortcode: shortcode "ad" must be closed or self-closed
```

A conditional guard cannot help. `custom` now runs **named creatives** defined
under `params.ads.custom` and selected with `slot`. This is better than the
plan: one creative can be reused by several placements, and a configured slot
can serve it — so `blogBottom` can run a house ad with no shortcode in any page,
which the plan explicitly ruled out.

**`ne (.Get "x") nil` does not detect an absent parameter.** For a call with
named parameters it reports true even for a parameter that was never passed, so
every unset bool was being forced to false: one call carrying `label=false`
stripped the label, border and background from every later ad on the page. The
fix is the idiom `video.html` already used — compare `printf "%v"` against the
strings `"true"` and `"false"`, since an absent parameter formats as `"<nil>"`
and matches neither.

**Prettier broke the templates twice**, both hazards already recorded in
`AGENTS.md`, both found only by building:

- a multi-line `{{- /* … */ -}}` comment had its closing `-}}` moved onto its
  own line, which Hugo cannot parse at all;
- a long conditional attribute was wrapped across lines, putting newlines inside
  the value — `data-full-width-responsive=" true "` on every page with an ad.

Every new template is now `prettier --check` clean, conditional attribute values
are computed into a variable before the tag, and the placeholder caption is
assembled with `delimit` because Prettier deletes a literal space next to a
template action.

**A skipped ad must not fall back to the placeholder.** The second Carbon
placement on a page is correctly skipped, but it then fell through to the
development placeholder — putting a dashed development box on a production page.

### Verified

Built four ways against a fixture page exercising all four providers, duplicate
Carbon, per-call overrides, a misspelled slot name and an invalid CSS length:

- production, ads enabled: 6 wrappers for 7 calls (duplicate Carbon skipped),
  one loader per network, one preconnect, zero placeholders, per-call overrides
  isolated to their own call
- development, ads enabled: 7 placeholders, zero real ads, zero loaders, zero
  third-party requests
- blog index: ads interleaved at the configured interval, each wrapped in its own
  `<li>`, never after the last card
- blog post and docs page: per-slot height, format and label overrides applied
  without leaking between slots

The three warnings the fixture provokes — unknown slot name, duplicate Carbon,
invalid length — all fire once and disable only what is broken.
