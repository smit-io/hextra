import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag22aa"];
// TODO: Re-enable once known baseline issues are resolved and tracked.
const DISABLED_RULES = ["color-contrast", "target-size"];

// The page context menu is `display:none` until its toggle is clicked, and axe
// skips display:none subtrees - so the site-wide sweep below, which never
// interacts with the page, cannot see a single element of it. Combined with
// color-contrast being off globally, that is how a description line shipped at
// 4.475:1 on ~300 pages with the suite green. The component gets its own test
// that opens the menu and keeps color-contrast on.
const CONTEXT_MENU_PAGES = [
  { path: "/docs/guide/configuration/", dir: "ltr" },
  // Physical rather than logical insets pushed this one half off-screen, so the
  // RTL case is not redundant with the LTR one.
  { path: "/fa/docs/guide/configuration/", dir: "rtl" },
];
// 320px is the width SC 1.4.10 Reflow is judged at.
const VIEWPORTS = [
  { name: "desktop", width: 1280, height: 900 },
  { name: "reflow", width: 320, height: 900 },
];
const COLOR_SCHEMES = ["light", "dark"] as const;
const MENU_DISABLED_RULES = DISABLED_RULES.filter((rule) => rule !== "color-contrast");
const EXCLUDED_SELECTORS = [
  // Third-party player internals are outside the theme's control and can change
  // independently, while the iframe element itself remains covered by page HTML.
  'iframe[src*="youtube.com/embed"]',
  'iframe[src*="youtube-nocookie.com/embed"]',
];

type Violation = Awaited<ReturnType<InstanceType<typeof AxeBuilder>["analyze"]>>["violations"][number];

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function parseLocUrlsFromSitemap(xml: string): string[] {
  const locRegex = /<loc>\s*([^<]+?)\s*<\/loc>/gi;
  const urls: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = locRegex.exec(xml)) !== null) {
    urls.push(decodeXmlEntities(match[1]));
  }

  return urls;
}

async function getEnglishPages(baseURL: string): Promise<string[]> {
  const sitemapUrl = `${baseURL}/en/sitemap.xml`;
  const response = await fetch(sitemapUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch sitemap (${response.status} ${response.statusText}) at ${sitemapUrl}`);
  }

  const xml = await response.text();
  const pages = parseLocUrlsFromSitemap(xml).map((url) => {
    try {
      return new URL(url).pathname;
    } catch {
      return url;
    }
  });

  if (pages.length === 0) {
    throw new Error(`Sitemap at ${sitemapUrl} returned no URLs.`);
  }

  return pages;
}

function formatViolation(v: Violation): string {
  return `• ${v.id} (${v.impact}) — ${v.nodes.length} element(s)\n  ${v.help}\n  ${v.helpUrl}`;
}

test("all English pages pass axe-core WCAG AA", async ({ page, baseURL }) => {
  const pages = await getEnglishPages(baseURL!);
  const failures: string[] = [];

  // One test walks every English page, so the budget has to scale with the
  // sitemap rather than sit at the 60s default: adding a handful of pages was
  // enough to time out mid-run, which reads as an accessibility failure when
  // nothing is actually wrong. Roughly 1s per page, with a floor for startup.
  test.setTimeout(Math.max(60_000, pages.length * 1_000 + 30_000));

  for (const path of pages) {
    await test.step(path, async () => {
      await page.goto(path, { waitUntil: "load" });

      const axe = new AxeBuilder({ page }).withTags(WCAG_TAGS).disableRules(DISABLED_RULES);

      for (const selector of EXCLUDED_SELECTORS) {
        axe.exclude(selector);
      }

      const results = await axe.analyze();

      if (results.violations.length === 0) {
        return;
      }

      failures.push(`--- ${path} ---\n${results.violations.map(formatViolation).join("\n\n")}`);
    });
  }

  expect(failures, `Accessibility violations found:\n\n${failures.join("\n\n")}`).toHaveLength(0);
});

async function openContextMenu(page: import("@playwright/test").Page, path: string) {
  await page.goto(path, { waitUntil: "load" });

  const toggle = page.locator(".hextra-page-context-menu-toggle");
  await expect(toggle, `no page context menu on ${path} - pick a page that has one`).toHaveCount(1);

  await toggle.click();

  const menu = page.locator(".hextra-page-context-menu-dropdown");
  await expect(menu).toBeVisible();

  return menu;
}

for (const { path, dir } of CONTEXT_MENU_PAGES) {
  for (const viewport of VIEWPORTS) {
    for (const colorScheme of COLOR_SCHEMES) {
      test(`open page context menu passes axe-core WCAG AA (${dir}, ${viewport.name}, ${colorScheme})`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.emulateMedia({ colorScheme });

        await openContextMenu(page, path);

        const results = await new AxeBuilder({ page }).include(".hextra-page-context-menu").withTags(WCAG_TAGS).disableRules(MENU_DISABLED_RULES).analyze();

        expect(results.violations, `Accessibility violations in the open page context menu:\n\n${results.violations.map(formatViolation).join("\n\n")}`).toHaveLength(0);
      });
    }
  }

  test(`open page context menu stays inside the viewport (${dir}, 320px)`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });

    const menu = await openContextMenu(page, path);

    // Reflow, which axe cannot check. An absolutely positioned panel that
    // overhangs the viewport does not always extend the scrollable area, so
    // both halves are needed: scrollWidth catches the case where the page gains
    // a second scroll axis, and the rect catches the case where the overhang is
    // simply clipped and unreachable.
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth, "opening the menu must not introduce horizontal scrolling").toBeLessThanOrEqual(clientWidth);

    // The docs site has no locale long enough to overflow 320px on its own, so
    // the width regression that started all this - `whitespace-nowrap` inherited
    // by the description prose, making the panel as wide as the longest
    // translation - is guarded directly rather than through its symptom.
    const whiteSpace = await menu
      .locator('[id^="hextra-pcm-desc"]')
      .first()
      .evaluate((el) => getComputedStyle(el).whiteSpace);
    expect(whiteSpace, "row descriptions must be allowed to wrap").not.toBe("nowrap");

    const box = await menu.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x, "menu overhangs the start edge").toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width, "menu overhangs the end edge").toBeLessThanOrEqual(clientWidth);
  });
}
