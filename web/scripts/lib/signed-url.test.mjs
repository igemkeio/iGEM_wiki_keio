import assert from "node:assert/strict";
import { test } from "node:test";

import { hasSignedUrl } from "./signed-url.mjs";

test("prod-files-secure を含む文字列を検出する", () => {
  assert.equal(
    hasSignedUrl('<a href="https://prod-files-secure.s3.amazonaws.com/x">'),
    true
  );
});

test("含まない文字列は検出しない", () => {
  assert.equal(hasSignedUrl('<a href="/notion-files/h-x.pdf">x</a>'), false);
});
