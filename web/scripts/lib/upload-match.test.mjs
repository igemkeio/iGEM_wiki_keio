import assert from "node:assert/strict";
import { test } from "node:test";

import { matchUploadedNames } from "./upload-match.mjs";

test("完全一致を引く", () => {
  const { matched, unmatched } = matchUploadedNames(["a.webp"], [], ["a.webp"]);
  assert.deepEqual([...matched], [["a.webp", "a.webp"]]);
  assert.deepEqual(unmatched, []);
});

test("拡張子だけ違う名前を引く", () => {
  const { matched } = matchUploadedNames(
    ["one-direction.png"],
    ["other.webp"],
    ["other.webp", "one-direction.avif"]
  );
  assert.equal(matched.get("one-direction.png"), "one-direction.avif");
});

test("日本語が切り詰められて小文字になった名前を引く", () => {
  const names = [
    "469b738a2243cf3e-AIを用いて疾患の原因を予測しよう.pdf",
    "a53359b8387a686b-ポスター展示.pdf",
  ];
  const { matched, unmatched } = matchUploadedNames(
    names,
    [],
    ["469b738a2243cf3e-ai.pdf", "a53359b8387a686b.pdf"]
  );
  assert.equal(matched.get(names[0]), "469b738a2243cf3e-ai.pdf");
  assert.equal(matched.get(names[1]), "a53359b8387a686b.pdf");
  assert.deepEqual(unmatched, []);
});

test("以前からある名前は候補にしない", () => {
  const { matched, unmatched } = matchUploadedNames(
    ["one-direction.png"],
    ["one-direction.avif"],
    ["one-direction.avif"]
  );
  assert.equal(matched.size, 0);
  assert.deepEqual(unmatched, ["one-direction.png"]);
});

test("候補が2つ以上なら失敗として返す", () => {
  const { matched, unmatched } = matchUploadedNames(
    ["abc-あ.pdf"],
    [],
    ["abc-1.pdf", "abc-2.pdf"]
  );
  assert.equal(matched.size, 0);
  assert.deepEqual(unmatched, ["abc-あ.pdf"]);
});

test("2つのファイルが同じ候補を指すときは両方とも失敗にする", () => {
  const { matched, unmatched } = matchUploadedNames(
    ["a.png", "a.jpg"],
    [],
    ["a.avif"]
  );
  assert.equal(matched.size, 0);
  assert.deepEqual(unmatched, ["a.png", "a.jpg"]);
});

test("別のファイルの完全一致に使われた名前は引き当てない", () => {
  const { matched, unmatched } = matchUploadedNames(
    ["a.png", "a.avif"],
    [],
    ["a.avif"]
  );
  assert.equal(matched.get("a.avif"), "a.avif");
  assert.deepEqual(unmatched, ["a.png"]);
});

test("ASCIIの先頭が無い名前は前方一致を使わない", () => {
  const { unmatched } = matchUploadedNames(["あい.pdf"], [], ["x.pdf"]);
  assert.deepEqual(unmatched, ["あい.pdf"]);
});
