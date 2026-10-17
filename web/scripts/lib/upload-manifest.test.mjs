import assert from "node:assert/strict";
import { test } from "node:test";

import {
  parseManifest,
  resolveManifestPath,
  rewriteText,
} from "./upload-manifest.mjs";

const manifest = parseManifest({
  "images/one-direction.png": {
    url: "https://static.igem.wiki/teams/1/wiki/images/one-direction.avif",
  },
  "images/sponsors/a.svg": {
    url: "https://static.igem.wiki/teams/1/wiki/images/sponsors/a.svg",
  },
  "fonts/m.woff2": {
    url: "https://static.igem.wiki/teams/1/wiki/fonts/m.woff2",
  },
  "notion-files/469b-AIを用いて.pdf": {
    url: "https://static.igem.wiki/teams/1/wiki/notion-files/469b-ai.pdf",
  },
  "notion-images/x.webp": {
    url: "https://static.igem.wiki/teams/1/wiki/notion-images/x.webp",
  },
});

test("resolveManifestPathは未指定なら既定のパスの有無で決める", () => {
  assert.equal(
    resolveManifestPath({}, "/d.json", () => true),
    "/d.json"
  );
  assert.equal(
    resolveManifestPath({}, "/d.json", () => false),
    null
  );
});

test("resolveManifestPathは空文字で無効にし、パス指定はそのまま返す", () => {
  const env = { WIKI_UPLOAD_MANIFEST: "" };
  assert.equal(
    resolveManifestPath(env, "/d.json", () => true),
    null
  );
  assert.equal(
    resolveManifestPath(
      { WIKI_UPLOAD_MANIFEST: "/m.json" },
      "/d.json",
      () => false
    ),
    "/m.json"
  );
});

test("parseManifestはurlの無い行を拒否する", () => {
  assert.throws(() => parseManifest({ "images/a.png": {} }), /images\/a\.png/u);
  assert.throws(() => parseManifest([]), /オブジェクト/u);
});

test("rewriteTextはsrc、CSSのurl、srcsetのパスを差し替える", () => {
  const html =
    '<img src="/images/one-direction.png"><img srcset="/notion-images/x.webp 1x, /images/sponsors/a.svg 2x">' +
    "<style>@font-face{src:url(/fonts/m.woff2)}</style>";
  const { text, missing, replaced } = rewriteText(html, manifest);
  assert.equal(missing.size, 0);
  assert.equal(replaced, 4);
  assert.match(
    text,
    /src="https:\/\/static\.igem\.wiki\/teams\/1\/wiki\/images\/one-direction\.avif"/u
  );
  assert.match(
    text,
    /url\(https:\/\/static\.igem\.wiki\/teams\/1\/wiki\/fonts\/m\.woff2\)/u
  );
  assert.match(
    text,
    /x\.webp 1x, https:\/\/static\.igem\.wiki\/teams\/1\/wiki\/images\/sponsors\/a\.svg 2x/u
  );
});

test("rewriteTextはパーセントエンコードされた日本語のファイル名を引く", () => {
  const encoded = encodeURIComponent("469b-AIを用いて.pdf");
  const { text, missing } = rewriteText(
    `<a href="/notion-files/${encoded}">`,
    manifest
  );
  assert.equal(missing.size, 0);
  assert.equal(
    text,
    '<a href="https://static.igem.wiki/teams/1/wiki/notion-files/469b-ai.pdf">'
  );
});

test("rewriteTextはbase付きのパスも差し替える", () => {
  const { text } = rewriteText(
    '<img src="/keio-japan/images/one-direction.png">',
    manifest,
    "/keio-japan/"
  );
  assert.equal(
    text,
    '<img src="https://static.igem.wiki/teams/1/wiki/images/one-direction.avif">'
  );
});

test("rewriteTextは対応表に無いパスを書き換えずmissingに集める", () => {
  const html = '<img src="/images/none.png"><img src="/notion-images/y.webp">';
  const { text, missing } = rewriteText(html, manifest);
  assert.equal(text, html);
  assert.deepEqual([...missing].toSorted(), [
    "images/none.png",
    "notion-images/y.webp",
  ]);
});

test("rewriteTextは外部URLの途中や別ディレクトリのパスに触れない", () => {
  const html =
    '<a href="https://example.com/images/one-direction.png">' +
    '<img src="/models/sample.png"><a href="/keio-japan/models/a.glb">';
  const { text, missing } = rewriteText(html, manifest, "/keio-japan/");
  assert.equal(text, html);
  assert.equal(missing.size, 0);
});

test("rewriteTextはクエリやフラグメントの手前でパスを区切る", () => {
  const { text } = rewriteText(
    '<img src="/images/one-direction.png?v=1">',
    manifest
  );
  assert.equal(
    text,
    '<img src="https://static.igem.wiki/teams/1/wiki/images/one-direction.avif?v=1">'
  );
});
