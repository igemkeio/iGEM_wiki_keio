// vite build と prerender の後に実行し、dist/ の HTML と CSS を検査する。
// 検査の関数は scripts/lib/check/ にあり、ここはファイルの読み書きと集計だけを行う。
import { readdir, readFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { extractCssUrls } from "./lib/check/css.mjs";
import { checkLang, checkNoScript, checkStructure, extractRefs, isExternalCheckTarget } from "./lib/check/html.mjs";
import { checkExternalUrl, checkInternalLink } from "./lib/check/urls.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const contentDir = join(root, "..", "content");
const base = process.env.WIKI_BASE ?? "/";

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(path)));
    else out.push(relative(dist, path).split(sep).join("/"));
  }
  return out;
}

// dist/ の直下にある、web/public/ 由来の名前。HTMLとCSSの検査から外す。
async function publicNames() {
  try {
    return new Set(await readdir(join(root, "public")));
  } catch {
    return new Set();
  }
}

function pagePath({ locale, slug }) {
  const prefix = locale === "en" ? "" : "ja/";
  return slug === "home" ? `${prefix}index.html` : `${prefix}${slug}/index.html`;
}

async function readContent() {
  const pages = [];
  for (const locale of await readdir(contentDir, { withFileTypes: true })) {
    if (!locale.isDirectory()) continue;
    for (const file of await readdir(join(contentDir, locale.name))) {
      if (!file.endsWith(".json")) continue;
      const json = JSON.parse(await readFile(join(contentDir, locale.name, file), "utf8"));
      if (json.published === false) continue;
      pages.push({
        file: `content/${locale.name}/${file}`,
        dist: pagePath({ locale: locale.name, slug: file.replace(/\.json$/, "") }),
        islands: Array.isArray(json.islands) ? json.islands : [],
      });
    }
  }
  return pages;
}

async function main() {
  try {
    await readdir(dist);
  } catch {
    console.error("dist/ がありません。先に npm run build を実行してください");
    process.exit(1);
  }
  const violations = [];
  const report = (file, reasons) => {
    for (const reason of reasons) violations.push(`${file}: ${reason}`);
  };

  const publicDirs = await publicNames();
  const files = new Set(await walk(dist));
  const isPublic = (rel) => !rel.includes("/") && publicDirs.has(rel);
  const htmlFiles = [...files].filter((f) => f.endsWith(".html") && !isPublic(f.split("/")[0]));
  const cssFiles = [...files].filter((f) => f.startsWith("assets/") && f.endsWith(".css"));

  const pages = await readContent();
  const indexFiles = htmlFiles.filter((f) => f === "index.html" || f.endsWith("/index.html"));
  if (pages.length !== indexFiles.length) {
    report("dist", [`index.html の数(${indexFiles.length})が content/ の published 数(${pages.length})と一致しません`]);
  }
  const islandsByDist = new Map(pages.map((p) => [p.dist, p]));

  for (const file of htmlFiles) {
    const html = await readFile(join(dist, file), "utf8");
    const name = `dist/${file}`;
    report(name, checkStructure(html));
    report(name, checkLang(html));
    const page = islandsByDist.get(file);
    if (page && page.islands.length === 0) report(name, checkNoScript(html));
    for (const ref of extractRefs(html)) {
      if (ref.value === "" || ref.value.startsWith("#") || /^mailto:/i.test(ref.value)) continue;
      if (isExternalCheckTarget(ref)) report(name, checkExternalUrl(ref.value));
      report(name, checkInternalLink(ref.value, base, files));
    }
  }

  for (const file of cssFiles) {
    const css = await readFile(join(dist, file), "utf8");
    for (const url of extractCssUrls(css)) {
      if (url === "" || url.startsWith("#") || /^data:/i.test(url)) continue;
      report(`dist/${file}`, checkExternalUrl(url));
      report(`dist/${file}`, checkInternalLink(url, base, files));
    }
  }

  for (const line of violations) console.error(line);
  console.log(`check: HTML ${htmlFiles.length} 件、CSS ${cssFiles.length} 件を検査し、違反は ${violations.length} 件でした`);
  if (violations.length > 0) process.exitCode = 1;
}

await main();
