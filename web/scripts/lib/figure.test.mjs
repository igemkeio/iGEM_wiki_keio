import assert from "node:assert/strict";
import { test } from "node:test";

import {
  collectImageSrcs,
  isIgemStatic,
  parseCaption,
  renderImage,
} from "./figure.mjs";
import { renderMarkdown } from "./markdown.mjs";

test("Fig. N で始まるキャプションをラベルとタイトルに分ける", () => {
  assert.deepEqual(parseCaption("Fig. 1 培養の様子"), {
    label: "Fig. 1",
    title: "培養の様子",
    description: [],
  });
  assert.deepEqual(parseCaption("Fig.12: Growth curve"), {
    label: "Fig.12",
    title: "Growth curve",
    description: [],
  });
  assert.deepEqual(parseCaption("Fig. 2"), {
    label: "Fig. 2",
    title: "",
    description: [],
  });
});

test("Fig. N で始まらないキャプションは全体をタイトルにする", () => {
  assert.deepEqual(parseCaption("培養の様子"), {
    label: "",
    title: "培養の様子",
    description: [],
  });
});

test("キャプション付き画像をFigureカードにする", () => {
  assert.equal(
    renderImage({
      src: "https://static.igem.wiki/a.png",
      caption: "Fig. 1 図",
    }),
    [
      '<figure class="figure-card">',
      '<div class="figure-card__media"><img src="https://static.igem.wiki/a.png" alt="Fig. 1 図" /></div>',
      '<figcaption class="figure-card__body">',
      '<p class="figure-card__label">Fig. 1</p>',
      '<h3 class="figure-card__title">図</h3>',
      "</figcaption>",
      "</figure>",
    ].join("\n")
  );
});

test("キャプションが無い画像は素のimgにする", () => {
  assert.equal(
    renderImage({ src: "/a.png", caption: "" }),
    '<img src="/a.png" alt="" />'
  );
});

test("キャプションの特殊文字をエスケープする", () => {
  const html = renderImage({ src: "/a.png", caption: 'a "<b>"' });
  assert.match(html, /alt="a &quot;&lt;b&gt;&quot;"/u);
});

test("Figureカードは外側のMarkdown変換で形が崩れず、見出しidも付かない", () => {
  const card = renderImage({ src: "/a.png", caption: "Fig. 1 図" });
  assert.equal(
    renderMarkdown(`前\n\n${card}\n\n後`),
    `<p>前</p>\n${card}<p>後</p>`
  );
});

test("imgのsrcを集める", () => {
  const html =
    '<p><img src="/a.png" alt=""></p><img alt="" src="https://x/b.png?a=1&amp;b=2" />';
  assert.deepEqual(collectImageSrcs(html), [
    "/a.png",
    "https://x/b.png?a=1&b=2",
  ]);
});

test("static.igem.wikiかどうかを判定する", () => {
  assert.equal(isIgemStatic("https://static.igem.wiki/teams/1/a.png"), true);
  assert.equal(isIgemStatic("https://example.com/a.png"), false);
  assert.equal(isIgemStatic("/notion-images/a.png"), false);
});

test("キャプションの2行目以降を説明の段落にし、altは全文のままにする", () => {
  const html = renderImage({
    src: "/a.png",
    caption: "Fig. 1 題\n説明1\n説明2",
  });
  assert.match(
    html,
    /<h3 class="figure-card__title">題<\/h3>\n<p>説明1<\/p>\n<p>説明2<\/p>\n<\/figcaption>/u
  );
  assert.match(html, /alt="Fig\. 1 題 説明1 説明2"/u);
});

test("キャプションに空行があってもimgが壊れない", () => {
  const html = renderImage({ src: "/a.png", caption: "Fig. 1 題\n\n説明" });
  assert.match(html, /alt="Fig\. 1 題 説明"/u);
  assert.doesNotMatch(html, /\n\n/u);
  assert.equal(renderMarkdown(html).includes('alt="Fig. 1 題 説明"'), true);
});
