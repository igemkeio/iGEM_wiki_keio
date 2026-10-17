// vite buildとprerenderの後に実行する。アップロードの対応表があれば、dist/のHTML、CSS、JSの/notion-images/などのパスを対応表のURLに替え、
// 配信元に移した画像とフォントとPDFのディレクトリをdist/から外す。対応表が無い(WIKI_UPLOAD_MANIFESTが空、または既定のファイルが無い)ときは何もしない。
import { existsSync } from "node:fs";
import { readdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import {
  MANIFEST_DIRECTORIES,
  parseManifest,
  resolveManifestPath,
  rewriteText,
} from "./lib/upload-manifest.mjs";

const root = resolve(import.meta.dirname, "..");
const dist = join(root, "dist");
const base = process.env.WIKI_BASE ?? "/";

async function walk(dir, skip) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) {
      continue;
    }
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walk(path, new Set())));
    } else {
      out.push(path);
    }
  }
  return out;
}

async function main() {
  const manifestPath = resolveManifestPath(
    process.env,
    join(root, "upload-manifest.json"),
    existsSync
  );
  if (manifestPath === null) {
    return;
  }
  const manifest = parseManifest(
    JSON.parse(await readFile(resolve(manifestPath), "utf-8"))
  );

  // dist/直下の差し替え対象のディレクトリは配信しないので読まない。
  const found = await walk(dist, new Set(MANIFEST_DIRECTORIES));
  const targets = found.filter((file) => /\.(?:html|css|js)$/u.test(file));
  const missing = new Set();
  let replaced = 0;
  for (const file of targets) {
    const source = await readFile(file, "utf-8");
    const result = rewriteText(source, manifest, base);
    for (const key of result.missing) {
      missing.add(key);
    }
    if (result.text !== source) {
      replaced += result.replaced;
      await writeFile(file, result.text);
    }
  }
  for (const directory of MANIFEST_DIRECTORIES) {
    await rm(join(dist, directory), { recursive: true, force: true });
  }

  console.log(
    `apply-manifest: ${manifestPath} で${replaced}件のURLを差し替えました(対応表は${manifest.size}件)`
  );
  if (missing.size > 0) {
    console.warn(
      `警告: 対応表に無いパスが${missing.size}件あります(npm run checkが違反として落とします)。npm run igem:uploadを流して対応表を作り直してください:`
    );
    for (const key of [...missing].toSorted()) {
      console.warn(`  ${key}`);
    }
  }
}

try {
  await main();
} catch (error) {
  console.error(`apply-manifest: ${error.message}`);
  process.exitCode = 1;
}
