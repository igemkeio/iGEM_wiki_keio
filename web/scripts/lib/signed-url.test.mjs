import assert from "node:assert/strict";
import { test } from "node:test";

import {
  appendStepSummary,
  hasSignedUrl,
  signedUrlSummary,
} from "./signed-url.mjs";

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

test("Step Summary のパスと内容があれば追記する", () => {
  const calls = [];
  appendStepSummary(
    "/tmp/summary.md",
    "md",
    (file, text) => calls.push([file, text]),
    assert.fail
  );
  assert.deepEqual(calls, [["/tmp/summary.md", "md"]]);
});

const noAppend = () => assert.fail("書いてはいけない");

test("パスが無い、または内容が空なら書かない", () => {
  appendStepSummary(undefined, "md", noAppend, assert.fail);
  appendStepSummary("", "md", noAppend, assert.fail);
  appendStepSummary("/tmp/summary.md", "", noAppend, assert.fail);
});

test("書き込みの例外は警告にして投げない", () => {
  const warns = [];
  appendStepSummary(
    "/tmp/summary.md",
    "md",
    () => {
      throw new Error("EACCES");
    },
    (m) => warns.push(m)
  );
  assert.equal(warns.length, 1);
  assert.ok(warns[0].includes("EACCES"));
});
