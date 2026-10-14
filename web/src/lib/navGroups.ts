import type { Locale } from "../content";
import navCategories from "../data/nav-categories.json";
import type { Route } from "../routes";

export interface NavCategory {
  id: string;
  // 表示名。日英とも英語。
  label: string;
  slugs: string[];
}

export interface NavGroup {
  category: NavCategory;
  // 対応表のslug順。分類に載っていないページは、fallbackの分類の末尾にorder順で入る。
  routes: Route[];
}

export interface NavConfig {
  fallback: string;
  categories: NavCategory[];
}

export const NAV_CONFIG: NavConfig = navCategories;

// homeはどの分類にも属さない。ロゴからたどる。
const isNavPage = (r: Route, locale: Locale) =>
  r.page.locale === locale && r.page.slug !== "home";

// localeのページを分類ごとにまとめる。分類内は対応表のslug順(その言語に無いslugは飛ばす)で、対応表にないページはroutesの順(order順)で続ける。
export function groupRoutes(
  locale: Locale,
  routes: Route[],
  config: NavConfig = NAV_CONFIG
): NavGroup[] {
  const pages = routes.filter((r) => isNavPage(r, locale));
  const known = new Set(config.categories.flatMap((c) => c.slugs));
  return config.categories.map((category) => ({
    category,
    routes: [
      ...category.slugs.flatMap((slug) =>
        pages.filter((r) => r.page.slug === slug)
      ),
      ...(category.id === config.fallback
        ? pages.filter((r) => !known.has(r.page.slug))
        : []),
    ],
  }));
}

// pageが属する分類のid。homeはundefined、分類に載っていないページはfallback。
export function categoryIdOf(
  slug: string,
  config: NavConfig = NAV_CONFIG
): string | undefined {
  if (slug === "home") {
    return undefined;
  }
  return (
    config.categories.find((c) => c.slugs.includes(slug))?.id ?? config.fallback
  );
}
