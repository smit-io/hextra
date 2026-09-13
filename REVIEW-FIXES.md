# Page context menu review — fix log and resume notes

Working branch: **`fix/context-menu-review`** (off `main`, in this repo).

This file exists so the work can be picked up cold. Delete it — and
`.review-tools/` — before the branch lands.

---

## What this repo is

`/Users/smit/Code/hextra2` had **no `.git`** and none of the dotfiles. It is a
dotfile-stripped, otherwise byte-identical copy of `/Users/smit/Code/hextra`,
which is a clean checkout at `origin/main` (`3335046`, the merge of PR #13
`feat/context-menu-descriptions`).

Baseline commit `4467f01` did two things:

- `git init` here, with `main` as the initial branch.
- Restored the dotfiles the repo needs to build and lint, copied from
  `/Users/smit/Code/hextra`: `.gitignore`, `.gitattributes`, `.prettierrc`,
  `.prettierignore`, `.github`, `.claude-plugin`, `.vscode`, `.devcontainer`.
  Without `.gitignore` the first commit would have swallowed `node_modules`;
  without the others there is nothing to lint against.

There is **no shared history with `imfing/hextra` or with `~/Code/hextra`**, so
this branch cannot be pushed as a PR against either. To land it, the commits
have to be replayed onto a real checkout (`git format-patch` / `git am`, or
cherry-pick with `--no-commit` from a remote added by path).

## Where the findings came from

A `/code-review max` run over PR #13. 15 findings, all reproduced empirically
before being fixed. **Finding 15 (the `Makefile` `test: fmt-check build`
change) is explicitly out of scope — the user said not to fix it.**

One fix per commit, in the order below.

## Done (11 commits)

| #   | Commit    | What                                                                                        |
| --- | --------- | ------------------------------------------------------------------------------------------- |
| 1   | `43243ac` | Description text AA contrast: `text-gray-500` → `text-gray-600` in light mode               |
| 2   | `a574bb5` | Dropped `whitespace-nowrap` from the row class; panel got `w-max` + max-width clamp         |
| 3   | `ae24229` | Physical `left/right` insets → logical `start/end`, fixing RTL clipping                     |
| 4   | `6cdeadf` | Added the localised Claude link to `fa`/`ja`/`zh-cn` in `docs/hugo.yaml`                    |
| 5   | `f80f0fc` | External-link arrow gated on `externalLinkDecoration` + URL scheme                          |
| 6   | `fc76688` | `(T "key") \| default "English"` on all six built-in strings                                |
| 7   | `d3467cb` | `aria-label` + `aria-describedby` so the name is the label, not label+description           |
| 8   | `cc93210` | Removed the leading trim that fused a custom link's label and description                   |
| 9   | `0a82e11` | Icon box rendered even when a custom link has no icon                                       |
| 10  | `12a7006` | `aria-hidden` on the component's decorative icons, plus a dedupe guard in `utils/icon.html` |
| 11  | `7fa8c64` | Arrow-key navigation, focus-on-open, `aria-controls` for the `role="menu"`                  |

Measured numbers for each are in the commit bodies — they are the record, not
this table.

Two of these went further than the finding, deliberately, and the commit says
so:

- **10** also covers the split button's own icons, and adds the `aria-hidden`
  dedupe to `layouts/_partials/utils/icon.html`. That turned out to fix a
  latent bug: the docs build had **47** `<svg>` tags carrying `aria-hidden`
  twice, because eight other call sites pass the attribute for an
  author-chosen icon and 235 of the 272 icons in `data/icons.yaml` already set
  it. After the guard: 0.
- **6** covers the labels as well as the two new description keys, since a
  fallback description under an empty label still leaves the row unnamed.

## Remaining (3)

### 12 — `tests/accessibility.spec.ts` cannot see this component _(do this one first)_

`DISABLED_RULES = ["color-contrast", "target-size"]`, and the spec does
`page.goto()` then `axe.analyze()` with no interaction. The dropdown ships with
`hx:hidden`, and axe skips `display:none` subtrees — so every element the PR
added is outside the scanned tree on all ~300 pages. `make test-a11y` and
`.github/workflows/test-accessibility.yml` both went green on a change carrying
a measured 1.4.3 failure and a measured 1.4.10 failure.

