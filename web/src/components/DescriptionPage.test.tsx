import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { readPage } from "../content";
import { toText } from "../lib/toc";
import { Page } from "../Page";
import { pagePath } from "../routes";

const assets = { css: ["assets/index-abc.css"], js: "assets/index-abc.js" };
const manuscript = JSON.parse(
  readFileSync(
    resolve(import.meta.dirname, "../../../content/ja/description.json"),
    "utf-8"
  )
);

// 空白の入り方(strongとその後ろ、カードの見出しと説明)の違いを無視して比べる。
const squash = (text: string) => text.replaceAll(/\s+/gu, "");
// 見出しや段落のタグを外して文字だけにする。
const textOf = (html: string) => squash(toText(html));

describe("日本語版Description", () => {
  const page = readPage(manuscript);
  const html = renderToStaticMarkup(
    <Page
      page={page}
      routes={[{ page, path: pagePath(page) }]}
      assets={assets}
    />
  );

  it("専用の部品で出している", () => {
    expect(html).toContain("ONE DIRECTION");
  });

  it("原稿のp、liの文が画面から落ちていない", () => {
    const shown = textOf(html);
    // note__labelはMessageの枠の見出しで、画面には持ち込まない。
    const source = [
      ...page.html.matchAll(/<(p|li)\b([^>]*)>([\s\S]*?)<\/\1>/gu),
    ].filter((m) => !m[2].includes("note__label"));
    const missing = source
      .map((m) => textOf(m[3].replace(/^\s*\[\d+\]\s*/u, "")))
      .filter((text) => text !== "" && !shown.includes(text));
    expect(missing).toStrictEqual([]);
  });

  it("目次の先頭リンクの行き先と、Applicationsの3つの帯が出る", () => {
    expect(html).toContain('id="project-description"');
    for (const id of [
      "bacterial-wires",
      "smart-bandages",
      "cascade-enzyme-pathways",
    ]) {
      expect(html).toContain(`id="${id}`);
    }
  });
});
