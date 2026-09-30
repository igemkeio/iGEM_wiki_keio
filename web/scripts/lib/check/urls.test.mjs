import assert from "node:assert/strict";
import { test } from "node:test";
import { checkExternalUrl, checkInternalLink, externalHost, isAllowedHost, isInternalPath, stripBase } from "./urls.mjs";

test("isAllowedHostは許可ホストとそのサブドメインを通す", () => {
  for (const host of ["static.igem.wiki", "video.igem.org", "2026.igem.wiki", "competition.igem.org", "igem.org", "STATIC.IGEM.WIKI", "static.igem.wiki."]) {
    assert.equal(isAllowedHost(host), true, host);
  }
  for (const host of ["example.com", "evil-igem.org", "igem.org.evil.test", "notigem.wiki"]) {
    assert.equal(isAllowedHost(host), false, host);
  }
});

test("externalHostはブラウザと同じ規則でホストを返す", () => {
  assert.equal(externalHost("https://user@static.igem.wiki:443/a.png"), "static.igem.wiki");
  assert.equal(externalHost("//example.com/a"), "example.com");
  assert.equal(externalHost("HTTP://EXAMPLE.com/a"), "example.com");
  assert.equal(externalHost("https://static.igem.wiki./a"), "static.igem.wiki");
  assert.equal(externalHost("https:/\\evil.com/"), "evil.com");
  assert.equal(externalHost("https:\\\\evil.com/"), "evil.com");
  assert.equal(externalHost("/\\evil.com/"), "evil.com");
});

test("externalHostはサイト内のパスと外部ホストのないスキームにnullを返す", () => {
  for (const v of ["/a", "a.png", "https:evil.com/x", "mailto:a@example.com", "data:image/png;base64,AAA", "javascript:void(0)", "", "http://"]) {
    assert.equal(externalHost(v), null, v);
  }
});

test("checkExternalUrlは許可外だけを返す", () => {
  assert.deepEqual(checkExternalUrl("https://static.igem.wiki/a.png"), []);
  assert.deepEqual(checkExternalUrl("HTTPS://STATIC.IGEM.WIKI/a.png"), []);
  assert.deepEqual(checkExternalUrl("/a.png"), []);
  assert.deepEqual(checkExternalUrl("https://example.com/x.png"), ["許可されていない外部URLです: https://example.com/x.png"]);
  assert.equal(checkExternalUrl("//example.com/x.png").length, 1);
  assert.equal(checkExternalUrl("https:/\\evil.com/").length, 1);
  assert.equal(checkExternalUrl("HTTP://example.com/").length, 1);
  assert.equal(checkExternalUrl("https://evil.com./").length, 1);
});

test("isInternalPathは//と/\\で始まるものを含めない", () => {
  assert.equal(isInternalPath("/a"), true);
  assert.equal(isInternalPath("//a"), false);
  assert.equal(isInternalPath("/\\a"), false);
  assert.equal(isInternalPath("a"), false);
});

test("stripBaseはbaseを除き、外ならnull", () => {
  assert.equal(stripBase("/ja/", "/"), "ja/");
  assert.equal(stripBase("/keio/ja/", "/keio/"), "ja/");
  assert.equal(stripBase("/keio/", "/keio/"), "");
  assert.equal(stripBase("/ja/", "/keio/"), null);
});

test("stripBaseはbaseの書き方の違いを揃える", () => {
  assert.equal(stripBase("/keio/ja/", "/keio"), "ja/");
  assert.equal(stripBase("/keio/ja/", "keio"), "ja/");
  assert.equal(stripBase("/ja/", ""), "ja/");
});

const files = new Set(["index.html", "ja/index.html", "assets/a.js", "people/x.png", "people/日本.png"]);

test("checkInternalLinkは存在するファイルとディレクトリを通す", () => {
  assert.deepEqual(checkInternalLink("/", "/", files), []);
  assert.deepEqual(checkInternalLink("/ja/", "/", files), []);
  assert.deepEqual(checkInternalLink("/ja", "/", files), []);
  assert.deepEqual(checkInternalLink("/assets/a.js?v=1#x", "/", files), []);
  assert.deepEqual(checkInternalLink("/keio/people/x.png", "/keio/", files), []);
  assert.deepEqual(checkInternalLink("/people/%E6%97%A5%E6%9C%AC.png", "/", files), []);
});

test("checkInternalLinkは違反の理由を文言まで返す", () => {
  assert.deepEqual(checkInternalLink("/nope/", "/", files), ["リンク先がdistに存在しません: /nope/"]);
  assert.deepEqual(checkInternalLink("/ja/", "/keio/", files), ["baseの外を指すリンクです(base: /keio/): /ja/"]);
  assert.deepEqual(checkInternalLink("/%E0%A4%A", "/", files), ["パスをURLデコードできません: /%E0%A4%A"]);
  assert.deepEqual(checkInternalLink("/../etc/passwd", "/", files), ["distの外を指すリンクです: /../etc/passwd"]);
  assert.deepEqual(checkInternalLink("/..", "/", files), ["distの外を指すリンクです: /.."]);
});

test("checkInternalLinkは内部パス以外を見ない", () => {
  for (const v of ["#top", "mailto:a@example.com", "https://example.com", "//example.com", "relative.html", ""]) {
    assert.deepEqual(checkInternalLink(v, "/", files), [], v);
  }
});
