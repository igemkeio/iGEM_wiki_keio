import assert from "node:assert/strict";
import { test } from "node:test";

import { extractCssUrls } from "./css.mjs";

test("extractCssUrlsは引用符の有無に関わらずurlを返す", () => {
  const css = `a{background:url(/a.png)}b{background:url( "https://x.test/b.png" )}c{background:url('c.png')}`;
  assert.deepEqual(extractCssUrls(css), [
    "/a.png",
    "https://x.test/b.png",
    "c.png",
  ]);
});

test("extractCssUrlsはコメント内のurlを無視する", () => {
  assert.deepEqual(extractCssUrls(`/* url(http://bad.test/a.png) */a{}`), []);
});

test("extractCssUrlsはurl()を使わない@importの文字列を返す", () => {
  assert.deepEqual(
    extractCssUrls(
      `@import"https://x.test/a.css";@import 'https://y.test/b.css';`
    ),
    ["https://x.test/a.css", "https://y.test/b.css"]
  );
  assert.deepEqual(extractCssUrls(`@import url(https://x.test/a.css);`), [
    "https://x.test/a.css",
  ]);
});
