const { chromium } = await import(new URL("../node_modules/@playwright/test/index.mjs", import.meta.url).href);
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname } from "node:path";
const root = process.argv[2];
const T = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".md": "text/markdown" };
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
const ctx = await b.newContext({ permissions: ["clipboard-read", "clipboard-write"] });
const p = await ctx.newPage({ viewport: { width: 1280, height: 900 } });
const errs = [];
p.on("pageerror", (e) => errs.push(String(e)));
p.on("console", (m) => {
  if (m.type() === "error") errs.push(m.text());
});
await p.goto(`http://127.0.0.1:${s.address().port}/docs/guide/configuration/`, { waitUntil: "networkidle" });
const open = () => p.evaluate(() => !document.querySelector(".hextra-page-context-menu-dropdown").classList.contains("hx:hidden"));
const chev = () => p.evaluate(() => document.querySelector(".hextra-page-context-menu-toggle [data-chevron]").style.transform);
const t = p.locator(".hextra-page-context-menu-toggle").first();
await t.click();
await p.waitForTimeout(150);
console.log("click open:", await open(), "chevron:", JSON.stringify(await chev()), "aria-expanded:", await t.getAttribute("aria-expanded"));
await t.click();
await p.waitForTimeout(150);
console.log("click close:", await open(), "chevron:", JSON.stringify(await chev()), "aria-expanded:", await t.getAttribute("aria-expanded"));
await t.click();
await p.waitForTimeout(150);
await p.locator('.hextra-page-context-menu-dropdown [data-action="copy"]').click();
await p.waitForTimeout(400);
const clip = await p.evaluate(() => navigator.clipboard.readText());
console.log("copy action: menu closed =", !(await open()), "| clipboard starts:", JSON.stringify(clip.slice(0, 40)));
await t.click();
await p.waitForTimeout(150);
await p.mouse.click(5, 5);
await p.waitForTimeout(150);
console.log("outside click closes:", !(await open()));
console.log("page errors:", errs.length ? errs : "none");
await b.close();
s.close();
