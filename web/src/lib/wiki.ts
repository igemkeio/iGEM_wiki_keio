import fs from "node:fs";
import path from "node:path";

export type Locale = "en" | "ja";

const PAGES_DIR = path.join(process.cwd(), "..", "wiki", "pages");

export type WikiPage = {
  slug: string;
  locale: Locale;
  title: string;
  lead: string;
  content: string;
};

function pageFilePath(locale: Locale, slug: string): string {
  return locale === "ja"
    ? path.join(PAGES_DIR, "ja", `${slug}.html`)
    : path.join(PAGES_DIR, `${slug}.html`);
}

export function listSlugs(locale: Locale): string[] {
  const dir = locale === "ja" ? path.join(PAGES_DIR, "ja") : PAGES_DIR;
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(".html"))
    .map((e) => e.name.replace(/\.html$/, ""));
}

function extractBlock(src: string, name: string): string {
  const re = new RegExp(
    `\\{%\\s*block\\s+${name}\\s*%\\}([\\s\\S]*?)\\{%\\s*endblock\\s*%\\}`
  );
  const m = src.match(re);
  return m ? m[1].trim() : "";
}

function rewriteUrlFor(src: string): string {
  return src.replace(
    /\{\{\s*url_for\(\s*'static'\s*,\s*filename\s*=\s*'([^']+)'\s*\)\s*\}\}/g,
    "/static/$1"
  );
}

export function readPage(locale: Locale, slug: string): WikiPage {
  const raw = fs.readFileSync(pageFilePath(locale, slug), "utf8");
  const src = rewriteUrlFor(raw);
  return {
    slug,
    locale,
    title: extractBlock(src, "title"),
    lead: extractBlock(src, "lead"),
    content: extractBlock(src, "page_content"),
  };
}
