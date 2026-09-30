// vite buildとprerenderの後に実行し、dist/のHTMLとdist/assets/のCSSを検査する。
// 検査の関数はscripts/lib/check/にあり、ここはファイルの読み取り、集計、出力、終了コードを受け持つ。
import { readdir, readFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { extractCssUrls } from "./lib/check/css.mjs";
import {
  checkLang,
  checkNoScript,
  checkStructure,
  extractRefs,
  extractStyleUrls,
  isExternalCheckTarget,
  isInternalCheckTarget,
} from "./lib/check/html.mjs";
import { comparePages, toPage } from "./lib/check/pages.mjs";
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

// dist/の直下にある、web/public/由来の名前。HTMLの検査から外す。
async function publicNames() {
  try {
    return new Set(await readdir(join(root, "public")));
  } catch {
    return new Set();
  }
}

// content/を読む。読めないもの、壊れたJSONはファイル名付きのメッセージで返す。
async function readContent() {
  const pages = [];
  const errors = [];
  let locales;
  try {
    locales = await readdir(contentDir, { withFileTypes: true });
  } catch (error) {
    return { pages, errors: [`content/: 読めません(${error.message})`] };
  }
  for (const locale of locales) {
    if (!locale.isDirectory()) continue;
    for (const file of await readdir(join(contentDir, locale.name))) {
      if (!file.endsWith(".json")) continue;
      const name = `content/${locale.name}/${file}`;
      try {
        const json = JSON.parse(await readFile(join(contentDir, locale.name, file), "utf8"));
        const page = toPage(locale.name, file, json);
        if (page) pages.push(page);
      } catch (error) {
        errors.push(`${name}: JSONを読めません(${error.message})`);
      }
    }
  }
  return { pages, errors };
}

async function main() {
  try {
    await readdir(dist);
  } catch {
    console.error("dist/がありません。先にnpm run buildを実行してください");
    process.exit(1);
  }
  const { pages, errors } = await readContent();
  if (errors.length > 0) {
    for (const line of errors) console.error(line);
    process.exit(1);
  }

  const violations = [];
  const report = (file, reasons) => {
    for (const reason of reasons) violations.push(`${file}: ${reason}`);
  };

  const publicDirs = await publicNames();
  const files = new Set(await walk(dist));
  const isPublic = (f) => publicDirs.has(f.split("/")[0]);
  const htmlFiles = [...files].filter((f) => f.endsWith(".html") && !isPublic(f));
  const cssFiles = [...files].filter((f) => f.startsWith("assets/") && f.endsWith(".css"));

  const indexFiles = htmlFiles.filter((f) => f === "index.html" || f.endsWith("/index.html"));
  for (const v of comparePages(pages, indexFiles)) report(v.file, [v.reason]);
  const pageByDist = new Map(pages.map((p) => [p.dist, p]));

  const checkUrl = (name, value, { external, internal }) => {
    if (value === "" || value.startsWith("#") || /^mailto:/i.test(value) || /^data:/i.test(value)) return;
    if (external) report(name, checkExternalUrl(value));
    if (internal) report(name, checkInternalLink(value, base, files));
  };

  for (const file of htmlFiles) {
    const html = await readFile(join(dist, file), "utf8");
    const name = `dist/${file}`;
    report(name, checkStructure(html));
    report(name, checkLang(html));
    const page = pageByDist.get(file);
    if (page && page.islands.length === 0) report(name, checkNoScript(html));
    for (const ref of extractRefs(html)) {
      checkUrl(name, ref.value, { external: isExternalCheckTarget(ref), internal: isInternalCheckTarget(ref) });
    }
    for (const url of extractStyleUrls(html)) checkUrl(name, url, { external: true, internal: true });
  }

  for (const file of cssFiles) {
    const css = await readFile(join(dist, file), "utf8");
    for (const url of extractCssUrls(css)) checkUrl(`dist/${file}`, url, { external: true, internal: true });
  }

  for (const line of violations) console.error(line);
  console.log(`check: HTML ${htmlFiles.length}件、CSS ${cssFiles.length}件を検査し、違反は${violations.length}件でした`);
  if (violations.length > 0) process.exitCode = 1;
}

await main();
