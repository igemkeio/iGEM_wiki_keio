import { readPage, type WikiPage } from "./content";

const modules = import.meta.glob<unknown>("../../content/*/*.json", {
  eager: true,
  import: "default",
});

export type Route = {
  page: WikiPage;
  // baseを含まないURLパス。"/"や"/ja/model/"のように"/"で終わる。
  path: string;
};

export function pagePath({ locale, slug }: Pick<WikiPage, "locale" | "slug">): string {
  const prefix = locale === "en" ? "/" : "/ja/";
  return slug === "home" ? prefix : `${prefix}${slug}/`;
}

export const routes: Route[] = Object.entries(modules)
  .map(([file, json]) => readPage(json, file))
  .filter((page) => page.published)
  .sort((a, b) => a.order - b.order || (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0))
  .map((page) => ({ page, path: pagePath(page) }));
