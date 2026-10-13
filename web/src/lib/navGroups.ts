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
  // order順。分類に載っていないページは、fallbackの分類の末尾に入る。
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

// localeのページを分類ごとにまとめる。routesはorder順に並んでいる前提で、その順を保つ。
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
      ...pages.filter((r) => category.slugs.includes(r.page.slug)),
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
