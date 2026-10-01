import assert from "node:assert/strict";
import { test } from "node:test";

import {
  checkLang,
  checkNoScript,
  checkStructure,
  extractRefs,
  extractStyleUrls,
  isExternalCheckTarget,
  isInternalCheckTarget,
  parseTags,
  splitSrcset,
} from "./html.mjs";

const ok = `<!doctype html><html lang="en"><head><title>T</title></head><body><h1>H</h1><img src="/a.png" alt=""></body></html>`;

test("parseTagsは属性を3種類の引用形式で読む", () => {
  const [tag] = parseTags(`<img src="a" alt='b' data-x=c hidden>`);
  assert.equal(tag.name, "img");
  assert.deepEqual(
    [...tag.attrs],
    [
      ["src", "a"],
      ["alt", "b"],
      ["data-x", "c"],
      ["hidden", ""],
    ]
  );
});

test("parseTagsは属性値の中の>とコメント、scriptとstyleの中身を無視する", () => {
  const tags = parseTags(
    `<a title="a>b" href="/x">x</a><!-- <img src="http://bad"> --><script>var s = "<img src=1>"</script><style>a::after{content:"<img src=2>"}</style>`
  );
  assert.deepEqual(
    tags.map((t) => t.name),
    ["a", "script", "style"]
  );
});

test("parseTagsはタグ名と属性名の大文字を小文字にする", () => {
  const [tag] = parseTags(`<IMG SRC="/a.png" ALT="">`);
  assert.equal(tag.name, "img");
  assert.deepEqual([...tag.attrs.keys()], ["src", "alt"]);
});

test("属性値の文字参照を戻す", () => {
  const [tag] = parseTags(
    `<a href="&#104;ttps://x.test/?a=1&amp;b=2" title="&#x68;&lt;&gt;&quot;&#39;&amp;amp;">`
  );
  assert.equal(tag.attrs.get("href"), "https://x.test/?a=1&b=2");
  assert.equal(tag.attrs.get("title"), `h<>"'&amp;`);
});

test("extractRefsはsrc、href、data、poster、xlink:hrefを全タグから返す", () => {
  const refs = extractRefs(
    `<a href="/x">x</a><object data="/o.svg"></object><video poster="/p.png" src="/v.mp4"></video><svg><use xlink:href="#i"/><image href="/i.png"/></svg>`
  );
  assert.deepEqual(refs, [
    { tag: "a", attr: "href", value: "/x" },
    { tag: "object", attr: "data", value: "/o.svg" },
    { tag: "video", attr: "src", value: "/v.mp4" },
    { tag: "video", attr: "poster", value: "/p.png" },
    { tag: "use", attr: "xlink:href", value: "#i" },
    { tag: "image", attr: "href", value: "/i.png" },
  ]);
});

test("extractRefsはsrcsetとimagesrcsetを候補ごとに分ける", () => {
  const refs = extractRefs(
    `<img srcset="/a.png 1x, https://x.test/b.png 2x"><link imagesrcset="/c.png 480w,/d.png 800w">`
  );
  assert.deepEqual(
    refs.map((r) => [r.attr, r.value]),
    [
      ["srcset", "/a.png"],
      ["srcset", "https://x.test/b.png"],
      ["imagesrcset", "/c.png"],
      ["imagesrcset", "/d.png"],
    ]
  );
});

test("splitSrcsetはカンマを含むURLと記述子のない候補を扱う", () => {
  assert.deepEqual(splitSrcset("a.png, b.png 2x"), ["a.png", "b.png"]);
  assert.deepEqual(splitSrcset("data:image/png;base64,AAA 1x, b.png"), [
    "data:image/png;base64,AAA",
    "b.png",
  ]);
  assert.deepEqual(splitSrcset(""), []);
});

