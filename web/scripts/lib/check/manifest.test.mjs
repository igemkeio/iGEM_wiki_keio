import assert from "node:assert/strict";
import { test } from "node:test";

import {
  checkLeftoverPaths,
  findLeftoverPaths,
  usesUploadManifest,
} from "./manifest.mjs";

test("usesUploadManifestは未指定なら既定のファイルの有無、空文字は無効", () => {
  assert.equal(
    usesUploadManifest({}, "/d.json", () => true),
    true
  );
  assert.equal(
    usesUploadManifest({}, "/d.json", () => false),
    false
  );
  assert.equal(
    usesUploadManifest({ WIKI_UPLOAD_MANIFEST: "" }, "/d.json", () => true),
    false
  );
  assert.equal(
    usesUploadManifest(
      { WIKI_UPLOAD_MANIFEST: "/m.json" },
      "/d.json",
      () => false
    ),
    true
  );
});

test("findLeftoverPathsは残ったパスを重複なく返す", () => {
  const html =
    '<img src="/images/a.png"><img src="/images/a.png"><a href="/notion-files/x%E3%81%82.pdf">' +
    "<style>a{src:url(/fonts/m.woff2)}</style>";
  assert.deepEqual(findLeftoverPaths(html), [
    "/images/a.png",
    "/notion-files/x%E3%81%82.pdf",
    "/fonts/m.woff2",
  ]);
});

test("findLeftoverPathsはbase付きのパスも拾い、パスだけを返す", () => {
  assert.deepEqual(
    findLeftoverPaths('<img src="/keio-japan/images/a.png">', "/keio-japan/"),
    ["/images/a.png"]
  );
});

test("findLeftoverPathsは差し替え済みの外部URLとmodelsを拾わない", () => {
  const html =
    '<img src="https://static.igem.wiki/teams/1/wiki/images/a.avif">' +
    '<a href="/keio-japan/models/a.glb"><a href="/images-of-team/">';
  assert.deepEqual(findLeftoverPaths(html, "/keio-japan/"), []);
});

test("checkLeftoverPathsは残ったパスごとに違反を返す", () => {
  const out = checkLeftoverPaths('<img src="/images/a.png">');
  assert.equal(out.length, 1);
  assert.match(out[0], /\/images\/a\.png/u);
  assert.deepEqual(checkLeftoverPaths("<p>ok</p>"), []);
});