Fix: open the menu in the spec, and re-enable `color-contrast` for that
subtree. **Findings 1 and 2 are already fixed, so this should pass on the
current branch** — if it does not, that is a real regression, not a flaky test.
Worth also asserting at a 320px viewport so 1.4.10 stays covered.

Budget note from `AGENTS.md`: the a11y suite scales with the sitemap, and a
timeout there is a slow test, not a violation.

### 13 — Label in Name on the split button (WCAG 2.5.3, Level A)

`layouts/_partials/components/page-context-menu.html`, the
`.hextra-page-context-menu-copy` button: visible text is **"Copy Page"**
(`$copyLabel` is _not_ used there — that is `i18n "copyPage"`), while `title`
and `aria-label` are **"Copy as Markdown"** (`$copyLabel`). `aria-label`
overrides the contents, so the accessible name does not contain the visible
label and speech input cannot reach it. axe will not catch it:
`label-content-name-mismatch` is `wcag21a` + experimental, and `WCAG_TAGS` is
`[wcag2a, wcag2aa, wcag22aa]`.

**Read fix 7 before touching this.** After fix 7 the three controls now report:

- split button — visible "Copy Page", accessible name "Copy as Markdown"
- toggle — "Toggle page context menu"
- copy row — name "Copy as Markdown", description "Copy page as Markdown for
  LLMs"

