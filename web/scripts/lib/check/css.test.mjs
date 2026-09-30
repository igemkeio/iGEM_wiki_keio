import assert from "node:assert/strict";
import { test } from "node:test";
import { extractCssUrls } from "./css.mjs";

test("extractCssUrls は引用符の有無に関わらず url を返す", () => {
  const css = `a{background:url(/a.png)}b{background:url( "https://x.test/b.png" )}c{background:url('c.png')}`;
  assert.deepEqual(extractCssUrls(css), ["/a.png", "https://x.test/b.png", "c.png"]);
});

test("extractCssUrls はコメント内の url を無視する", () => {
  assert.deepEqual(extractCssUrls(`/* url(http://bad.test/a.png) */a{}`), []);
});
