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

describe("applyBaseのnotionBase", () => {
  const notion = "https://static.igem.wiki/teams/1234";

  it("notion-imagesとnotion-filesにはbaseの代わりにnotionBaseを付ける", () => {
    expect(
      applyBase(
        '<img src="/notion-images/a.webp"><a href="/notion-files/b.pdf">b</a>',
        "/keio-japan/",
        notion
      )
    ).toBe(
      `<img src="${notion}/notion-images/a.webp"><a href="${notion}/notion-files/b.pdf">b</a>`
    );
  });

  it("それ以外のroot相対URLにはbaseを付ける", () => {
    expect(
      applyBase('<a href="/model/">m</a>', "/keio-japan/", `${notion}/`)
    ).toBe('<a href="/keio-japan/model/">m</a>');
  });

  it("srcsetでもnotionBaseを付ける", () => {
    expect(
      applyBase(
        '<img srcset="/notion-images/a.webp 1x, /x.png 2x">',
        "/keio-japan/",
        notion
      )
    ).toBe(
      `<img srcset="${notion}/notion-images/a.webp 1x, /keio-japan/x.png 2x">`
    );
  });

  it("baseが/でもnotionBaseを付ける", () => {
    expect(applyBase('<img src="/notion-images/a.webp">', "/", notion)).toBe(
      `<img src="${notion}/notion-images/a.webp">`
    );
  });

  it("未指定ならbaseを付ける", () => {
    expect(applyBase('<img src="/notion-images/a.webp">', "/keio-japan/")).toBe(
      '<img src="/keio-japan/notion-images/a.webp">'
    );
  });
});
