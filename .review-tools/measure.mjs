// Measurement harness for the page-context-menu review fixes.
// Usage: node measure.mjs <dirToServe> [pagePath] [viewportWidth] [colorScheme]
const { chromium } = await import(new URL("../node_modules/@playwright/test/index.mjs", import.meta.url).href);
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname } from "node:path";

const root = process.argv[2];
const pagePath = process.argv[3] || "/docs/guide/configuration/";
const width = Number(process.argv[4] || 1280);
const scheme = process.argv[5] || "light";

const TYPES = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".png": "image/png" };

const server = createServer(async (req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  let file = join(root, p);
  try {
    if ((await stat(file)).isDirectory()) file = join(file, "index.html");
  } catch {
    res.writeHead(404).end();
    return;
  }
  try {
    const body = await readFile(file);
    res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" }).end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height: 900 }, colorScheme: scheme });
await page.goto(base + pagePath, { waitUntil: "networkidle" });

const toggle = page.locator(".hextra-page-context-menu-toggle").first();
const out = { page: pagePath, width, scheme };
if (await toggle.count()) {
  await toggle.click();
  await page.waitForTimeout(300);
  Object.assign(
    out,
    await page.evaluate(() => {
      const ul = document.querySelector(".hextra-page-context-menu-dropdown");
      const r = ul.getBoundingClientRect();
      const rgb = (el, prop) => getComputedStyle(el)[prop];
      // Computed colours come back as oklch() in Tailwind v4, so resolve to sRGB
      // by painting them on a canvas rather than parsing the string.
      const cv = document.createElement("canvas");
      cv.width = cv.height = 1;
      const ctx = cv.getContext("2d", { willReadFrequently: true });
      const parse = (s) => {
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, 1, 1);
        ctx.fillStyle = s;
        ctx.fillRect(0, 0, 1, 1);
        const d = ctx.getImageData(0, 0, 1, 1).data;
        return [d[0], d[1], d[2]];
      };
      const lum = ([r, g, b]) => {
        const f = (c) => {
          c /= 255;
          return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
        };
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
      };
      const ratio = (a, b) => {
        const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
        return (x + 0.05) / (y + 0.05);
      };
      // walk up for the first non-transparent background
      const bgOf = (el) => {
        let n = el;
        while (n) {
          const c = rgb(n, "backgroundColor");
          if (c && !/rgba\(0, 0, 0, 0\)|transparent/.test(c)) return parse(c);
          n = n.parentElement;
        }
        return [255, 255, 255];
      };
      const desc = ul.querySelector("li button span span:last-child") || ul.querySelector("span[class*='text-xs']");
      const items = [...ul.querySelectorAll('[role="menuitem"]')];
      return {
        dropdownWidth: Math.round(r.width),
        dropdownRight: Math.round(r.right),
        dropdownLeft: Math.round(r.left),
        overflowRight: Math.round(r.right - document.documentElement.clientWidth),
        overflowLeft: Math.round(-r.left),
        docScrollWidth: document.documentElement.scrollWidth,
        viewport: document.documentElement.clientWidth,
        menuItemCount: items.length,
        rowHeight: items[0] ? Math.round(items[0].getBoundingClientRect().height) : null,
        descColor: desc ? rgb(desc, "color") : null,
        descFontSize: desc ? rgb(desc, "fontSize") : null,
        descContrast: desc ? Number(ratio(parse(rgb(desc, "color")), bgOf(desc)).toFixed(3)) : null,
        descBg: desc ? bgOf(desc).join(",") : null,
        firstItemText: items[0] ? JSON.stringify(items[0].textContent) : null,
        lastItemText: items.at(-1) ? JSON.stringify(items.at(-1).textContent) : null,
        labelOffsets: items.map((i) => {
          const s = i.querySelector("span[class*='flex-col']");
          return s ? Math.round(s.getBoundingClientRect().left - i.getBoundingClientRect().left) : null;
        }),
        arrowCount: ul.querySelectorAll('svg[aria-hidden="true"]').length,
        iconsWithoutAriaHidden: [...ul.querySelectorAll("svg")].filter((s) => s.getAttribute("aria-hidden") !== "true").length,
        accNames: null,
      };
    })
  );
  // accessible names via ARIA snapshot
  const names = [];
  for (const it of await page.locator('.hextra-page-context-menu-dropdown [role="menuitem"]').all()) {
    names.push(await it.evaluate((e) => e.getAttribute("aria-label") || e.textContent.replace(/\s+/g, " ").trim()));
  }
  out.itemTextNormalized = names;
} else {
  out.error = "no context menu on this page";
}
console.log(JSON.stringify(out, null, 2));
await browser.close();
server.close();
