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
const p = await b.newPage();
await p.goto(`http://127.0.0.1:${s.address().port}/docs/guide/configuration/`, { waitUntil: "networkidle" });
await p.locator(".hextra-page-context-menu-toggle").first().click();
await p.waitForTimeout(250);
const cdp = await p.context().newCDPSession(p);
await cdp.send("Accessibility.enable");
const { nodes } = await cdp.send("Accessibility.getFullAXTree");
for (const n of nodes) {
  if (n.role?.value === "menuitem") {
    console.log(JSON.stringify({ name: n.name?.value, description: n.description?.value }));
  }
}
await b.close();
s.close();
