import assert from "node:assert/strict";
import { test } from "node:test";

import { renderMath } from "./katex.mjs";
import { renderMarkdown } from "./markdown.mjs";

test("renderMathはKaTeXのHTMLを返す", () => {
  assert.match(renderMath("x^2", false), /class="katex"/u);
  assert.match(renderMath("x^2", true), /class="katex-display"/u);
});

test("不正な式でも例外を投げない", () => {
  assert.match(renderMath("\\unknowncommand{", false), /katex-error/u);
});

test("ブロック数式をKaTeXのHTMLにする", () => {
  const html = renderMarkdown("前\n\n$$\nE = mc^2\n$$\n\n後");
  assert.match(html, /<span class="katex-display">/u);
  assert.match(html, /<p>前<\/p>/u);
  assert.match(html, /<p>後<\/p>/u);
});

test("インライン数式をKaTeXのHTMLにする", () => {
  const html = renderMarkdown("値は $a_1 + b_2$ である。");
  assert.match(html, /<span class="katex">/u);
  assert.doesNotMatch(html, /<em>/u);
});

test("数式の中のアスタリスクやアンダースコアを強調にしない", () => {
  const html = renderMarkdown("$$\na_1 * b_2 * c\n$$");
  assert.doesNotMatch(html, /<em>|<strong>/u);
});

test("金額のドルは数式にしない", () => {
  const html = renderMarkdown("費用は $5 から $10 まで。");
  assert.equal(html, "<p>費用は $5 から $10 まで。</p>");
});

test("コードスパンの中は数式にしない", () => {
  assert.equal(renderMarkdown("`$x$`"), "<p><code>$x$</code></p>");
});
