import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type Locale = "en" | "ja";
export type Entry = { locale: Locale; slug: string; title: string; path: string };

const contentDir = join(import.meta.dirname, "../../content");

// content/のpublishedなページ。E2E用の未公開ページはPRERENDER_ALLで出るが、ここでは数えない。
export function publishedPages(locale: Locale): Entry[] {
  const dir = join(contentDir, locale);
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")) as { slug: string; title: string; published?: boolean })
    .filter((p) => p.published !== false)
    .map(({ slug, title }) => {
      const prefix = locale === "en" ? "/" : "/ja/";
      return { locale, slug, title, path: slug === "home" ? prefix : `${prefix}${slug}/` };
    });
}

export const locales: Locale[] = ["en", "ja"];

export const labels = {
  en: { nav: "Main", menu: "Menu" },
  ja: { nav: "メインメニュー", menu: "メニュー" },
} as const;