test("extractRefsはmetaのcontentとrefreshのurlを返す", () => {
  const refs = extractRefs(
    `<meta property="og:image" content="https://x.test/o.png"><meta http-equiv="refresh" content="0; url=https://y.test/">`
  );
  assert.deepEqual(
    refs.map((r) => r.value),
    ["https://x.test/o.png", "https://y.test/"]
  );
});

test("外部URLの検査から外すのはaとareaのhrefだけ", () => {
  assert.equal(isExternalCheckTarget({ tag: "a", attr: "href" }), false);
  assert.equal(isExternalCheckTarget({ tag: "area", attr: "href" }), false);
  assert.equal(isExternalCheckTarget({ tag: "a", attr: "xlink:href" }), false);
  for (const tag of [
    "link",
    "script",
    "img",
    "source",
    "video",
    "iframe",
    "object",
    "use",
    "meta",
  ]) {
    assert.equal(isExternalCheckTarget({ tag, attr: "src" }), true, tag);
  }
  assert.equal(isExternalCheckTarget({ tag: "a", attr: "src" }), true);
});

test("内部リンクの検査からmetaを除く", () => {
  assert.equal(isInternalCheckTarget({ tag: "meta", attr: "content" }), false);
  assert.equal(isInternalCheckTarget({ tag: "img", attr: "src" }), true);
});

test("extractStyleUrlsはstyle属性と<style>の中身を読む", () => {
  const html = `<div style="background:url(https://x.test/a.png)"></div><style>@import"https://y.test/a.css";b{background:url('/b.png')}</style>`;
  assert.deepEqual(extractStyleUrls(html), [
    "/b.png",
    "https://y.test/a.css",
    "https://x.test/a.png",
  ]);
});

test("checkStructureは正しいページで違反なし", () => {
  assert.deepEqual(checkStructure(ok), []);
});

test("checkStructureの理由の文言", () => {
  assert.deepEqual(checkStructure(`<html><body><img src="a"></body></html>`), [
    "<title>が0個あります(1個である必要があります)",
    "<h1>が0個あります(1個である必要があります)",
    "alt属性のない<img>が1個あります",
  ]);
  assert.deepEqual(
    checkStructure(`<title>a</title><title>b</title><h1>a</h1><h1>b</h1>`),
    [
      "<title>が2個あります(1個である必要があります)",
      "<h1>が2個あります(1個である必要があります)",
    ]
  );
});

test("checkStructureはh10などをh1と数えない", () => {
  assert.deepEqual(
    checkStructure(`<title>a</title><h1>a</h1><header></header>`),
    []
  );
});

test("checkStructureはタグ名の大文字を区別しない", () => {
  assert.deepEqual(
    checkStructure(`<TITLE>a</TITLE><H1>a</H1><IMG SRC="a" ALT="">`),
    []
  );
});

test("checkStructureはSVGのtitleを数えず、styleの中のタグも数えない", () => {
  const svg = `<title>a</title><h1>a</h1><svg><title>icon</title></svg>`;
  assert.deepEqual(checkStructure(svg), []);
  assert.deepEqual(
    checkStructure(
      `<title>a</title><h1>a</h1><style>x::after{content:"<img src=1>"}</style>`
    ),
    []
  );
});

test("checkLangはenとjaだけ通す", () => {
  assert.deepEqual(checkLang(`<html lang="ja">`), []);
  assert.deepEqual(checkLang(`<html lang="fr">`), [
    "<html lang>がenかjaではありません(fr)",
  ]);
  assert.deepEqual(checkLang(`<html>`), [
    "<html lang>がenかjaではありません(未指定)",
  ]);
});

test("checkNoScriptはscriptの有無を見る", () => {
  assert.deepEqual(checkNoScript(ok), []);
  assert.deepEqual(
    checkNoScript(`<body><SCRIPT type="module" src="/a.js"></SCRIPT></body>`),
    ["islandsが空のページに<script>があります"]
  );
  assert.deepEqual(checkNoScript(`<!-- <script></script> -->`), []);
});
