import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

// A throwaway site per test, built with the working tree symlinked in as the
// theme. Nothing here needs a browser: everything the feature does is decided
// at build time, so the assertions are against the emitted HTML.
//
// A failing build cleans up after itself. Without that the temp directory
// survives with the working tree symlinked into it, and the next tool to walk
// /tmp follows the link back into the repo.
function buildSite(files: Record<string, string | Buffer>, config: string): string {
  const siteDir = mkdtempSync(join(tmpdir(), "hextra-command-"));
  const contentDir = join(siteDir, "content");
  const themesDir = join(siteDir, "themes");

  try {
    mkdirSync(join(contentDir, "blog"), { recursive: true });
    mkdirSync(themesDir);
    symlinkSync(process.cwd(), join(themesDir, "hextra"), "dir");

    writeFileSync(join(siteDir, "hugo.yaml"), config);
    for (const [path, body] of Object.entries(files)) {
      const target = join(contentDir, path);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, body);
    }

    execFileSync("hugo", ["--source", siteDir, "--themesDir", themesDir, "--destination", join(siteDir, "public")], {
      cwd: process.cwd(),
      stdio: "pipe",
    });
  } catch (err) {
    rmSync(siteDir, { recursive: true, force: true });
    throw err;
  }

  return siteDir;
}

// A 1x1 PNG, enough for Hugo to treat the bundle as having a cover resource.
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");

const BASE_CONFIG = `title: Test
baseURL: https://example.org/
theme: hextra
markup:
  highlight:
    noClasses: false
`;

// The article hero is off by default - see `blog/config.html`, which seeds
// `article.cover` as false - so a cover test that does not turn it on renders
// no cover at all and asserts against an empty page.
const BLOG_CONFIG = `${BASE_CONFIG}params:
  blog:
    article:
      cover: true
`;

const ratio = (html: string) => Number(html.match(/--hextra-command-ratio:([\d.]+)/)?.[1]);
const size = (html: string) => Number(html.match(/--hextra-command-fs:([\d.]+)/)?.[1]);

test("the command shortcode renders a prompt and Chroma-highlighted text", () => {
  const siteDir = buildSite(
    {
      "_index.md": `---
title: Home
---

{{< command >}}
npm install
npm run dev
{{< /command >}}
`,
    },
    BASE_CONFIG
  );

  try {
    const html = readFileSync(join(siteDir, "public", "index.html"), "utf8");

    // Two lines in, two lines out.
    expect(html.match(/class="hextra-command__line"/g)).toHaveLength(2);

    // The prompt is decorative punctuation, so it must not reach a screen
    // reader. Regressing this is silent in every visual check.
    expect(html).toContain('<span class="hextra-command__prompt" aria-hidden="true">$</span>');

    // Chroma's own wrapper, which is what assets/css/chroma/ styles. Without
    // it the command renders unhighlighted and nothing else would notice.
    expect(html).toContain('class="highlight"');
    expect(html).toContain("chroma");

    // A shell command is LTR whatever the page is; without this the prompt
    // renders after the command under an RTL locale.
    expect(html).toContain('class="hextra-command hextra-command--inline" dir="ltr"');

    // Inside `.content` the prose `pre`/`code` rules would otherwise apply to
    // Chroma's output, putting the command and its prompt in two fonts.
    expect(html).toContain("hextra-command__frame not-prose");

    // Inline, the `pre` really is a scroll container - the fit-to-width maths
    // clamps, so a long enough line overflows - and Chroma's keyboard stop is
    // kept so the overflow is reachable without a pointer.
    const pres = html.match(/<pre[^>]*>/g) ?? [];
    expect(pres.length).toBeGreaterThan(0);
    for (const pre of pres) expect(pre).toContain('tabindex="0"');
  } finally {
    rmSync(siteDir, { recursive: true, force: true });
  }
});

test("params.command.prompt sets the glyph and a call can override it", () => {
  const siteDir = buildSite(
    {
      "_index.md": `---
title: Home
---

{{< command >}}npm install{{< /command >}}

{{< command prompt="#" >}}npm run dev{{< /command >}}
`,
    },
    `${BASE_CONFIG}params:
  command:
    prompt: "›"
`
  );

  try {
    const html = readFileSync(join(siteDir, "public", "index.html"), "utf8");
    expect(html).toContain('aria-hidden="true">›</span>');
    expect(html).toContain('aria-hidden="true">#</span>');
  } finally {
    rmSync(siteDir, { recursive: true, force: true });
  }
});

