// アップロードの対応表を使うビルドの検査。fsに依存しない純粋関数だけを置く。

// 対応表で差し替える対象のディレクトリ。scripts/lib/upload-manifest.mjsと同じ並びで、独立して持つ。
const DIRECTORIES = ["notion-images", "notion-files", "fonts", "images"];

const escapeRegExp = (s) =>
  s.replaceAll(/[.*+?^${}()|[\]\\]/gu, String.raw`\$&`);

// 対応表を使うビルドか。WIKI_UPLOAD_MANIFESTが未指定なら既定のファイルがあるときだけ使い、空文字なら使わない。
export function usesUploadManifest(env, defaultPath, exists) {
  const value = env.WIKI_UPLOAD_MANIFEST;
  if (value === undefined) {
    return exists(defaultPath);
  }
  return value !== "";
}

// 差し替えられずにdistに残った/notion-images/などへのパスを、重複を除いて返す。base付きの形も拾う。
export function findLeftoverPaths(text, base = "/") {
  const trimmed = base.replaceAll(/^\/+|\/+$/gu, "");
  const head = trimmed === "" ? "" : `(?:${escapeRegExp(`/${trimmed}`)})?`;
  const pattern = new RegExp(
    String.raw`(?<![\w/:.%-])${head}(/(?:${DIRECTORIES.join("|")})/[^\s"'<>()\\,;?#&\x60]+)`,
    "gu"
  );
  return [...new Set([...text.matchAll(pattern)].map((m) => m[1]))];
}

// 対応表を使うビルドで、差し替えられていないパスの違反理由を返す。
export function checkLeftoverPaths(text, base = "/") {
  return findLeftoverPaths(text, base).map(
    (path) =>
      `対応表に無いパスがdistに残っています(アップロードして対応表を作り直してください): ${path}`
  );
}
