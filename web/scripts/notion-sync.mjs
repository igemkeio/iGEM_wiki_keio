// Notion を CMS として使うための同期スクリプト。
// Notion の Database（1行=1ページ）を取得し、本文 Markdown を HTML 化して
// wiki/pages/<slug>.html（en）/ wiki/pages/ja/<slug>.html（ja）へ書き出す。
//
// 実行: NOTION_TOKEN=... NOTION_DATABASE_ID=... node scripts/notion-sync.mjs
//   もしくは web/.env.local に上記を書いて `yarn notion:sync`
//
// Database に必要なプロパティ:
//   - slug   (Title)      … ページのスラッグ。例: home, description
//   - locale (Select)     … "en" または "ja"
//   - heading (Rich text) … <title> ブロックに入る文字列
//       （プロパティ名を "title" にすると Notion の title 型と名前衝突するため heading）
//   - lead   (Rich text)  … lead ブロック（簡単な HTML 可）
//   - published (Checkbox) … 任意。存在し false の行はスキップ。

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { Client } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";
import { marked } from "marked";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_DIR = path.join(__dirname, "..");
const PAGES_DIR = path.join(WEB_DIR, "..", "wiki", "pages");
// Notion 本文の画像を保存する場所（暫定方式）。/notion-images/ で配信される。
// ※ iGEM 本番では static.igem.wiki へ移す必要あり（Issue #13）。
const IMAGES_DIR = path.join(WEB_DIR, "public", "notion-images");
const IMAGES_URL_PREFIX = "/notion-images";

// web/.env.local があれば最小パースで読み込む（dotenv 非依存）。
function loadEnvLocal() {
  const envPath = path.join(WEB_DIR, ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

loadEnvLocal();

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

if (!NOTION_TOKEN || !NOTION_DATABASE_ID) {
  console.error(
    "[notion-sync] NOTION_TOKEN と NOTION_DATABASE_ID が必要です。" +
      " 環境変数か web/.env.local で指定してください。"
  );
  process.exit(1);
}

// SDK 同梱の node-fetch ではなく Node 標準の fetch（undici）を使わせる。
// node-fetch はランナー環境によってはレスポンス取得時に "Premature close" を投げ、
// GitHub Actions 上の同期が失敗していたため。
const notion = new Client({
  auth: NOTION_TOKEN,
  fetch: (url, init) => fetch(url, init),
});
const n2m = new NotionToMarkdown({ notionClient: notion });

// 一時的な接続断（Premature close 等）に備えて数回リトライする薄いラッパ。
async function withRetry(label, fn, retries = 3) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt > retries) throw err;
      const waitMs = attempt * 1000;
      console.warn(
        `[notion-sync] ${label} 失敗(${attempt}/${retries}): ${err.message} — ${waitMs}ms 後に再試行`
      );
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }
}

// content-type / URL から拡張子を推定する。
function guessExt(contentType, url) {
  const byType = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/svg+xml": "svg",
    "image/avif": "avif",
  };
  if (contentType && byType[contentType.split(";")[0].trim()])
    return byType[contentType.split(";")[0].trim()];
  const m = new URL(url).pathname.match(/\.([a-zA-Z0-9]+)$/);
  return m ? m[1].toLowerCase() : "png";
}

// 画像をダウンロードして web/public/notion-images に保存し、配信用パスを返す。
// 同じ内容（ハッシュ一致）なら再ダウンロードしない。失敗時は null。
async function localizeImage(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const hash = crypto.createHash("sha256").update(buf).digest("hex").slice(0, 16);
    const ext = guessExt(res.headers.get("content-type"), url);
    const fileName = `${hash}.${ext}`;
    const outPath = path.join(IMAGES_DIR, fileName);
    if (!fs.existsSync(outPath)) {
      fs.mkdirSync(IMAGES_DIR, { recursive: true });
      fs.writeFileSync(outPath, buf);
      console.log(`[notion-sync] image saved ${fileName} (${buf.length} bytes)`);
    }
    return `${IMAGES_URL_PREFIX}/${fileName}`;
  } catch (err) {
    console.warn(`[notion-sync] 画像取得失敗のためスキップ: ${err.message}`);
    return null;
  }
}

