import assert from "node:assert/strict";
import { test } from "node:test";

import { hasSignedUrl, signedUrlSummary } from "./signed-url.mjs";

test("prod-files-secure を含む文字列を検出する", () => {
  assert.equal(
    hasSignedUrl('<a href="https://prod-files-secure.s3.amazonaws.com/x">'),
    true
  );
});

test("含まない文字列は検出しない", () => {
  assert.equal(hasSignedUrl('<a href="/notion-files/h-x.pdf">x</a>'), false);
});

test("Step Summary は残ったページを一覧にする", () => {
  assert.equal(
    signedUrlSummary(["ja/education.json", "en/model-1.json"]),
    [
      "## 署名付きURLが残ったページ",
      "Notionの署名付きURL(prod-files-secure)が残っているページ: 2 件",
      "",
      "```",
      "ja/education.json",
      "en/model-1.json",
      "```",
      "",
    ].join("\n")
  );
});

test("残ったページが無ければ Step Summary は空", () => {
  assert.equal(signedUrlSummary([]), "");
});
