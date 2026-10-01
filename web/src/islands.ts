import { withBase } from "./base";
import type { WikiPage } from "./content";

// 先頭が/で、//ではないパスだけにbaseを付ける。
const withBaseIfLocal = (url: string) => (url.startsWith("/") && !url.startsWith("//") ? withBase(url) : url);

function modelProps(page: WikiPage) {
  const model = page.models[0];
  if (!model) return {};
  return { ...model, src: withBaseIfLocal(model.src), poster: withBaseIfLocal(model.poster) };
}

// 島の名前ごとの差し込み位置と、器に渡すprops。ビルド時にもブラウザでも読めるよう、DOMには触らない。
export const ISLANDS: Record<
  string,
  { place: "afterBody"; props: (page: WikiPage) => Record<string, unknown> }
> = {
  "member-list": { place: "afterBody", props: (page) => ({ locale: page.locale }) },
  "model-viewer": { place: "afterBody", props: modelProps },
};
