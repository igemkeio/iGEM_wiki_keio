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

function compareSlug(a: string, b: string): number {
  if (a < b) {
    return -1;
  }
  return a > b ? 1 : 0;
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
          (b.order ?? Number.MAX_SAFE_INTEGER) || compareSlug(a.slug, b.slug)
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

// 分類の先頭のページ。対応表の順で先頭にある公開ページで、無ければ対応表にないページ(pagesのorder順)の先頭。
export function firstPageOf(pages: Entry[], label: string): Entry | undefined {
  const category = navConfig.categories.find((c) => c.label === label);
  const mapped = new Set(navConfig.categories.flatMap((c) => c.slugs));
  const inTable = (category?.slugs ?? []).flatMap((slug) =>
    pages.filter((p) => p.slug === slug)
  );
  const unmapped =
    category?.id === navConfig.fallback
      ? pages.filter((p) => !mapped.has(p.slug))
      : [];
  return [...inTable, ...unmapped][0];
}
