import type { WikiPage } from "./content";

// 島の名前ごとの差し込み位置と、器に渡すprops。ビルド時にもブラウザでも読めるよう、DOMには触らない。
export const ISLANDS: Record<
  string,
  { place: "afterBody"; props: (page: WikiPage) => Record<string, unknown> }
> = {
  "member-list": { place: "afterBody", props: (page) => ({ locale: page.locale }) },
};
