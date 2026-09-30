import assert from "node:assert/strict";
import { test } from "node:test";
import { renderMarkdown } from "./markdown.mjs";

test("段落と強調を HTML にする", () => {
  assert.equal(renderMarkdown("**a** b"), "<p><strong>a</strong> b</p>");
});

test("空文字は空文字を返す", () => {
  assert.equal(renderMarkdown(""), "");
});
