export type Locale = "en" | "ja";

export type RawWikiPage = {
  slug: string;
  locale: Locale;
  title: string;
  html: string;
  subtitle?: string;
  lead?: string;
  order?: number;
  islands?: string[];
  published?: boolean;
};

export type WikiPage = Required<RawWikiPage>;

const isString = (v: unknown): v is string => typeof v === "string";

// 必須フィールドだけ確認し、任意フィールドの既定値を埋めて返す。未知のフィールドは落とさない。
export function readPage(raw: unknown, source?: string): WikiPage {
  const page = raw as Partial<RawWikiPage> | null;
  if (
    !page ||
    !isString(page.slug) ||
    (page.locale !== "en" && page.locale !== "ja") ||
    !isString(page.title) ||
    !isString(page.html)
  ) {
    throw new Error(
      `原稿JSONの必須フィールド(slug, locale, title, html)が不正です${source ? `: ${source}` : ""}`
    );
  }
  return {
    ...page,
    slug: page.slug,
    locale: page.locale,
    title: page.title,
    html: page.html,
    subtitle: page.subtitle ?? "",
    lead: page.lead ?? "",
    order: page.order ?? Number.MAX_SAFE_INTEGER,
    islands: page.islands ?? [],
    published: page.published ?? true,
  };
}
