const { chromium } = await import(new URL("../node_modules/@playwright/test/index.mjs", import.meta.url).href);
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname } from "node:path";
const root = process.argv[2];
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
await p.goto(`http://127.0.0.1:${s.address().port}/docs/guide/configuration/`, { waitUntil: "networkidle" });
const active = () =>
  p.evaluate(() => {
    const a = document.activeElement;
    return a?.getAttribute("aria-label") || a?.className?.split(" ")[0] || a?.tagName;
  });
const open = () => p.evaluate(() => !document.querySelector(".hextra-page-context-menu-dropdown").classList.contains("hx:hidden"));
const log = async (step) => console.log(`${step.padEnd(34)} open=${await open()} focus=${await active()}`);
const toggle = p.locator(".hextra-page-context-menu-toggle").first();
await toggle.focus();
await log("focus toggle");
await p.keyboard.press("ArrowDown");
await p.waitForTimeout(120);
await log("ArrowDown (open + first)");
await p.keyboard.press("ArrowDown");
await log("ArrowDown");
await p.keyboard.press("ArrowDown");
await log("ArrowDown");
await p.keyboard.press("End");
await log("End");
await p.keyboard.press("ArrowDown");
await log("ArrowDown (wrap)");
await p.keyboard.press("Home");
await log("Home");
await p.keyboard.press("ArrowUp");
await log("ArrowUp (wrap)");
await p.keyboard.press("Escape");
await p.waitForTimeout(120);
await log("Escape");
await p.keyboard.press("ArrowUp");
await p.waitForTimeout(120);
await log("ArrowUp (open + last)");
console.log("aria-controls:", await toggle.getAttribute("aria-controls"), "| menu id:", await p.locator(".hextra-page-context-menu-dropdown").getAttribute("id"));
await b.close();
s.close();
