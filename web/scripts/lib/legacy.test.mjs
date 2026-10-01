import assert from "node:assert/strict";
import { test } from "node:test";
import { buildLegacyFile } from "./legacy.mjs";

test("leadが無いページでもundefinedを書き出さない", () => {
  const file = buildLegacyFile({ title: "T", html: "<p>x</p>" });
  assert.doesNotMatch(file, /undefined/);
  assert.match(file, /\{% block lead %\}\{% endblock %\}/);
  assert.match(file, /\{% block title %\}T\{% endblock %\}/);
});
