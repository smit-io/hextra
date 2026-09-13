const { chromium } = await import(new URL("../node_modules/@playwright/test/index.mjs", import.meta.url).href);
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname } from "node:path";
const root = process.argv[2],
  scheme = process.argv[3] || "light";
const T = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".woff2": "font/woff2" };
const s = createServer(async (q, r) => {
  let f = join(root, decodeURIComponent(q.url.split("?")[0]));
  try {
    if ((await stat(f)).isDirectory()) f = join(f, "index.html");
  } catch {
    r.writeHead(404).end();
    return;
  }
  try {
    r.writeHead(200, { "content-type": T[extname(f)] || "application/octet-stream" }).end(await readFile(f));
  } catch {
    r.writeHead(404).end();
  }
});
await new Promise((r) => s.listen(0, "127.0.0.1", r));
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 900 }, colorScheme: scheme });
await p.goto(`http://127.0.0.1:${s.address().port}/docs/guide/configuration/`, { waitUntil: "networkidle" });
await p.locator(".hextra-page-context-menu-toggle").first().click();
await p.waitForTimeout(200);
await p.locator('.hextra-page-context-menu-dropdown [role="menuitem"]').first().hover();
await p.waitForTimeout(400);
console.log(
  scheme,
  JSON.stringify(
    await p.evaluate(() => {
      const cv = document.createElement("canvas");
      cv.width = cv.height = 1;
      const ctx = cv.getContext("2d", { willReadFrequently: true });
      const px = (c) => {
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, 1, 1);
        ctx.fillStyle = c;
        ctx.fillRect(0, 0, 1, 1);
        const d = ctx.getImageData(0, 0, 1, 1).data;
        return [d[0], d[1], d[2]];
      };
      const lum = ([r, g, bl]) => {
        const f = (c) => {
          c /= 255;
          return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
        };
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(bl);
      };
      const ratio = (a, b) => {
        const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
        return (x + 0.05) / (y + 0.05);
      };
      const bgOf = (el) => {
        let n = el;
        while (n) {
          const c = getComputedStyle(n).backgroundColor;
          if (c && !/rgba\(0, 0, 0, 0\)|transparent/.test(c)) return px(c);
          n = n.parentElement;
        }
        return [255, 255, 255];
      };
      const item = document.querySelector('.hextra-page-context-menu-dropdown [role="menuitem"]');
      const desc = item.querySelector("span[class*='text-xs']");
      const label = item.querySelector("span[class*='font-medium']");
      return {
        hoverBg: bgOf(item).join(","),
        descOnHover: +ratio(px(getComputedStyle(desc).color), bgOf(desc)).toFixed(3),
        labelOnHover: +ratio(px(getComputedStyle(label).color), bgOf(label)).toFixed(3),
      };
    })
  )
);
await b.close();
s.close();
