// Notion を CMS として使うための同期スクリプト。
// Notion の Database（1行=1ページ）を取得し、本文 Markdown を HTML 化して
// content/<locale>/<slug>.json へ書き出す（形式は content/README.md）。
// NOTION_SYNC_LEGACY_HTML=1 のときは従来の wiki/pages/ も出す。
//
// 実行: NOTION_TOKEN=... NOTION_DATABASE_ID=... node scripts/notion-sync.mjs
//   もしくは web/.env.local に上記を書いて `yarn notion:sync`
//
// Database に必要なプロパティ:
//   - slug   (Title)      … ページのスラッグ。例: home, description
//   - locale (Select)     … "en" または "ja"
//   - heading (Rich text) … ページの見出し（JSON の title）
//       （プロパティ名を "title" にすると Notion の title 型と名前衝突するため heading）
//   - lead   (Rich text)  … リード文（簡単な HTML 可）
//   - order  (Number)     … 任意。ナビと Home のカードの並び順
//   - subtitle (Rich text) … 任意。見出しの下の小見出し
//   - published (Checkbox) … 任意。存在し false の行はスキップ。

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { Client } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";
import {
  renderMarkdown,
  renderNote,
  richTextToMarkdown,
} from "./lib/markdown.mjs";
import { collectImageSrcs, isIgemStatic, renderImage } from "./lib/figure.mjs";
import { buildLegacyFile } from "./lib/legacy.mjs";
import { buildPage, normalizeSlug, serializePage } from "./lib/page.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_DIR = path.join(__dirname, "..");
const PAGES_DIR = path.join(WEB_DIR, "..", "wiki", "pages");
const CONTENT_DIR = path.join(WEB_DIR, "..", "content");
const LOCALES = ["en", "ja"];
const LEGACY_HTML = process.env.NOTION_SYNC_LEGACY_HTML === "1";
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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Notion の上限は平均 3 req/秒。notion-to-md はブロックごとに叩くので
// 呼び出しの間隔を空けて平均レートを抑える。
const MIN_INTERVAL_MS = 350;
let lastCallAt = 0;
async function throttle() {
  const wait = lastCallAt + MIN_INTERVAL_MS - Date.now();
  if (wait > 0) await sleep(wait);
  lastCallAt = Date.now();
}

