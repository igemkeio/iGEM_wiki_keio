import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ArticlePage } from "./components/ArticlePage";
import { readPage } from "./content";

// 同期スクリプトの.mjsは型宣言を持たないので、必要な関数の型だけここで与える。
const FIGURE = resolve(process.cwd(), "scripts/lib/figure.mjs");
const MARKDOWN = resolve(process.cwd(), "scripts/lib/markdown.mjs");
const { renderImage } = (await import(/* @vite-ignore */ FIGURE)) as {
  renderImage: (a: { src: string; caption: string }) => string;
};
const { renderNote } = (await import(/* @vite-ignore */ MARKDOWN)) as {
  renderNote: (md: string) => string;
};

const file = resolve(process.cwd(), "../content/en/prose-sample.json");
const page = readPage(JSON.parse(readFileSync(file, "utf8")), "content/en/prose-sample.json");

describe("prose-sample", () => {
  it("確認用ページは非公開", () => {
    expect(page.published).toBe(false);
  });

  it("本文の要素を全部含み、.proseの中に出る", () => {
    const html = renderToStaticMarkup(<ArticlePage page={page} />);
    const doc = new DOMParser().parseFromString(html, "text/html");
    const prose = doc.querySelector(".prose");
    expect(prose?.innerHTML).toMatchSnapshot();
    for (const selector of [
      "h2", "h3", "p", "ul", "ol", "blockquote", "pre", "table", "img", "hr",
      ".figure-card .figure-card__media img", ".figure-card__label", ".figure-card__title",
      ".note .note__label", ".katex", ".katex-display",
    ]) {
      expect(prose?.querySelector(selector), selector).not.toBeNull();
    }
  });

  it("Figureカードと素の画像とNoteが同期側の出力と同じ形", () => {
    expect(page.html).toContain(renderImage({ src: "https://static.igem.wiki/teams/0000/sample.png", caption: "" }));
    expect(page.html).toContain(
      renderImage({
        src: "https://static.igem.wiki/teams/0000/sample.png",
        caption:
          "Fig. 1 Figure の見出し\n図の説明です。2行ほどになる長さの文章を入れて、カードの見た目を確認します。",
      })
    );
    expect(page.html).toContain(renderNote("補足の本文です。"));
  });
});
