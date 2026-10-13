import assert from "node:assert/strict";
import { test } from "node:test";

import {
  attachmentFileName,
  attachmentHref,
  fileNameFromUrl,
  transformAttachment,
} from "./attachment.mjs";
import { renderMarkdown } from "./markdown.mjs";

const SIGNED =
  "https://prod-files-secure.s3.us-west-2.amazonaws.com/aaa/bbb/Earth%20day%20poster.pdf?X-Amz-Credential=ASIAXXXX&X-Amz-Expires=3600";

const fileBlock = (type, url = SIGNED, caption = []) => ({
  id: "blk-1",
  type,
  [type]: { type: "file", file: { url }, caption },
});

test("URLから元のファイル名を取り出す", () => {
  assert.equal(fileNameFromUrl(SIGNED), "Earth day poster.pdf");
  assert.equal(
    fileNameFromUrl("https://h/p/%E3%83%9D%E3%82%B9%E3%82%BF%E3%83%BC.pdf?x=1"),
    "ポスター.pdf"
  );
});

test("保存名は内容ハッシュと元のファイル名で、同じ内容なら同じ名前になる", () => {
  const a = attachmentFileName(Buffer.from("abc"), "poster.pdf");
  assert.match(a, /^[0-9a-f]{16}-poster\.pdf$/u);
  assert.equal(a, attachmentFileName(Buffer.from("abc"), "poster.pdf"));
  assert.notEqual(a, attachmentFileName(Buffer.from("abd"), "poster.pdf"));
});

test("パスに使えない文字は置き換え、長い名前は拡張子を残して切る", () => {
  assert.match(
    attachmentFileName(Buffer.from("a"), "../a b/c?.pdf"),
    /^[0-9a-f]{16}-_a_b_c_\.pdf$/u
  );
  const long = attachmentFileName(Buffer.from("a"), `${"x".repeat(300)}.pdf`);
  assert.ok(long.endsWith(".pdf"));
  assert.ok(long.length <= 16 + 1 + 100);
});

test("配信用パスはファイル名をエンコードする", () => {
  assert.equal(
    attachmentHref("/notion-files", "abc-ポスター.pdf"),
    "/notion-files/abc-%E3%83%9D%E3%82%B9%E3%82%BF%E3%83%BC.pdf"
  );
});

test("file と pdf は保存して配信用パスのリンクにする", async () => {
  for (const type of ["file", "pdf"]) {
    const md = await transformAttachment(
      fileBlock(type),
      () => Promise.resolve("/notion-files/h-poster.pdf"),
      assert.fail
    );
    assert.equal(md, "[Earth day poster.pdf](/notion-files/h-poster.pdf)");
    assert.ok(!renderMarkdown(md).includes("prod-files-secure"));
  }
});

test("キャプションがあればリンクテキストにする", async () => {
  const md = await transformAttachment(
    fileBlock("pdf", SIGNED, [{ plain_text: "ポスター [A3]" }]),
    () => Promise.resolve("/notion-files/h-p.pdf"),
    assert.fail
  );
  assert.equal(md, "[ポスター \\[A3\\]](/notion-files/h-p.pdf)");
});

test("保存に失敗したら署名付きURLを残さずスキップする", async () => {
  const md = await transformAttachment(
    fileBlock("file"),
    () => Promise.resolve(null),
    () => {}
  );
  assert.match(md, /^<!--/u);
  assert.ok(!md.includes("prod-files-secure"));
});

test("外部URLの file は既定の変換に任せる", async () => {
  const block = {
    type: "file",
    file: { type: "external", external: { url: "https://x/y.pdf" } },
  };
  assert.equal(
    await transformAttachment(block, () => Promise.resolve("x"), assert.fail),
    false
  );
});

test("アップロードされた動画は警告して何も出力しない", async () => {
  const warns = [];
  const out = await transformAttachment(
    fileBlock("video", SIGNED.replace(".pdf", ".mp4")),
    () => assert.fail("保存してはいけない"),
    (m) => warns.push(m)
  );
  assert.equal(out, "");
  assert.equal(warns.length, 1);
  assert.ok(warns[0].includes("Earth day poster.mp4"));
  assert.ok(warns[0].includes("blk-1"));
  assert.ok(!warns[0].includes("X-Amz"));
});

test("外部URLの動画は既定の変換に任せる", async () => {
  const block = {
    type: "video",
    video: { type: "external", external: { url: "https://v/1" } },
  };
  assert.equal(
    await transformAttachment(block, () => Promise.resolve("x"), assert.fail),
    false
  );
});

test("ブロックの name があればURLのファイル名より優先する", async () => {
  const block = fileBlock("pdf");
  block.pdf.name = "ポスター最終版.pdf";
  const saved = [];
  const md = await transformAttachment(
    block,
    (_url, name) => {
      saved.push(name);
      return Promise.resolve("/notion-files/h-x.pdf");
    },
    assert.fail
  );
  assert.deepEqual(saved, ["ポスター最終版.pdf"]);
  assert.ok(md.includes("ポスター最終版.pdf"));
});

test("file と pdf でも拡張子が動画なら警告して保存しない", async () => {
  for (const ext of ["mp4", "MOV", "webm", "m4v", "avi", "mkv"]) {
    for (const type of ["file", "pdf"]) {
      const warns = [];
      const out = await transformAttachment(
        fileBlock(type, SIGNED.replace(".pdf", `.${ext}`)),
        () => assert.fail("保存してはいけない"),
        (m) => warns.push(m)
      );
      assert.equal(out, "");
      assert.equal(warns.length, 1);
      assert.ok(warns[0].includes("blk-1"));
      assert.ok(!warns[0].includes("X-Amz"));
    }
  }
});
