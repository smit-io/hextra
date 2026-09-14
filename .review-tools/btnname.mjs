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
const cdp = await p.context().newCDPSession(p);
await cdp.send("Accessibility.enable");
const btn = p.locator(".hextra-page-context-menu-copy");
const visible = (await btn.innerText()).trim();
const { nodes } = await cdp.send("Accessibility.getFullAXTree");
const nodeFor = await btn.evaluate((el) => {
  el.setAttribute("data-axprobe", "1");
  return 1;
});
const { nodes: n2 } = await cdp.send("Accessibility.getFullAXTree");
const btnNodes = n2.filter((n) => n.role?.value === "button");
console.log("visible label:", JSON.stringify(visible));
for (const n of btnNodes.filter((n) => /^(Copy Page|Copy as Markdown|Toggle page context menu)$/.test(n.name?.value || "")))
  console.log("  button name:", JSON.stringify(n.name?.value), "description:", JSON.stringify(n.description?.value));
console.log("getByRole button name 'Copy Page' matches:", await p.getByRole("button", { name: visible }).count());
await b.close();
s.close();
