import { readPage } from "./content";
import type { WikiPage } from "./content";

const modules = import.meta.glob<unknown>("../../content/*/*.json", {
  eager: true,
  import: "default",
});

export interface Route {
  page: WikiPage;
  // baseを含まないURLパス。"/"や"/ja/model/"のように"/"で終わる。
  path: string;
}

export function pagePath({
  locale,
  slug,
}: Pick<WikiPage, "locale" | "slug">): string {
  const prefix = locale === "en" ? "/" : "/ja/";
  return slug === "home" ? prefix : `${prefix}${slug}/`;
}

function compareSlug(a: string, b: string): number {
  if (a < b) {
    return -1;
  }
  return a > b ? 1 : 0;
}

export function buildRoutes(entries: Record<string, unknown>): Route[] {
  return Object.entries(entries)
    .map(([file, json]) => ({ file, page: readPage(json, file) }))
    .filter(({ page }) => page.published)
    .toSorted(
      (a, b) =>
        a.page.order - b.page.order || compareSlug(a.page.slug, b.page.slug)
    )
    .map(({ file, page }) => ({ file, page, path: pagePath(page) }))
    .map((route, i, all) => {
      const other = all.slice(0, i).find((r) => r.path === route.path);
      if (other) {
        throw new Error(
          `URLパス${route.path}が衝突しています: ${other.file} と ${route.file}`
        );
      }
      return { page: route.page, path: route.path };
    });
}

export const routes: Route[] = buildRoutes(modules);