// 一時的な接続断（Premature close 等）と rate limit に備えてリトライする薄いラッパ。
// rate limit のときは Notion が返す Retry-After に従い、無ければ指数バックオフで待つ。
async function withRetry(label, fn, retries = 5) {
  for (let attempt = 1; ; attempt++) {
    try {
      await throttle();
      return await fn();
    } catch (err) {
      if (attempt > retries) throw err;
      const limited = err.code === "rate_limited" || err.status === 429;
      const retryAfterSec = Number(err.headers?.["retry-after"]);
      const waitMs = limited
        ? (Number.isFinite(retryAfterSec) ? retryAfterSec * 1000 : 2000 * 2 ** (attempt - 1))
        : attempt * 1000;
      console.warn(
        `[notion-sync] ${label} 失敗(${attempt}/${retries}): ${err.message} — ${waitMs}ms 後に再試行`
      );
      await sleep(waitMs);
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
// リポジトリに取り込み、外部の URL（static.igem.wiki など）はそのまま通す。
// キャプションがあれば Figure カードの HTML にする。
n2m.setCustomTransformer("image", async (block) => {
  const img = block.image;
  const caption = (img.caption ?? []).map((t) => t.plain_text).join("");

  let src;
  if (img.type === "external") {
    src = img.external.url;
  } else {
    src = await localizeImage(img.file.url);
    if (!src) return `<!-- 画像をスキップしました -->`;
  }
  return renderImage({ src, caption });
});

// callout ブロックのカスタム変換。本文と子ブロックを Note の HTML にする。アイコンは捨てる。
n2m.setCustomTransformer("callout", async (block) => {
  const parts = [richTextToMarkdown(block.callout.rich_text)];
  if (block.has_children) {
    const children = await listChildren(block.id);
    const mdBlocks = await n2m.blocksToMarkdown(children);
    parts.push(n2m.toMarkdownString(mdBlocks).parent ?? "");
  }
  return renderNote(parts.join("\n\n").trim());
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

// Number プロパティの値。無い、または空なら undefined。
function numberValue(prop) {
  return prop?.type === "number" && typeof prop.number === "number"
    ? prop.number
    : undefined;
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

// ブロックの子を全件取得する。
async function listChildren(blockId) {
  const blocks = [];
  let cursor = undefined;
  do {
    const res = await withRetry(`blocks.children.list(${blockId})`, () =>
      notion.blocks.children.list({ block_id: blockId, start_cursor: cursor })
    );
    blocks.push(...res.results);
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);
  return blocks;
}

// Notion の本文とは別に、slug ごとに末尾へ固定で差し込む生 HTML。
// script / iframe は notion-to-md → marked の経路でエスケープされて壊れるため、
// Notion には置かずここで管理する。
const FIXED_BLOCKS = {
  // iGEM の貢献者フォーム。銅メダル基準 #2 に必要なので消さないこと。
  attributions: `
<div class="row mt-4">
	<script type="text/javascript">
		// フォームの高さ変更を受け取って iframe をリサイズする。
		window.addEventListener("message", function (e) {
			if (e.origin === "https://teams.igem.org") {
				const { type, data } = JSON.parse(e.data);
				if (type === "igem-attribution-form") {
					const element = document.getElementById("igem-attribution-form");
					element.style.height = \`\${data + 100}px\`;
				}
			}
		});
	</script>
	<iframe style='width: 100%' id="igem-attribution-form" src="https://teams.igem.org/wiki/5539/attributions">
		>
	</iframe>
</div>
`,
};

// 1行ぶんを JSON 用のページに組み立てる。
async function buildPageData(row) {
  const props = row.properties;
  const rawSlug = plainText(props.slug).trim();
  const slug = normalizeSlug(rawSlug);
  const locale = (plainText(props.locale) || "en").trim().toLowerCase();

  // 本文 Markdown → HTML。
  const mdBlocks = await withRetry(`pageToMarkdown(${row.id})`, () =>
    n2m.pageToMarkdown(row.id)
  );
  const md = n2m.toMarkdownString(mdBlocks).parent ?? "";
  const fixed = (FIXED_BLOCKS[slug] ?? "").trim();
  const html = [renderMarkdown(md), fixed].filter(Boolean).join("\n");

  return {
    rawSlug,
    page: buildPage({
      slug,
      locale,
      title: plainText(props.heading).trim(),
      subtitle: plainText(props.subtitle).trim(),
      lead: plainText(props.lead).trim(),
      html,
      order: numberValue(props.order),
    }),
  };
}

// DB に無くなったページの JSON を消す。README.md など .json 以外には触れない。
function removeStaleJson(keep) {
  for (const locale of LOCALES) {
    const dir = path.join(CONTENT_DIR, locale);
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      if (!name.endsWith(".json") || keep.has(`${locale}/${name}`)) continue;
      fs.rmSync(path.join(dir, name));
      console.log(`[notion-sync] removed ${locale}/${name}`);
    }
  }
}

// 全ページをメモリ上で組み立てる。ここで例外が出ても content/ には何も書かない。
async function collectPages(rows) {
  const pages = new Map();
  let skipped = 0;

  for (const row of rows) {
    const props = row.properties;
    // published プロパティがあり、かつ false ならスキップ。
    if (props.published && props.published.type === "checkbox" && props.published.checkbox === false) {
      skipped++;
      continue;
    }

    // __ 接頭辞は制御用の行（__build__ など）。ページ生成しない。
    if (plainText(props.slug).trim().startsWith("__")) {
      skipped++;
      continue;
    }

    const { rawSlug, page } = await buildPageData(row);
    if (!page.slug) {
      console.warn("[notion-sync] slug が空（または使える文字が無い）行をスキップしました。");
      skipped++;
      continue;
    }
    if (!LOCALES.includes(page.locale)) {
      console.warn(`[notion-sync] locale "${page.locale}" は未対応のためスキップ: ${rawSlug}`);
      skipped++;
      continue;
    }
    if (rawSlug !== page.slug) {
      console.log(`[notion-sync] slug を正規化: "${rawSlug}" -> "${page.slug}"`);
    }

    const name = `${page.locale}/${page.slug}.json`;
    if (pages.has(name)) {
      console.warn(`[notion-sync] ${name} が重複しています。後の行で上書きします。`);
    }
    pages.set(name, page);
  }
  return { pages, skipped };
}

function writeOutputs(pages) {
  const imagesTodo = [];

  for (const [name, page] of pages) {
    fs.mkdirSync(path.join(CONTENT_DIR, page.locale), { recursive: true });
    fs.writeFileSync(path.join(CONTENT_DIR, name), serializePage(page), "utf8");
    console.log(`[notion-sync] wrote content/${name}`);

    for (const src of collectImageSrcs(page.html)) {
      if (!isIgemStatic(src)) {
        imagesTodo.push({ slug: page.slug, locale: page.locale, src });
      }
    }

    if (LEGACY_HTML) {
      const outDir = page.locale === "ja" ? path.join(PAGES_DIR, "ja") : PAGES_DIR;
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, `${page.slug}.html`), buildLegacyFile(page), "utf8");
      console.log(`[notion-sync] wrote wiki/pages ${page.locale}/${page.slug}.html`);
    }
  }

  removeStaleJson(new Set(pages.keys()));
  fs.writeFileSync(
    path.join(CONTENT_DIR, "images-todo.json"),
    serializePage(imagesTodo),
    "utf8"
  );
  return imagesTodo.length;
}

async function main() {
  const rows = await queryAllRows(NOTION_DATABASE_ID);
  // 取得が 0 件のときに全 JSON を消さないよう、何も書かずに止める。
  if (rows.length === 0) {
    console.error("[notion-sync] DB から 1 行も取得できませんでした。何も書き出さずに終了します。");
    process.exit(1);
  }

  const { pages, skipped } = await collectPages(rows);
  if (pages.size === 0) {
    console.error("[notion-sync] 書き出せるページが 0 件でした。何も書き出さずに終了します。");
    process.exit(1);
  }
  const imageCount = writeOutputs(pages);

  console.log(
    `[notion-sync] 完了: ${pages.size} 件書き出し / ${skipped} 件スキップ / static.igem.wiki 以外の画像 ${imageCount} 件。`
  );
}

main().catch((err) => {
  console.error("[notion-sync] 失敗:", err.message);
  process.exit(1);
});
