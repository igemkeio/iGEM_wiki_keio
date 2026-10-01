import assert from "node:assert/strict";
import { test } from "node:test";
import { staleJsonFiles } from "./stale.mjs";

const reader = (files) => (file) => {
  const value = files[file];
  if (value === undefined) throw new Error("broken");
  return value;
};

test("同期対象に無い notion のJSONは消す", () => {
  const read = reader({ "en/old.json": { slug: "old" }, "en/explicit.json": { source: "notion" } });
  const result = staleJsonFiles(["en/old.json", "en/explicit.json"], new Set(), read);
  assert.deepEqual(result, { stale: ["en/old.json", "en/explicit.json"], unreadable: [] });
});

test("sourceがlocalのJSONは消さない", () => {
  const read = reader({ "en/prose-sample.json": { source: "local" } });
  const result = staleJsonFiles(["en/prose-sample.json"], new Set(), read);
  assert.deepEqual(result, { stale: [], unreadable: [] });
});

test("同期で書いたJSONは読まずに残す", () => {
  const result = staleJsonFiles(["en/model.json"], new Set(["en/model.json"]), () => {
    throw new Error("読まれてはいけない");
  });
  assert.deepEqual(result, { stale: [], unreadable: [] });
});

test("壊れたJSONは消さずにunreadableへ返す", () => {
  const result = staleJsonFiles(["en/broken.json"], new Set(), reader({}));
  assert.deepEqual(result, { stale: [], unreadable: ["en/broken.json"] });
});

test(".json以外は対象にしない", () => {
  const result = staleJsonFiles(["en/README.md"], new Set(), reader({}));
  assert.deepEqual(result, { stale: [], unreadable: [] });
});
