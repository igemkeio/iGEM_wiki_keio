export type Locale = "en" | "ja";

export interface Model {
  // .glbのURL
  src: string;
  // 読み込み前とWebGL非対応時に出す静止画のURL
  poster: string;
  alt: string;
}

// DBTLの構造。形はcontent/README.mdのdbtlの節が正で、中身の深い検査はしない。
export interface DbtlIteration {
  no: number;
  title: string;
  design: string;
  build: string;
  test: string;
  learn: string;
  notesHtml?: string;
}

export interface DbtlCycle {
  no: number;
  layer: "base" | "design";
  title: string;
  tagline: string;
  whyHtml: string;
  hypothesis: string;
  criteria: string;
  iterations: DbtlIteration[];
  outcomesHtml: string;
  handoffHtml: string;
  // サイクルの見出しとh3の間に本文があるときだけ付く。
  leadHtml?: string;
}

export interface DbtlPart {
  label: string;
  title: string;
  introHtml: string;
  cycles: DbtlCycle[];
}

export interface Dbtl {
  intro: string;
  parts: DbtlPart[];
  outro: string;
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
  dbtl?: Dbtl | null;
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
    dbtl: page.dbtl ?? null,
  };
}
