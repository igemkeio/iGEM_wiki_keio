// vite build の後に実行し、content/ の published なページを dist/<path>/index.html に書き出す。
// routes.ts と Page.tsx は Node から直接読めないので、Vite の SSR ビルドで .vite/ssr/ に束ねてから読み込む。
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { build } from "vite";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const ssrDir = join(root, ".vite", "ssr");

async function bundle() {
  await rm(ssrDir, { recursive: true, force: true });
  await build({
    root,
    logLevel: "warn",
    configFile: join(root, "vite.config.ts"),
    build: {
      ssr: true,
      outDir: ssrDir,
      emptyOutDir: true,
      manifest: false,
      rollupOptions: {
        input: {
          routes: join(root, "src/routes.ts"),
          Page: join(root, "src/Page.tsx"),
        },
      },
    },
  });
  const load = (name) => import(`${pathToFileURL(join(ssrDir, `${name}.js`)).href}?t=${Date.now()}`);
  return { routes: await load("routes"), page: await load("Page") };
}

async function readAssets() {
  const manifest = JSON.parse(await readFile(join(dist, ".vite", "manifest.json"), "utf8"));
  const entry = manifest["index.html"];
  return { css: entry.css ?? [], js: entry.file };
}

export async function prerender() {
  const { routes: routeModule, page: pageModule } = await bundle();
  const assets = await readAssets();
  let written = 0;
  for (const { page, path } of routeModule.routes) {
    const html = renderToStaticMarkup(createElement(pageModule.Page, { page, assets }));
    const file = join(dist, path, "index.html");
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, `<!doctype html>${html}`);
    written += 1;
  }
  console.log(`prerender: ${written} ページを書き出しました(published は ${routeModule.routes.length} ページ)`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await prerender();
}
