import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// A throwaway site per test, built with the working tree symlinked in as the
// theme. Nothing here needs a browser: everything the feature does is decided
// at build time, so the assertions are against the emitted HTML.
function buildSite(files: Record<string, string>, config: string): string {
  const siteDir = mkdtempSync(join(tmpdir(), "hextra-command-"));
  const contentDir = join(siteDir, "content");
  const themesDir = join(siteDir, "themes");

  mkdirSync(join(contentDir, "blog"), { recursive: true });
  mkdirSync(themesDir);
  symlinkSync(process.cwd(), join(themesDir, "hextra"), "dir");

  writeFileSync(join(siteDir, "hugo.yaml"), config);
  for (const [path, body] of Object.entries(files)) {
    writeFileSync(join(contentDir, path), body);
  }

  execFileSync("hugo", ["--source", siteDir, "--themesDir", themesDir, "--destination", join(siteDir, "public")], {
    cwd: process.cwd(),
    stdio: "pipe",
  });

  return siteDir;
}

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

    // `highlight` emits a tabbable <pre>; the partial strips it so the block
    // does not become a tab stop that focuses nothing.
    const block = html.slice(html.indexOf("hextra-command__line"), html.lastIndexOf("hextra-command__line"));
    expect(block).not.toContain('tabindex="0"');
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
    },
    BLOG_CONFIG
  );

  try {
    const short = readFileSync(join(siteDir, "public", "blog", "short", "index.html"), "utf8");
    const long = readFileSync(join(siteDir, "public", "blog", "long", "index.html"), "utf8");

    // The hero is the text block, not an <img>, and none of the image
    // pipeline ran.
    expect(short).toContain("hextra-command__frame");
    expect(short).toContain("hextra-command--cover");
    expect(short).not.toContain("hextra-blog-hero");

    // The multiplier is derived from the longest line, so a longer command
    // must come out smaller. This is the whole reason the partial does
    // arithmetic instead of leaving it to a fixed clamp.
    const size = (html: string) => Number(html.match(/--hextra-command-fs:([\d.]+)/)?.[1]);
    expect(size(short)).toBeGreaterThan(size(long));

    // One line each, so both frames get the default ratio undivided. A block
    // with more lines must get a taller frame, not a squeezed one.
    const ratio = (html: string) => Number(html.match(/--hextra-command-ratio:([\d.]+)/)?.[1]);
    expect(ratio(short)).toBeCloseTo(7.2, 2);
  } finally {
    rmSync(siteDir, { recursive: true, force: true });
  }
});
