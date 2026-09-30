export type Locale = "en" | "ja";

export type WikiPage = {
  slug: string;
  locale: Locale;
  title: string;
  subtitle?: string;
  lead?: string;
  html: string;
  order?: number;
  islands?: string[];
  published?: boolean;
};

const isString = (v: unknown): v is string => typeof v === "string";

// JSONを読んで必須フィールドだけ確認する。未知のフィールドは落とさずそのまま通す。
export function readPage(raw: unknown): WikiPage {
  const page = raw as Partial<WikiPage> | null;
  if (
    !page ||
    !isString(page.slug) ||
    (page.locale !== "en" && page.locale !== "ja") ||
    !isString(page.title) ||
    !isString(page.html)
  ) {
    throw new Error("原稿JSONの必須フィールド(slug, locale, title, html)が不正です");
  }
  return page as WikiPage;
}
