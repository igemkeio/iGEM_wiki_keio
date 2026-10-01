import assert from "node:assert/strict";
import { test } from "node:test";
import {
  addHeadingIds,
  renderMarkdown,
  renderNote,
  richTextToMarkdown,
  slugifyHeading,
} from "./markdown.mjs";

test("段落と強調を HTML にする", () => {
  assert.equal(renderMarkdown("**a** b"), "<p><strong>a</strong> b</p>");
});

test("空文字は空文字を返す", () => {
  assert.equal(renderMarkdown(""), "");
});

test("h2とh3にidが付き、h4には付かない", () => {
  const html = renderMarkdown("## B c\n\n### D\n\n#### E");
  assert.equal(html, '<h2 id="b-c">B c</h2>\n<h3 id="d">D</h3>\n<h4>E</h4>');
});

test("本文のh1はh2として出し、idを付ける", () => {
  const html = renderMarkdown("# A\n\n## B\n\n### C");
  assert.equal(html, '<h2 id="a">A</h2>\n<h2 id="b">B</h2>\n<h3 id="c">C</h3>');
  assert.equal(renderMarkdown("# A **b**"), '<h2 id="a-b">A <strong>b</strong></h2>');
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

test("calloutをNoteのHTMLにする", () => {
  assert.equal(
    renderNote("本文 **強調**\n\n2段落目"),
    '<aside class="note">\n<p class="note__label">Note</p>\n<p>本文 <strong>強調</strong></p>\n<p>2段落目</p>\n</aside>'
  );
});

test("Noteは外側のMarkdown変換でも形が崩れない", () => {
  const note = renderNote("a\n\nb");
  assert.equal(renderMarkdown(`前\n\n${note}\n\n後`), `<p>前</p>\n${note}<p>後</p>`);
});

test("rich_textをMarkdownにする", () => {
  const plain = { bold: false, italic: false, strikethrough: false, code: false };
  assert.equal(
    richTextToMarkdown([
      { type: "text", plain_text: "a", annotations: { ...plain, bold: true } },
      { type: "text", plain_text: "b", annotations: plain, href: "https://x" },
      { type: "equation", plain_text: "x^2", equation: { expression: "x^2" } },
    ]),
    "**a**[b](https://x)$x^2$"
  );
});

test("見出しのidが既存のid(Aim 2)と衝突しない", () => {
  const html = renderMarkdown("## Aim\n\n## Aim\n\n## Aim 2");
  const ids = [...html.matchAll(/id="([^"]*)"/g)].map((x) => x[1]);
  assert.equal(new Set(ids).size, 3);
  assert.deepEqual(ids, ["aim", "aim-2", "aim-2-2"]);
});

test("見出しの数式はMathMLを除いた描画テキストだけをidにする", () => {
  assert.match(renderMarkdown("## $x$ gain"), /<h2 id="x-gain">/);
});

test("Noteの中の pre の空行は保たれる", () => {
  const html = renderMarkdown(`前\n\n${renderNote("```\na\n\nb\n```")}\n\n後`);
  assert.match(html, /<pre><code>a\n\nb\n<\/code><\/pre>/);
  assert.doesNotMatch(html, /blank/);
  assert.match(html, /<\/aside><p>後<\/p>/);
});

test("Noteの中の pre の空白だけの行も保たれる", () => {
  const html = renderMarkdown(renderNote("```\na\n  \nb\n```"));
  assert.match(html, /<pre><code>a\n  \nb\n<\/code><\/pre>/);
  assert.doesNotMatch(html, /blank/);
});
