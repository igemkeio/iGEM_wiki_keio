import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { readPage } from "../content";
import { hpFixture } from "../test/fixtures/hp";
import { HpPage } from "./HpPage";

const page = readPage({
  slug: "human-practices",
  locale: "ja",
  title: "ヒューマンプラクティス",
  html: "<p>旧htmlだけの文</p>",
  hp: hpFixture,
});

const parse = (markup: string) =>
  new DOMParser().parseFromString(markup, "text/html");

const doc = parse(renderToStaticMarkup(<HpPage page={page} hp={hpFixture} />));

describe(HpPage, () => {
  it("帯のリンクが、章と用途に飛ぶ", () => {
    const hrefs = [...doc.querySelectorAll("nav a")].map((a) =>
      a.getAttribute("href")
    );
    expect(hrefs).toStrictEqual([
      "#hp-c1",
      "#hp-2-1",
      "#hp-2-2",
      "#hp-c4",
      "#hp-fig2",
    ]);
    for (const href of hrefs) {
      expect(doc.querySelector(href!)).not.toBeNull();
    }
  });

  it("図1が冒頭、図2が末尾にある", () => {
    const figures = [...doc.querySelectorAll("figure")].map((f) => f.id);
    expect(figures).toStrictEqual(["hp-fig1", "hp-fig2"]);
  });

  it("面談に日付と聞き方が付く", () => {
    const row = doc.querySelector("#hp-2-1-a");
    expect(row?.textContent).toContain("2026/03/03");
    expect(row?.textContent).toContain("対面・Zoom");
    expect(doc.querySelector("#hp-1-1")?.textContent).toContain("対面・Zoom");
  });

  it("仮の面談と、未記入の結論が仮の見た目になる", () => {
    expect(doc.querySelector("#hp-1-5")?.textContent).toContain("原稿が未確定");
    expect(doc.querySelector("#hp-2-2-b")?.textContent).toContain(
      "目的とTake homeがまだ書かれていない"
    );
    expect(doc.querySelector("#hp-2-1-d")?.textContent).toContain(
      "原稿が未確定"
    );
    expect(doc.querySelector("#hp-2-1-a")?.textContent).not.toContain(
      "原稿が未確定"
    );
    expect(doc.querySelector("#hp-2-2")?.textContent).toContain(
      "仮　原稿が未確定"
    );
    expect(doc.querySelector("#hp-2-1")?.textContent).toContain("結論の本文。");
  });

  it("4章は見出しでカードに分かれ、本文の無いカードは仮になる", () => {
    const c4 = doc.querySelector("#hp-c4");
    expect(c4?.querySelector("#hp-4-1")).not.toBeNull();
    expect(c4?.querySelector("#hp-4-2-a")?.textContent).toContain(
      "強度の本文。"
    );
    expect(c4?.querySelector("#hp-4-2-a")?.textContent).toContain("川上先生");
    expect(c4?.querySelector("#hp-4-2-b")?.textContent).toContain(
      "原稿が未確定"
    );
  });

  it("htmlは出さず、hp.intro と謝辞を出す", () => {
    expect(doc.body.textContent).not.toContain("旧htmlだけの文");
    expect(doc.body.textContent).toContain("導入の本文。");
    expect(doc.body.textContent).toContain("謝辞の本文。");
  });

  it("左の目次を出さない", () => {
    expect(doc.querySelector("aside")).toBeNull();
  });
});
