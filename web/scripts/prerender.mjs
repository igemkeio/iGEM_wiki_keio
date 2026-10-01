// vite buildの後に実行し、content/のpublishedなページをdist/<path>/index.htmlに書き出す。
// routes.tsとPage.tsxはNodeから直接読めないので、ViteのSSRビルドで.vite/ssr/に束ねてから読み込む。
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { build } from "vite";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const ssrDir = join(root, ".vite", "ssr");
// PRERENDER_ALL=1のとき、published: falseのページも書き出す(E2E用)。
const includeUnpublished = process.env.PRERENDER_ALL === "1";

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
      copyPublicDir: false,
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
  const hint = `先に vite build を実行してください(npm run build)`;
  let manifest;
  try {
    manifest = JSON.parse(await readFile(join(dist, ".vite", "manifest.json"), "utf8"));
  } catch {
    throw new Error(`dist/.vite/manifest.json を読めません。${hint}`);
  }
  const entry = manifest["index.html"];
  if (!entry) {
    throw new Error(
      `dist/.vite/manifest.json に "index.html" のキーがありません。${hint}`
    );
  }
  return { css: entry.css ?? [], js: entry.file };
}

// routes.ts を通さず content/ の JSON を直接読む。書き出し数の突き合わせと、PRERENDER_ALL のルート作りに使う。
async function readContentJson() {
  const contentDir = join(root, "..", "content");
  const entries = {};
  for (const locale of await readdir(contentDir, { withFileTypes: true })) {
    if (!locale.isDirectory()) continue;
    for (const file of await readdir(join(contentDir, locale.name))) {
      if (!file.endsWith(".json")) continue;
      entries[`../../content/${locale.name}/${file}`] = JSON.parse(
        await readFile(join(contentDir, locale.name, file), "utf8"),
      );
    }
  }
  return entries;
}

async function countPublished() {
  const entries = Object.values(await readContentJson());
  return entries.filter((json) => includeUnpublished || json.published !== false).length;
}

// 全ページを published: true として並べ直す。
async function allRoutes(routeModule) {
  const entries = await readContentJson();
  return routeModule.buildRoutes(Object.fromEntries(Object.entries(entries).map(([k, v]) => [k, { ...v, published: true }])));
}

export async function prerender() {
  const { routes: routeModule, page: pageModule } = await bundle();
  const assets = await readAssets();
  const routes = includeUnpublished ? await allRoutes(routeModule) : routeModule.routes;
  let written = 0;
  for (const { page, path } of routes) {
    const html = renderToStaticMarkup(createElement(pageModule.Page, { page, routes, assets }));
    const file = join(dist, path, "index.html");
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, `<!doctype html>${html}`);
    written += 1;
  }
  const expected = await countPublished();
  console.log(`prerender: ${written} ページを書き出しました(content/ の${includeUnpublished ? "全ページ" : "publishedなページ"}は ${expected} ページ)`);
  if (written !== expected) {
    throw new Error(`書き出したページ数(${written})と content/ の${includeUnpublished ? "全ページ" : "published"}数(${expected})が一致しません`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await prerender();
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}
