import { withBase } from "./base";
import type { WikiPage } from "./content";

// 先頭が/で、//ではないパスだけにbaseを付ける。
const withBaseIfLocal = (url: string) =>
  url.startsWith("/") && !url.startsWith("//") ? withBase(url) : url;

function modelProps(page: WikiPage) {
  const [model] = page.models;
  if (!model) {
    return {};
  }
  return {
    ...model,
    src: withBaseIfLocal(model.src),
    poster: withBaseIfLocal(model.poster),
  };
}

const ATTRIBUTION_FORM_SRC = "https://teams.igem.org/wiki/5539/attributions";

// 島の名前ごとの差し込み位置と、器に渡すprops。ビルド時にもブラウザでも読めるよう、DOMには触らない。
export const ISLANDS: Record<
  string,
  { place: "afterBody"; props: (page: WikiPage) => Record<string, unknown> }
> = {
  "attribution-form": {
    place: "afterBody",
    props: () => ({ src: ATTRIBUTION_FORM_SRC }),
  },
  "member-list": {
    place: "afterBody",
    props: (page) => ({ locale: page.locale }),
  },
  "model-viewer": { place: "afterBody", props: modelProps },
};