// image ブロックのカスタム変換。Notion アップロード画像（一時URL）は
// リポジトリに取り込み、外部の恒久URLはそのまま通す。
n2m.setCustomTransformer("image", async (block) => {
  const img = block.image;
  const caption = (img.caption ?? []).map((t) => t.plain_text).join("");
  const srcUrl = img.type === "external" ? img.external.url : img.file.url;

  // 外部URLで static.igem.wiki 等の恒久URLならそのまま。
  if (img.type === "external") {
    return `![${caption}](${srcUrl})`;
  }
  // Notion アップロード画像は一時URLなのでリポジトリへ取り込む。
  const localPath = await localizeImage(srcUrl);
  return localPath ? `![${caption}](${localPath})` : `<!-- 画像をスキップしました -->`;
});

// Notion のプロパティ値から素のテキストを取り出すヘルパ。
function plainText(prop) {
  if (!prop) return "";
  if (prop.type === "title") return prop.title.map((t) => t.plain_text).join("");
  if (prop.type === "rich_text")
    return prop.rich_text.map((t) => t.plain_text).join("");
  if (prop.type === "select") return prop.select?.name ?? "";
  if (prop.type === "checkbox") return prop.checkbox;
  return "";
}

// Database 全行を取得（ページネーション対応）。
async function queryAllRows(databaseId) {
  const rows = [];
  let cursor = undefined;
  do {
    const res = await withRetry("databases.query", () =>
      notion.databases.query({
        database_id: databaseId,
        start_cursor: cursor,
      })
    );
    rows.push(...res.results);
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);
  return rows;
}

// 1行ぶんを wiki/pages 形式の HTML 文字列に組み立てる。
async function buildPageFile(row) {
  const props = row.properties;
  const slug = plainText(props.slug).trim();
  const locale = (plainText(props.locale) || "en").trim();
  const title = plainText(props.heading).trim();
  const lead = plainText(props.lead).trim();

  // 本文 Markdown → HTML。
  const mdBlocks = await withRetry(`pageToMarkdown(${row.id})`, () =>
    n2m.pageToMarkdown(row.id)
  );
  const md = n2m.toMarkdownString(mdBlocks).parent ?? "";
  const contentHtml = marked.parse(md, { async: false }).trim();

  const file = `{% extends "layout.html" %}

{% block title %}${title}{% endblock %}
{% block lead %}${lead}{% endblock %}

{% block page_content %}

${contentHtml}

{% endblock %}
`;
  return { slug, locale, file };
}

async function main() {
  const rows = await queryAllRows(NOTION_DATABASE_ID);
  let written = 0;
  let skipped = 0;

  for (const row of rows) {
    const props = row.properties;
    // published プロパティがあり、かつ false ならスキップ。
    if (props.published && props.published.type === "checkbox" && props.published.checkbox === false) {
      skipped++;
      continue;
    }

    const { slug, locale, file } = await buildPageFile(row);
    if (!slug) {
      console.warn("[notion-sync] slug 未設定の行をスキップしました。");
      skipped++;
      continue;
    }
    // __ 接頭辞は制御用の行（__build__ など）。ページ生成しない。
    if (slug.startsWith("__")) {
      skipped++;
      continue;
    }

    const outDir = locale === "ja" ? path.join(PAGES_DIR, "ja") : PAGES_DIR;
    fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, `${slug}.html`);
    fs.writeFileSync(outPath, file, "utf8");
    console.log(`[notion-sync] wrote ${locale}/${slug}.html`);
    written++;
  }

  console.log(`[notion-sync] 完了: ${written} 件書き出し / ${skipped} 件スキップ。`);
}

main().catch((err) => {
  console.error("[notion-sync] 失敗:", err.message);
  process.exit(1);
});
