export type Locale = "en" | "ja";

export interface Model {
  // .glbのURL
  src: string;
  // 読み込み前とWebGL非対応時に出す静止画のURL
  poster: string;
  alt: string;
}

// Human Practicesの構造。形はcontent/README.mdのhpの節が正で、中身の深い検査はしない。
export interface HpInterview {
  no: string;
  title: string;
  person: string;
  affiliation: string;
  purposeHtml: string;
  takeHomeHtml: string;
  detailHtml: string;
  // 題にXXXを含むときだけ付く。
  draft?: boolean;
}

export interface HpUse {
  no: string;
  title: string;
  subtitle: string;
  introHtml: string;
  interviews: HpInterview[];
  conclusionHtml: string;
}

export interface Hp {
  intro: string;
  chapter0: { title: string; html: string };
  chapter1: { title: string; introHtml: string; interviews: HpInterview[] };
  chapter2: { title: string; introHtml: string; uses: HpUse[] };
  chapter4: { title: string; html: string };
}

export interface RawWikiPage {
  slug: string;
  locale: Locale;
  title: string;
  html: string;
  subtitle?: string;
  lead?: string;
  order?: number;
  islands?: string[];
  models?: Model[];
  published?: boolean;
  source?: "notion" | "local";
  hp?: Hp | null;
}

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
    models: page.models ?? [],
    published: page.published ?? true,
    source: page.source ?? "notion",
    hp: page.hp ?? null,
  };
}
