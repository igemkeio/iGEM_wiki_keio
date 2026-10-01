import assert from "node:assert/strict";
import { test } from "node:test";
import { buildPage, normalizeSlug, serializePage } from "./page.mjs";

test("slugを小文字英数字とハイフンに正規化する", () => {
  assert.equal(normalizeSlug("Model"), "model");
  assert.equal(normalizeSlug(" Human Practices "), "human-practices");
  assert.equal(normalizeSlug("wet_lab"), "wet-lab");
  assert.equal(normalizeSlug("a/b?c"), "abc");
  assert.equal(normalizeSlug("home"), "home");
});

test("任意フィールドは値があるときだけ出し、キーの順はREADMEの表に合わせる", () => {
  const page = buildPage({
    slug: "model",
    locale: "en",
    title: "Model",
    subtitle: "",
    lead: "l",
    html: "",
    order: 0,
  });
  assert.deepEqual(Object.keys(page), ["slug", "locale", "title", "lead", "html", "order"]);
});

test("JSONは2スペースインデントで末尾に改行を付ける", () => {
  assert.equal(serializePage({ a: 1 }), '{\n  "a": 1\n}\n');
});

test("islandsは空でないときだけ出し、orderの後ろに置く", () => {
  const base = { slug: "members", locale: "en", title: "Members", html: "", order: 80 };
  assert.deepEqual(
    Object.keys(buildPage({ ...base, islands: ["member-list"] })),
    ["slug", "locale", "title", "html", "order", "islands"]
  );
  assert.deepEqual(buildPage({ ...base, islands: ["member-list"] }).islands, ["member-list"]);
  assert.equal("islands" in buildPage({ ...base, islands: [] }), false);
  assert.equal("islands" in buildPage(base), false);
});
