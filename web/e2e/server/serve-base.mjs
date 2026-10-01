// e2e/.site/keio/を/keio/配下で配信する静的サーバー。vite previewは--baseを読まないのでNodeのhttpで書く。
// prepare.mjsが作るe2e/.site/readyを待ってから待ち受ける。
import { existsSync } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const site = resolve(dirname(fileURLToPath(import.meta.url)), "../.site");
const port = Number(process.env.PORT ?? 4174);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".wasm": "application/wasm",
  ".ico": "image/x-icon",
  ".glb": "model/gltf-binary",
};

while (!existsSync(join(site, "ready"))) await new Promise((r) => setTimeout(r, 200));

async function resolveFile(pathname) {
  // /keio/ より外はサイトの外なので見つからない扱いにする。
  if (!pathname.startsWith("/keio/")) return undefined;
  const file = normalize(join(site, pathname));
  if (!file.startsWith(site + sep)) return undefined;
  const info = await stat(file).catch(() => undefined);
  if (info?.isDirectory()) return pathname.endsWith("/") ? join(file, "index.html") : undefined;
  return info ? file : undefined;
}

createServer(async (req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url ?? "/", "http://localhost").pathname);
  } catch {
    res.writeHead(400, { "content-type": "text/plain" }).end("bad request");
    return;
  }
  const file = await resolveFile(pathname).catch(() => undefined);
  const body = file && (await readFile(file).catch(() => undefined));
  if (!file || !body) {
    res.writeHead(404, { "content-type": "text/plain" }).end("not found");
    return;
  }
  res.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream" }).end(body);
}).listen(port, () => console.log(`serve-base: http://localhost:${port}/keio/`));
