const { chromium } = await import(new URL("../node_modules/@playwright/test/index.mjs", import.meta.url).href);
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname } from "node:path";
const root = process.argv[2],
  path = process.argv[3] || "/docs/guide/configuration/";
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
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
await p.goto(`http://127.0.0.1:${s.address().port}${path}`, { waitUntil: "networkidle" });
await p.locator(".hextra-page-context-menu-toggle").first().click();
await p.waitForTimeout(250);
const exactCopy = await p.getByRole("menuitem", { name: "Copy as Markdown", exact: true }).count();
const concat = await p.getByRole("menuitem", { name: "Copy as Markdown Copy page as Markdown for LLMs", exact: true }).count();
const names = await p.evaluate(() =>
  [...document.querySelectorAll('.hextra-page-context-menu-dropdown [role="menuitem"]')].map((el) => ({
    describedby: el.getAttribute("aria-describedby"),
    targetExists: el.getAttribute("aria-describedby") ? !!document.getElementById(el.getAttribute("aria-describedby")) : null,
  }))
);
console.log(
  JSON.stringify(
    { exactLabelMatches: exactCopy, concatenatedMatches: concat, rows: names, ariaSnapshot: (await p.locator(".hextra-page-context-menu-dropdown").ariaSnapshot()).split("\n").slice(0, 12) },
    null,
    2
  )
);
await b.close();
s.close();
