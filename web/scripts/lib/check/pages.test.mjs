import assert from "node:assert/strict";
import { test } from "node:test";

import { comparePages, pagePath, toPage } from "./pages.mjs";

test("pagePathはroutes.tsと同じ規則でindex.htmlのパスを返す", () => {
  assert.equal(pagePath({ locale: "en", slug: "home" }), "index.html");
  assert.equal(pagePath({ locale: "ja", slug: "home" }), "ja/index.html");
  assert.equal(pagePath({ locale: "en", slug: "model" }), "model/index.html");
  assert.equal(
    pagePath({ locale: "ja", slug: "model" }),
    "ja/model/index.html"
  );
});

test("toPageはpublishedがfalseならnullを返す", () => {
  assert.equal(toPage("en", "a.json", { published: false }), null);
});

test("toPageはJSONのslugとlocaleを優先し、なければファイル名とディレクトリ名を使う", () => {
  assert.deepEqual(
    toPage("en", "model.json", { slug: "model", locale: "en", islands: ["x"] }),
    {
      file: "content/en/model.json",
      dist: "model/index.html",
      islands: ["x"],
    }
  );
  assert.deepEqual(toPage("ja", "team.json", {}), {
    file: "content/ja/team.json",
    dist: "ja/team/index.html",
    islands: [],
  });
});

test("comparePagesは一致すれば空", () => {
  const pages = [toPage("en", "home.json", { slug: "home" })];
  assert.deepEqual(comparePages(pages, ["index.html"]), []);
});

test("comparePagesは対応のないindex.htmlとindex.htmlのないcontentを返す", () => {
  const pages = [
    toPage("en", "home.json", { slug: "home" }),
    toPage("en", "model.json", { slug: "model" }),
  ];
  assert.deepEqual(comparePages(pages, ["index.html", "stray/index.html"]), [
    {
      file: "dist/stray/index.html",
      reason: "対応するcontent/のページがありません",
    },
    {
      file: "content/en/model.json",
      reason: "対応するdist/model/index.htmlがありません",
    },
  ]);
});
