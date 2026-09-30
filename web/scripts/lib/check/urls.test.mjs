import assert from "node:assert/strict";
import { test } from "node:test";
import { checkExternalUrl, checkInternalLink, externalHost, isAllowedHost, stripBase } from "./urls.mjs";

test("isAllowedHost は許可ホストとそのサブドメインを通す", () => {
  for (const host of ["static.igem.wiki", "video.igem.org", "2026.igem.wiki", "competition.igem.org", "igem.org"]) {
    assert.equal(isAllowedHost(host), true, host);
  }
  for (const host of ["example.com", "evil-igem.org", "igem.org.evil.test", "notigem.wiki"]) {
    assert.equal(isAllowedHost(host), false, host);
  }
});

test("externalHost はポートとユーザー情報を除く", () => {
  assert.equal(externalHost("https://user@static.igem.wiki:443/a.png"), "static.igem.wiki");
  assert.equal(externalHost("//example.com/a"), "example.com");
  assert.equal(externalHost("/a"), null);
  assert.equal(externalHost("mailto:a@example.com"), null);
});

test("checkExternalUrl は許可外だけを返す", () => {
  assert.deepEqual(checkExternalUrl("https://static.igem.wiki/a.png"), []);
  assert.deepEqual(checkExternalUrl("/a.png"), []);
  assert.equal(checkExternalUrl("https://example.com/x.png").length, 1);
  assert.equal(checkExternalUrl("//example.com/x.png").length, 1);
});

test("stripBase は base を除き、外なら null", () => {
  assert.equal(stripBase("/ja/", "/"), "ja/");
  assert.equal(stripBase("/keio/ja/", "/keio/"), "ja/");
  assert.equal(stripBase("/keio/", "/keio/"), "");
  assert.equal(stripBase("/ja/", "/keio/"), null);
});

const files = new Set(["index.html", "ja/index.html", "assets/a.js", "people/x.png"]);

test("checkInternalLink は存在するファイルとディレクトリを通す", () => {
  assert.deepEqual(checkInternalLink("/", "/", files), []);
  assert.deepEqual(checkInternalLink("/ja/", "/", files), []);
  assert.deepEqual(checkInternalLink("/ja", "/", files), []);
  assert.deepEqual(checkInternalLink("/assets/a.js?v=1#x", "/", files), []);
  assert.deepEqual(checkInternalLink("/keio/people/x.png", "/keio/", files), []);
});

test("checkInternalLink は存在しないリンクと base 外を返す", () => {
  assert.equal(checkInternalLink("/nope/", "/", files).length, 1);
  assert.equal(checkInternalLink("/missing.png", "/", files).length, 1);
  assert.equal(checkInternalLink("/ja/", "/keio/", files).length, 1);
  assert.equal(checkInternalLink("/../etc/passwd", "/", files).length, 1);
});

test("checkInternalLink は内部パス以外を見ない", () => {
  for (const v of ["#top", "mailto:a@example.com", "https://example.com", "//example.com", "relative.html", ""]) {
    assert.deepEqual(checkInternalLink(v, "/", files), [], v);
  }
});
