import { describe, expect, it } from "vitest";

import {
  splitAfterParagraph,
  splitCardList,
  splitDescription,
  splitHeading,
} from "./descriptionSections";

const html = [
  '<h2 id="project-description">Project Description</h2>',
  '<aside class="note"><p class="note__label">Note</p><h2 id="message">Message</h2>',
  "<p>一</p><p><strong>二</strong></p></aside>",
  '<h2 id="a">Introduction: 秩序</h2><p>本文A</p><img src="/x.webp" alt="" /><p>末尾A</p>',
  '<h2 id="b">Conclusion:</h2><p>本文B</p>',
  '<h3 id="s1">Step 1. X — 日本語</h3><p>s1</p>',
  '<h3 id="参考文献">参考文献</h3><p>[1] Foo, 2020.</p><p>[10] Bar, 2021.</p>',
  '<h2 id="下書き1">下書き1</h2><p>draft</p>',
].join("\n");

describe(splitHeading, () => {
  it.each([
    [
      "Introduction: 秩序が機能を生み出す",
      "Introduction",
      "秩序が機能を生み出す",
    ],
    ["Engineering — 細胞を組み合わせる", "Engineering", "細胞を組み合わせる"],
    ["Conclusion:", "Conclusion", undefined],
    ["Our System: One Direction", "Our System: One Direction", undefined],
    ["Plain", "Plain", undefined],
  ])("%s", (text, title, sub) => {
    expect(splitHeading(text)).toStrictEqual(
      sub === undefined ? { title } : { title, sub }
    );
  });
});

describe(splitAfterParagraph, () => {
  it("n個目の段落の終わりで割る", () => {
    expect(splitAfterParagraph("<p>a</p><p>b</p><p>c</p>", 2)).toStrictEqual([
      "<p>a</p><p>b</p>",
      "<p>c</p>",
    ]);
  });

  it("段落が足りなければnull", () => {
    expect(splitAfterParagraph("<p>a</p>", 2)).toBeNull();
  });
});

describe(splitDescription, () => {
  const parts = splitDescription(html);

  it("見出し、メッセージ、下書きを分ける", () => {
    expect(parts?.eyebrow).toBe("Project Description");
    expect(parts?.message).toStrictEqual([
      { html: "一", emphasis: false },
      { html: "二", emphasis: true },
    ]);
    expect(parts?.rest).toBe('<h2 id="下書き1">下書き1</h2><p>draft</p>');
  });

  it("節をh2で割り、h3を節の下に入れる", () => {
    expect(parts?.sections.map((s) => s.id)).toStrictEqual(["a", "b"]);
    expect(parts?.sections[0].body).toContain('<img src="/x.webp"');
    expect(parts?.sections[1].subsections).toStrictEqual([
      { id: "s1", heading: "Step 1. X — 日本語", body: "<p>s1</p>\n" },
    ]);
  });

  it("参考文献を節から外して[n]を落とす", () => {
    expect(parts?.refs).toStrictEqual(["Foo, 2020.", "Bar, 2021."]);
  });

  it("下書きが無ければrestは空", () => {
    expect(
      splitDescription(html.split("\n").slice(0, 6).join("\n"))?.rest
    ).toBe("");
  });

  it("noteが無ければnull", () => {
    expect(splitDescription("<h2>x</h2>")).toBeNull();
  });
});

const ol = (n: number) =>
  `<ol>${"<li><strong>見出し。</strong> 説明。</li>".repeat(n)}</ol>`;

describe(splitCardList, () => {
  it("liをstrongの見出しと説明に割り、前後のhtmlを返す", () => {
    expect(splitCardList(`<p>前</p>${ol(3)}<p>後</p>`, 3)).toStrictEqual({
      before: "<p>前</p>",
      after: "<p>後</p>",
      items: Array.from({ length: 3 }, () => ({
        heading: "見出し。",
        text: "説明。",
      })),
    });
  });

  it("件数が違う、strongが無い、olが無いならnull", () => {
    expect(splitCardList(ol(2), 3)).toBeNull();
    expect(splitCardList("<ol><li>a</li><li>b</li></ol>", 2)).toBeNull();
    expect(splitCardList("<p>x</p>", 3)).toBeNull();
  });
});
