import assert from "node:assert/strict";
import { test } from "node:test";

import {
  attachmentFileName,
  attachmentHref,
  fileNameFromUrl,
  transformAttachment,
  videoEmbedUrl,
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
  assert.ok(Buffer.byteLength(long) <= 255);
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
    assert.equal(
      md,
      '<p><a href="/notion-files/h-poster.pdf">Earth day poster.pdf</a></p>'
    );
    assert.ok(!renderMarkdown(md).includes("prod-files-secure"));
  }
});

test("キャプションがあればリンクテキストにする", async () => {
  const md = await transformAttachment(
    fileBlock("pdf", SIGNED, [{ plain_text: "ポスター [A3]" }]),
    () => Promise.resolve("/notion-files/h-p.pdf"),
    assert.fail
  );
  assert.equal(md, '<p><a href="/notion-files/h-p.pdf">ポスター [A3]</a></p>');
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

test("括弧やバッククォートを含む名前はリンクのまま壊れない", async () => {
  const name = "a (1) `b`.pdf";
  const href = attachmentHref("/notion-files", `h-${name}`);
  const md = await transformAttachment(
    fileBlock("file", SIGNED, [{ plain_text: name }]),
    () => Promise.resolve(href),
    assert.fail
  );
  const html = renderMarkdown(md);
  assert.equal(html.match(/<a /gu)?.length, 1);
  assert.ok(html.includes(`>${name}</a>`));
  assert.ok(!html.includes("<code>"));
  assert.ok(html.includes(`href="${href}"`));
});

test("キャプションのHTMLは解釈されずエスケープされる", async () => {
  const md = await transformAttachment(
    fileBlock("file", SIGNED, [{ plain_text: "<img src=x onerror=alert(1)>" }]),
    () => Promise.resolve("/notion-files/h-p.pdf"),
    assert.fail
  );
  const html = renderMarkdown(md);
  assert.ok(!html.includes("<img"));
  assert.ok(html.includes("&lt;img src=x onerror=alert(1)&gt;"));
});

test("日本語の長い名前は多バイト文字の途中で切らず255バイトに収める", () => {
  const name = `${"資料あ".repeat(100)}.pdf`;
  const out = attachmentFileName(Buffer.from("a"), name);
  assert.ok(Buffer.byteLength(out) <= 255);
  assert.ok(out.endsWith(".pdf"));
  assert.ok(!out.includes("\uFFFD"));
  assert.equal(Buffer.from(out).toString("utf-8"), out);
});

test("空行を含むキャプションは1行にしてリンクの入れ子を保つ", async () => {
  const md = await transformAttachment(
    fileBlock("file", SIGNED, [{ plain_text: "段落1\n\n*段落2*" }]),
    () => Promise.resolve("/notion-files/h-p.pdf"),
    assert.fail
  );
  assert.ok(!md.includes("\n"));
  const html = renderMarkdown(md);
  assert.equal(html.match(/<a /gu)?.length, 1);
  assert.equal(html.match(/<p>/gu)?.length, 1);
  assert.ok(html.includes(">段落1 *段落2*</a>"));
});

const extVideo = (url, caption = []) => ({
  id: "blk-2",
  type: "video",
  video: { type: "external", external: { url }, caption },
});
const EMBED = "https://video.igem.org/videos/embed/abc-123";

test("視聴URLの2形式を埋め込みURLにし、embed はそのまま返す", () => {
  assert.equal(videoEmbedUrl("https://video.igem.org/w/abc-123"), EMBED);
  assert.equal(
    videoEmbedUrl("https://video.igem.org/videos/watch/abc-123?start=1"),
    `${EMBED}?start=1`
  );
  assert.equal(videoEmbedUrl(EMBED), EMBED);
  assert.equal(
    videoEmbedUrl("https://video.igem.org/w/abc-123?start=1m"),
    `${EMBED}?start=1m`
  );
  assert.equal(
    videoEmbedUrl("https://video.igem.org/videos/embed/abc-123?start=1m"),
    `${EMBED}?start=1m`
  );
  assert.equal(
    videoEmbedUrl("https://u:p@video.igem.org/w/abc-123#frag"),
    EMBED
  );
  assert.equal(videoEmbedUrl("https://video.igem.org/a/abc"), null);
  assert.equal(videoEmbedUrl("https://example.com/w/abc"), null);
  assert.equal(videoEmbedUrl("https://video.igem.org.evil.com/w/abc"), null);
});

test("video.igem.org の動画はキャプションなしなら iframe だけを出す", () => {
  const out = transformAttachment(
    extVideo("https://video.igem.org/w/abc-123"),
    assert.fail,
    assert.fail
  );
  return out.then((html) => {
    assert.ok(html.startsWith(`<iframe class="video-embed" src="${EMBED}"`));
    assert.ok(html.includes('title="Video"'));
    assert.ok(
      html.includes(
        'sandbox="allow-same-origin allow-scripts allow-popups allow-forms" allow="fullscreen" loading="lazy"'
      )
    );
    assert.ok(!html.includes("<figure"));
    assert.ok(renderMarkdown(html).includes(html));
  });
});

test("キャプションがあれば Figure カードで包み、titleはタグを除いてエスケープする", async () => {
  const html = await transformAttachment(
    extVideo(EMBED, [{ plain_text: 'Fig. 1 <b>"MD"</b> & 動画\n\n説明' }]),
    assert.fail,
    assert.fail
  );
  assert.ok(html.startsWith('<figure class="figure-card">'));
  assert.ok(html.includes('title="Fig. 1 &quot;MD&quot; &amp; 動画 説明"'));
  assert.ok(html.includes('<p class="figure-card__label">Fig. 1</p>'));
  assert.ok(!html.includes("<b>"));
  assert.ok(!html.includes("\n\n"));
  const rendered = renderMarkdown(html);
  assert.equal(rendered.match(/<iframe /gu)?.length, 1);
  assert.equal(rendered.match(/<figure /gu)?.length, 1);
});

test("video.igem.org 以外の外部動画はリンクのまま(既定の変換)", async () => {
  const out = await transformAttachment(
    extVideo("https://www.youtube.com/watch?v=x"),
    assert.fail,
    assert.fail
  );
  assert.equal(out, false);
});

test("変換できない video.igem.org のURLは警告してリンクのまま", async () => {
  const warns = [];
  const out = await transformAttachment(
    extVideo("https://video.igem.org/c/channel"),
    assert.fail,
    (m) => warns.push(m)
  );
  assert.equal(out, false);
  assert.equal(warns.length, 1);
  assert.ok(warns[0].includes("blk-2"));
});
