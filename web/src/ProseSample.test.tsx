import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ArticlePage } from "./components/ArticlePage";
import { readPage } from "./content";

const file = resolve(process.cwd(), "../content/en/prose-sample.json");
const page = readPage(JSON.parse(readFileSync(file, "utf8")), "content/en/prose-sample.json");

describe("prose-sample", () => {
  it("確認用ページは非公開", () => {
    expect(page.published).toBe(false);
  });

  it("本文の要素を全部含み、.proseの中に出る", () => {
    const html = renderToStaticMarkup(<ArticlePage page={page} />);
    expect(html).toMatchSnapshot();
    const doc = new DOMParser().parseFromString(html, "text/html");
    const prose = doc.querySelector(".prose");
    for (const selector of [
      "h2", "h3", "p", "ul", "ol", "blockquote", "pre", "table", "img", "hr",
      ".figure-card .figure-card__media img", ".figure-card__label", ".figure-card__title",
      ".note .note__label", ".katex", ".katex-display",
    ]) {
      expect(prose?.querySelector(selector), selector).not.toBeNull();
    }
  });
});
