import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type Locale = "en" | "ja";
export interface Entry {
  locale: Locale;
  slug: string;
  title: string;
  order: number;
  path: string;
}

const contentDir = join(import.meta.dirname, "../../content");

// content/のpublishedなページ。E2E用の未公開ページはPRERENDER_ALLで出るが、ここでは数えない。
export function publishedPages(locale: Locale): Entry[] {
  const dir = join(contentDir, locale);
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map(
      (f) =>
        JSON.parse(readFileSync(join(dir, f), "utf-8")) as {
          slug: string;
          title: string;
          order?: number;
          published?: boolean;
        }
    )
    .filter((p) => p.published !== false)
    .toSorted(
      (a, b) =>
        (a.order ?? Number.MAX_SAFE_INTEGER) -
        (b.order ?? Number.MAX_SAFE_INTEGER)
    )
    .map(({ slug, title, order }) => {
      const prefix = locale === "en" ? "/" : "/ja/";
      return {
        locale,
        slug,
        title,
        order: order ?? Number.MAX_SAFE_INTEGER,
        path: slug === "home" ? prefix : `${prefix}${slug}/`,
      };
    });
}

export const locales: Locale[] = ["en", "ja"];

export const labels = {
  en: { nav: "Main", menu: "Menu", category: "Category" },
  ja: { nav: "メインメニュー", menu: "メニュー", category: "カテゴリ" },
} as const;

interface NavConfig {
  fallback: string;
  categories: { id: string; label: string; slugs: string[] }[];
}

export const navConfig = JSON.parse(
  readFileSync(
    join(import.meta.dirname, "../src/data/nav-categories.json"),
    "utf-8"
  )
) as NavConfig;

// slugが属する分類の表示名。homeはundefined、対応表にないslugはfallbackの分類。
export function categoryLabelOf(slug: string): string | undefined {
  if (slug === "home") {
    return undefined;
  }
  const found =
    navConfig.categories.find((c) => c.slugs.includes(slug)) ??
    navConfig.categories.find((c) => c.id === navConfig.fallback);
  return found?.label;
}
