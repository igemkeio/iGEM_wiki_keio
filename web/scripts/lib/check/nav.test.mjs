import assert from "node:assert/strict";
import { test } from "node:test";

import { findUnmappedPages } from "./nav.mjs";
import { toPage } from "./pages.mjs";

const config = {
  fallback: "project",
  categories: [
    { id: "project", label: "Project", slugs: ["description"] },
    { id: "team", label: "Team", slugs: ["members"] },
  ],
};

test("対応表にあるページとhomeは警告しない", () => {
  const pages = [
    toPage("en", "home.json", {}),
    toPage("en", "description.json", {}),
    toPage("ja", "members.json", {}),
  ];
  assert.deepEqual(findUnmappedPages(pages, config), []);
});

test("対応表にない公開ページは、ファイルごとに警告する", () => {
  const pages = [
    toPage("en", "description.json", {}),
    toPage("en", "stray.json", {}),
    toPage("ja", "stray.json", {}),
  ];
  const warnings = findUnmappedPages(pages, config);
  assert.deepEqual(
    warnings.map((w) => w.file),
    ["content/en/stray.json", "content/ja/stray.json"]
  );
  assert.match(warnings[0].reason, /Projectの末尾/u);
});

test("未公開のページは警告しない", () => {
  const pages = [toPage("en", "stray.json", { published: false })].filter(
    Boolean
  );
  assert.deepEqual(findUnmappedPages(pages, config), []);
});