test("coverText replaces the cover image and sizes itself to its frame", () => {
  const siteDir = buildSite(
    {
      "blog/_index.md": "---\ntitle: Blog\n---\n",
      "blog/short.md": `---
title: Short
date: 2026-01-01
coverText: ls
---

Body.
`,
      "blog/long.md": `---
title: Long
date: 2026-01-02
coverText:
  - claude add skill hextra --from ./skills/hextra --force
---

Body.
`,
      // The control. Without a post that really does render an image hero, the
      // "no hero" assertion below passes on a site that has no covers at all.
      "blog/withimage/index.md": `---
title: With image
date: 2026-01-03
---

Body.
`,
      "blog/withimage/cover.png": PNG,
    },
    BLOG_CONFIG
  );

  try {
    const short = readFileSync(join(siteDir, "public", "blog", "short", "index.html"), "utf8");
    const long = readFileSync(join(siteDir, "public", "blog", "long", "index.html"), "utf8");
    const image = readFileSync(join(siteDir, "public", "blog", "withimage", "index.html"), "utf8");

    // The control renders the image hero, so the assertion under it can fail.
    // Only the hero carries this class - cards use `hextra-blog-card-image` -
    // so a related-posts strip cannot satisfy it by accident.
    expect(image).toContain("hextra-blog-hero");

    // The hero is the text block, not an <img>, and none of the image
    // pipeline ran.
    expect(short).toContain("hextra-command__frame");
    expect(short).toContain("hextra-command--cover");
    expect(short).not.toContain("hextra-blog-hero");

    // A cover sits inside the post's own link in every card, and `<a>` may not
    // contain interactive content, so this one drops the keyboard stop that
    // the inline variant keeps.
    const pres = short.match(/<pre[^>]*>/g) ?? [];
    expect(pres.length).toBeGreaterThan(0);
    for (const pre of pres) expect(pre).not.toContain('tabindex="0"');

    // The multiplier is derived from the longest line, so a longer command
    // must come out smaller. This is the whole reason the partial does
    // arithmetic instead of leaving it to a fixed clamp.
    expect(size(short)).toBeGreaterThan(size(long));

    // One line each, so both frames get the default ratio undivided. A block
    // with more lines must get a taller frame, not a squeezed one.
    expect(ratio(short)).toBeCloseTo(7.2, 2);
  } finally {
    rmSync(siteDir, { recursive: true, force: true });
  }
});

test("a multi-line coverText buys height, written either way", () => {
  const siteDir = buildSite(
    {
      "blog/_index.md": "---\ntitle: Blog\n---\n",
      "blog/seq.md": `---
title: Sequence
date: 2026-01-01
coverText:
  - npm install
  - npm run dev
---

Body.
`,
      // The same two lines as a YAML block scalar: one string with a newline
      // in it rather than a sequence. Both spellings have to reach the same
      // code path, or a block scalar is measured and counted as one line and
      // the second is clipped by the frame.
      "blog/block.md": `---
title: Block
date: 2026-01-02
coverText: |
  npm install
  npm run dev
---

Body.
`,
    },
    BLOG_CONFIG
  );

  try {
    const seq = readFileSync(join(siteDir, "public", "blog", "seq", "index.html"), "utf8");
    const block = readFileSync(join(siteDir, "public", "blog", "block", "index.html"), "utf8");

    for (const html of [seq, block]) {
      expect(html.match(/class="hextra-command__line"/g)).toHaveLength(2);
      // 7.2 over two lines: twice the height of a one-line cover.
      expect(ratio(html)).toBeCloseTo(3.6, 2);
    }

    // The two spellings are the same cover, so they must size identically.
    expect(size(block)).toBeCloseTo(size(seq), 2);
  } finally {
    rmSync(siteDir, { recursive: true, force: true });
  }
});

test("a whole-number coverRatio is still a number in the output", () => {
  // YAML reads `6` as an int and Hugo's `div` returns an int for int/int, so
  // an uncast ratio reaches `printf "%.2f"` as an int64 and renders a Go
  // format error into the style attribute - which is a *defined* custom
  // property, so the stylesheet's own fallback does not apply.
  const siteDir = buildSite(
    {
      "blog/_index.md": "---\ntitle: Blog\n---\n",
      "blog/int.md": `---
title: Int
date: 2026-01-01
coverText: ls
---

Body.
`,
    },
    `${BLOG_CONFIG}  command:
    coverRatio: 6
`
  );

  try {
    const html = readFileSync(join(siteDir, "public", "blog", "int", "index.html"), "utf8");
    expect(html).not.toContain("%!");
    expect(ratio(html)).toBeCloseTo(6, 2);
  } finally {
    rmSync(siteDir, { recursive: true, force: true });
  }
});
