// 既存の wiki/pages/*.html を Notion Database へ取り込む（逆方向・初期移行用）。
// 各 HTML から title/lead/page_content を抽出し、本文を Markdown 経由で Notion ブロック化、
// slug+locale ごとに 1 行作成する。すでに同じ slug+locale の行があればスキップ。
//
// 実行: cd web && node scripts/notion-import.mjs
//   （NOTION_TOKEN / NOTION_DATABASE_ID は .env.local か環境変数）
//
// ⚠ 注意: Notion は div/class などのレイアウト用 HTML を保持できない。
//   見出し・段落・リスト・リンクなどの本文は移るが、Bootstrap の grid 等は失われる。

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@notionhq/client";
import TurndownService from "turndown";
import { markdownToBlocks } from "@tryfabric/martian";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_DIR = path.join(__dirname, "..");
const PAGES_DIR = path.join(WEB_DIR, "..", "wiki", "pages");

// notion-sync.mjs と同じ最小 .env.local ローダ。
function loadEnvLocal() {
  const envPath = path.join(WEB_DIR, ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let val = m[2].trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(m[1] in process.env)) process.env[m[1]] = val;
  }
}

loadEnvLocal();

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;
if (!NOTION_TOKEN || !NOTION_DATABASE_ID) {
  console.error("[notion-import] NOTION_TOKEN と NOTION_DATABASE_ID が必要です。");
  process.exit(1);
}

const notion = new Client({ auth: NOTION_TOKEN });
const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
});

// 取り込み対象外の slug（テスト等）。
const SKIP_SLUGS = new Set(["notion-test"]);

// wiki.ts と同じブロック抽出ロジック。
function extractBlock(src, name) {
  const re = new RegExp(`\\{%\\s*block\\s+${name}\\s*%\\}([\\s\\S]*?)\\{%\\s*endblock\\s*%\\}`);
  const m = src.match(re);
  return m ? m[1].trim() : "";
}

function rewriteUrlFor(src) {
  return src.replace(
    /\{\{\s*url_for\(\s*'static'\s*,\s*filename\s*=\s*'([^']+)'\s*\)\s*\}\}/g,
    "/static/$1"
  );
}

function listSlugs(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(".html"))
    .map((e) => e.name.replace(/\.html$/, ""));
}

// 既存行の (slug|locale) 集合を取得して重複作成を防ぐ。
async function existingKeys() {
  const keys = new Set();
  let cursor = undefined;
  do {
    const res = await notion.databases.query({
      database_id: NOTION_DATABASE_ID,
      start_cursor: cursor,
    });
    for (const row of res.results) {
      const p = row.properties;
      const slug = (p.slug?.title ?? []).map((t) => t.plain_text).join("");
      const locale = p.locale?.select?.name ?? "";
      keys.add(`${slug}|${locale}`);
    }
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);
  return keys;
}

// 1 ページを Notion に作成。children が 100 を超える場合は分割追記する。
async function createRow({ slug, locale, heading, lead, blocks }) {
  const first = blocks.slice(0, 100);
  const rest = blocks.slice(100);

  const page = await notion.pages.create({
    parent: { database_id: NOTION_DATABASE_ID },
    properties: {
      slug: { title: [{ text: { content: slug } }] },
      locale: { select: { name: locale } },
      heading: { rich_text: [{ text: { content: heading.slice(0, 2000) } }] },
      lead: { rich_text: [{ text: { content: lead.slice(0, 2000) } }] },
      published: { checkbox: true },
    },
    children: first,
  });

  for (let i = 0; i < rest.length; i += 100) {
    await notion.blocks.children.append({
      block_id: page.id,
      children: rest.slice(i, i + 100),
    });
  }
  return page.id;
}

async function importLocale(locale, dir, existing) {
  let created = 0;
  for (const slug of listSlugs(dir)) {
    if (SKIP_SLUGS.has(slug)) continue;
    if (existing.has(`${slug}|${locale}`)) {
      console.log(`[notion-import] skip (既存) ${locale}/${slug}`);
      continue;
    }

    const raw = fs.readFileSync(path.join(dir, `${slug}.html`), "utf8");
    const src = rewriteUrlFor(raw);
    const heading = extractBlock(src, "title");
    const lead = extractBlock(src, "lead");
    const contentHtml = extractBlock(src, "page_content");

    const md = turndown.turndown(contentHtml);
    const blocks = markdownToBlocks(md);

    await createRow({ slug, locale, heading, lead, blocks });
    console.log(`[notion-import] created ${locale}/${slug} (${blocks.length} blocks)`);
    created++;
  }
  return created;
}

async function main() {
  const existing = await existingKeys();
  const en = await importLocale("en", PAGES_DIR, existing);
  const ja = await importLocale("ja", path.join(PAGES_DIR, "ja"), existing);
  console.log(`[notion-import] 完了: en ${en} 件 / ja ${ja} 件 作成。`);
}

main().catch((err) => {
  console.error("[notion-import] 失敗:", err.message);
  process.exit(1);
});
