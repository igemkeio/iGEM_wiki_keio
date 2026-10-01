import { describe, expect, it } from "vitest";

import { applyBase } from "./applyBase";

describe(applyBase, () => {
  it("二重引用符のroot相対URLにbaseを付ける", () => {
    expect(applyBase('<img src="/notion-images/a.png" alt="">', "/keio/")).toBe(
      '<img src="/keio/notion-images/a.png" alt="">'
    );
  });

  it("単一引用符も対象にする", () => {
    expect(applyBase("<img src='/a.png'>", "/keio/")).toBe(
      "<img src='/keio/a.png'>"
    );
  });

  it("aのhrefとposterも対象にする", () => {
    expect(
      applyBase(
        '<a href="/model/">m</a><video poster="/p.png"></video>',
        "/keio/"
      )
    ).toBe('<a href="/keio/model/">m</a><video poster="/keio/p.png"></video>');
  });

  it("srcsetは候補ごとに付ける", () => {
    expect(
      applyBase(
        '<img srcset="/a.png 1x, /b.png 2x, https://x.org/c.png 3x, //cdn/d.png 4x">',
        "/keio/"
      )
    ).toBe(
      '<img srcset="/keio/a.png 1x, /keio/b.png 2x, https://x.org/c.png 3x, //cdn/d.png 4x">'
    );
  });

  it("//で始まるURLは変えない", () => {
    expect(applyBase('<img src="//cdn.example/a.png">', "/keio/")).toBe(
      '<img src="//cdn.example/a.png">'
    );
  });

  it("絶対URL、data:、#、mailto:、相対パスは変えない", () => {
    const html =
      '<img src="https://static.igem.wiki/a.png"><img src="data:image/png;base64,AAAA"><a href="#top">t</a><a href="mailto:a@b.c">m</a><a href="x/y.html">r</a>';
    expect(applyBase(html, "/keio/")).toBe(html);
  });

  it("baseが/のときは何も変えない", () => {
    const html = '<img src="/a.png">';
    expect(applyBase(html, "/")).toBe(html);
  });

  it("baseの末尾の/の有無で結果が変わらず、二重にならない", () => {
    expect(applyBase('<img src="/a.png">', "/keio")).toBe(
      '<img src="/keio/a.png">'
    );
    expect(applyBase('<img src="/a.png">', "/keio/")).toBe(
      '<img src="/keio/a.png">'
    );
  });

  it("タグの外の文字列は変えない", () => {
    expect(applyBase('<p>src="/a.png" と書く</p>', "/keio/")).toBe(
      '<p>src="/a.png" と書く</p>'
    );
  });
});
