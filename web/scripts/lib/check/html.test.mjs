import assert from "node:assert/strict";
import { test } from "node:test";
import { checkLang, checkNoScript, checkStructure, extractRefs, isExternalCheckTarget, parseTags } from "./html.mjs";

const ok = `<!doctype html><html lang="en"><head><title>T</title></head><body><h1>H</h1><img src="/a.png" alt=""></body></html>`;

test("parseTags は属性を3種類の引用形式で読む", () => {
  const [tag] = parseTags(`<img src="a" alt='b' data-x=c hidden>`);
  assert.equal(tag.name, "img");
  assert.deepEqual([...tag.attrs], [["src", "a"], ["alt", "b"], ["data-x", "c"], ["hidden", ""]]);
});

test("parseTags は属性値の中の > とコメント、script の中身を無視する", () => {
  const tags = parseTags(`<a title="a>b" href="/x">x</a><!-- <img src="http://bad"> --><script>var s = "<img src=1>"</script>`);
  assert.deepEqual(tags.map((t) => t.name), ["a", "script"]);
});

test("extractRefs は src と href を返し、&amp; を戻す", () => {
  const refs = extractRefs(`<a href="/x?a=1&amp;b=2">x</a><img src="/y.png">`);
  assert.deepEqual(refs, [
    { tag: "a", attr: "href", value: "/x?a=1&b=2" },
    { tag: "img", attr: "src", value: "/y.png" },
  ]);
});

test("外部URLの検査対象に a は含まれない", () => {
  assert.equal(isExternalCheckTarget({ tag: "a" }), false);
  for (const tag of ["link", "script", "img", "source", "video", "iframe"]) {
    assert.equal(isExternalCheckTarget({ tag }), true);
  }
});

test("checkStructure は正しいページで違反なし", () => {
  assert.deepEqual(checkStructure(ok), []);
});

test("checkStructure は title と h1 の欠落、重複、alt の欠落を返す", () => {
  assert.equal(checkStructure(`<html><body><img src="a"></body></html>`).length, 3);
  assert.equal(checkStructure(`<title>a</title><title>b</title><h1>a</h1><h1>b</h1>`).length, 2);
});

test("checkStructure は h10 などを h1 と数えない", () => {
  assert.deepEqual(checkStructure(`<title>a</title><h1>a</h1><header></header>`), []);
});

test("checkLang は en と ja だけ通す", () => {
  assert.deepEqual(checkLang(`<html lang="ja">`), []);
  assert.equal(checkLang(`<html lang="fr">`).length, 1);
  assert.equal(checkLang(`<html>`).length, 1);
});

test("checkNoScript は script の有無を見る", () => {
  assert.deepEqual(checkNoScript(ok), []);
  assert.equal(checkNoScript(`<body><script type="module" src="/a.js"></script></body>`).length, 1);
  assert.deepEqual(checkNoScript(`<!-- <script></script> -->`), []);
});