The row's name is now _intentionally_ equal to the split button's aria-label,
because clicking the row forwards to the button (`page-context-menu.js`, the
`data-action="copy"` handler). Whatever fix 13 does to the button's name has to
keep those two in step, or it silently undoes part of fix 7. Simplest option:
make the accessible name contain the visible label (e.g. drop the `aria-label`
so the name becomes "Copy Page", and make the row's label match) — but that is
a copy decision, so it is worth asking rather than guessing.

Verify with `.review-tools/axtree.mjs` (CDP AX tree) plus a
`getByRole('button', { name: /Copy Page/ })` check.

### 14 — `skills/hextra/references/site-config.md`

Two separate errors in the shipped skill reference, which is the only
`contextMenu` documentation inside the plugin:

- **line ~467** lists only `{url}` and `{title}` as substituted placeholders.
  `page-context-menu.html` passes `markdown_url` too, and
  `docs/content/docs/guide/configuration.md:679` documents it for end users.
- **line ~453** claims the raw-Markdown twin "is what the page context menu's
  _Open in ChatGPT / Claude_ links point at". It is not — the shipped hrefs
  substitute the HTML permalink. An agent trusting that could drop `markdown`
  from `outputs.page` on a site with no AI links, which removes the entire menu
  (the template gates everything on `.OutputFormats.Get "markdown"`).

After editing: **`npm run build:skill`**, or CI's `build-skill --check` gate
fails. Note `site-config.md` may itself be generated — check
`scripts/build-skill.mjs` before hand-editing, and fix the source if so.

## Not being fixed

**15 — `Makefile`, `test: fmt-check build`.** Out of scope by instruction.
Recorded here only so nobody re-finds it and assumes it was missed. The three
real problems were: make does not order prerequisites under `-j`; the CI
formatter gate the comment cites does not exist (grep `.github/workflows/` for
`prettier` or `fmt` — nothing); and only `test` gained the dependency while
`test-a11y`, `test-mobile`, `test-build` and `test-preview` did not.

## Also found, never filed

Cut for the reviewer's 15-item cap. None are fixed, none are in scope unless
asked:

`hx:max-h-80` diverges from the `hx:max-h-64` shared by the theme's three other
dropdowns · the "View as Markdown" row opens a new tab with no arrow
affordance · both shipped custom links carry identical description text ·
`{{ with .description }}` silently drops `description: 0` / `false` ·
`hx:select-none` blocks selecting author-written link text ·
`hx:flex hx:flex-col hx:gap-0.5` is repeated three times while four sibling
class strings were hoisted · the doc comment called the rows "a two-column
grid" (they are flex) — partly rewritten by fixes 2, 7 and 9, so re-read it
before filing · `assets/css/components/search.css` already ships the same
label-plus-muted-subtitle primitive · `utils/icon.html` is called via uncached
`partial` (~1.4s per build reclaimable via `partialCached`) · the branch that
introduced all this carried an unrelated `build(make)` commit against
`AGENTS.md`'s one-branch-per-change rule.

Verified clean, so do not re-hunt: all 21 i18n files have both new keys; every
new `hx:` class reaches the compiled CSS; `build-skill --check`,
`claude plugin validate --strict` and `prettier --check` pass and `VERSION`
matches both manifests; `rotate-270` is a real Tailwind v4 utility;
`.name`/`.description` are correctly escaped; `hx:text-start` is a genuine fix
for the UA stylesheet centring `<button>` text; and the focus ring survives
`hx:outline-none` because `styles.css:214` applies `hextra-focus` as a
box-shadow (measured — the "focus indicator removed" hypothesis is refuted).

---

## How to verify anything here

Everything below runs on the host. Hugo 0.166.0 extended, Node 25, Prettier
3.8.3 are all present and working; no devcontainer needed for these.

```bash
make css      # regenerates docs/hugo_stats.json, THEN compiles — order matters
make build    # production build into docs/public (~2s)
npx prettier --check <file>
```

### Gotchas that cost time

- **`npm run build:css` rewrites `package-lock.json`**, changing `"name"` from
  `hextra` to `hextra2`, because `package.json` has no `name` field and npm
  infers it from the directory. It is pure noise. `git checkout
package-lock.json` before every commit.
- **Tailwind tree-shakes from `docs/hugo_stats.json`.** A new utility class is
  dropped from the build if the stats are stale, so it is always `make css`
  (which regenerates stats first), never `npm run build:css` alone. Commit the
  regenerated stats and `assets/css/compiled/main.css` alongside the change.
- **Computed colours come back as `oklch()`** under Tailwind v4. Parsing the
  string gives the wrong contrast ratio — the harness paints the colour onto a
  1×1 canvas and reads the pixel back instead.
- **Prettier will fuse attributes.** Writing
  `class="..." {{- with X }}attr="y"{{ end }}` makes the `{{-` eat the space and
  emit `class="..."attr="y"`. Prettier's own preferred form —
  `class="..." {{ with X }}attr="y"{{ end }}` — is the safe one. Accept what
  `prettier --write` produces and re-check the rendered HTML.
- **Multi-line template comments must be `{{/* ... */}}`**, never
  `{{- /* ... */ -}}`; Prettier moves the closing `-}}` onto its own line and
  Hugo then cannot parse it. Prettier also reflows a `*/}}` that shares a line
  with text — let it.
- The repro sites hit a **pointer-interception failure at a 768px viewport**
  (the sticky navbar/sidebar covers the toggle). It is pre-existing and
  reproduces on the baseline build too — not caused by any of these fixes.
  Measure at 320, 375 or 1280.

### The harnesses

In `.review-tools/`. All take a built site directory as `argv[2]`; they serve
it over a throwaway HTTP server, open the menu, and print JSON. They resolve
Playwright from this repo's `node_modules`, so run them from the repo root.

```bash
node .review-tools/measure.mjs docs/public [path] [width] [light|dark]
#   panel geometry, overflow vs viewport, row height, label offsets,
#   description contrast, icons missing aria-hidden, row textContent
node .review-tools/hover.mjs   docs/public [light|dark]   # contrast in :hover
node .review-tools/accname.mjs docs/public               # role+name matching
node .review-tools/axtree.mjs  docs/public               # CDP AX name/description
node .review-tools/kbd.mjs     docs/public               # full keyboard walk
node .review-tools/click.mjs   docs/public               # pointer + clipboard
.review-tools/make-repro-sites.sh [outdir]               # ru + tr repro sites
```

`make-repro-sites.sh` consumes the theme from this repo's **parent** directory,
so the repo folder name must match the `theme:` key in the two configs
(currently `hextra2`). The `ru` site covers reflow, a long custom description,
an internal link and an icon-less link; the `tr` site is the untranslated-locale
case (there is no `i18n/tr.yaml`).

A baseline build of the pre-fix site was kept at
`<scratchpad>/public-baseline` — session-local, so it is probably gone. Recreate
it with `git stash` / `git checkout main -- .` into a separate `--destination`.

### Not yet run on this branch

`make test` (full Playwright suite) and `make fmt-check` across the whole tree
have **not** been run — only per-file `prettier --check` on what was touched,
plus targeted browser measurements. Run both before considering the branch
done, and expect finding 12's spec change to be the thing that makes the a11y
suite meaningful.
