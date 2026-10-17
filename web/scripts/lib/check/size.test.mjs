import assert from "node:assert/strict";
import { test } from "node:test";

import {
  checkTotalSize,
  findOversizedFiles,
  shouldCheckSize,
  SIZE_LIMIT_BYTES,
  UPLOAD_LIMIT_BYTES,
} from "./size.mjs";

const MB = 1024 * 1024;

test("合計が上限ちょうどなら違反にしない", () => {
  assert.deepEqual(checkTotalSize([{ path: "a", size: SIZE_LIMIT_BYTES }]), []);
});

test("5MBを超えたら違反にする", () => {
  const out = checkTotalSize([
    { path: "assets/a.js", size: 3 * MB },
    { path: "index.html", size: 2 * MB + 1 },
  ]);
  assert.equal(out.length, 1);
  assert.match(out[0], /上限5\.00MBを超えています/u);
});

test("内訳は大きい順の上位10件だけを出す", () => {
  const files = Array.from({ length: 15 }, (_, i) => ({
    path: `f${i}`,
    size: (i + 1) * 0.5 * MB,
  }));
  const [message] = checkTotalSize(files);
  const lines = message.split("\n").slice(1);
  assert.equal(lines.length, 10);
  assert.match(lines[0], /f14$/u);
  assert.doesNotMatch(message, /f4$/mu);
});

test("WIKI_CHECK_SIZE=1のときだけ容量を見る", () => {
  assert.equal(shouldCheckSize({}), false);
  assert.equal(shouldCheckSize({ WIKI_CHECK_SIZE: "0" }), false);
  assert.equal(shouldCheckSize({ WIKI_CHECK_SIZE: "1" }), true);
});

test("配信元の環境変数は容量を見るかどうかに関係しない", () => {
  assert.equal(
    shouldCheckSize({
      WIKI_NOTION_BASE: "https://x",
      WIKI_FONT_BASE: "https://x",
      WIKI_IMAGE_BASE: "https://x",
    }),
    false
  );
});

test("PRERENDER_ALL=1のdistは見ない", () => {
  assert.equal(
    shouldCheckSize({ WIKI_CHECK_SIZE: "1", PRERENDER_ALL: "1" }),
    false
  );
});

test("findOversizedFilesは10MiBちょうどを通し、超えたものを大きい順に返す", () => {
  const out = findOversizedFiles([
    { path: "notion-files/ok.pdf", size: UPLOAD_LIMIT_BYTES },
    { path: "notion-files/a.pdf", size: 11 * MB },
    { path: "notion-files/b.pdf", size: 27 * MB },
  ]);
  assert.equal(out.length, 2);
  assert.match(out[0], /^notion-files\/b\.pdf.*上限10\.00MB/u);
  assert.match(out[1], /^notion-files\/a\.pdf/u);
});
