import assert from "node:assert/strict";
import { test } from "node:test";
import { addHeadingIds, renderMarkdown, slugifyHeading } from "./markdown.mjs";

test("段落と強調を HTML にする", () => {
  assert.equal(renderMarkdown("**a** b"), "<p><strong>a</strong> b</p>");
});

test("空文字は空文字を返す", () => {
  assert.equal(renderMarkdown(""), "");
});

test("h2とh3にidが付き、h1とh4には付かない", () => {
  const html = renderMarkdown("# A\n\n## B c\n\n### D\n\n#### E");
  assert.equal(
    html,
    '<h1>A</h1>\n<h2 id="b-c">B c</h2>\n<h3 id="d">D</h3>\n<h4>E</h4>'
  );
});

test("idは小文字化し、句読点と記号を除き、日本語を残す", () => {
  assert.equal(slugifyHeading("Hello, World!"), "hello-world");
  assert.equal(slugifyHeading("結果と考察（概要）"), "結果と考察概要");
  assert.equal(slugifyHeading("Real-time  model"), "real-time-model");
  assert.equal(slugifyHeading("a+b=c"), "abc");
});

test("重複するidに-2、-3を付ける", () => {
  const html = renderMarkdown("## Aim\n\n## Aim\n\n## Aim");
  assert.match(html, /id="aim"/);
  assert.match(html, /id="aim-2"/);
  assert.match(html, /id="aim-3"/);
});

test("見出し内のインライン要素はidに含めず、文字だけを使う", () => {
  assert.match(renderMarkdown("## **Bold** `code`"), /id="bold-code"/);
});

test("属性付きのh3(Figureカードの見出し)にはidを付けない", () => {
  const html = addHeadingIds('<h3 class="figure-card__title">x</h3>');
  assert.equal(html, '<h3 class="figure-card__title">x</h3>');
});
