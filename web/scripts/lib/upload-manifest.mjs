// アップロードの対応表(public/からの相対パス → static.igem.wikiのURL)でdistのURLを差し替える純関数。fsには触れない。

// 対応表で差し替える、public/直下のディレクトリ。models/は目印を通らないので含めない。
export const MANIFEST_DIRECTORIES = [
  "notion-images",
  "notion-files",
  "fonts",
  "images",
];

// 環境変数WIKI_UPLOAD_MANIFESTから対応表のパスを決める。未指定なら既定のパスがあるときだけ使い、空文字は対応表モードの無効化。
export function resolveManifestPath(env, defaultPath, exists) {
  const value = env.WIKI_UPLOAD_MANIFEST;
  if (value === undefined) {
    return exists(defaultPath) ? defaultPath : null;
  }
  return value === "" ? null : value;
}

// JSONの中身を検査してMapにする。値が{ url: string }でない行は例外にする。
export function parseManifest(json) {
  if (json === null || typeof json !== "object" || Array.isArray(json)) {
    throw new TypeError("対応表がオブジェクトではありません");
  }
  const map = new Map();
  for (const [key, entry] of Object.entries(json)) {
    if (typeof entry?.url !== "string" || entry.url === "") {
      throw new TypeError(`対応表の${key}にurlがありません`);
    }
    map.set(key, entry.url);
  }
  return map;
}

// baseは"/"、"/keio/"、"keio"のどれでもよい。Viteが/fonts/...をbase付きに書き換えることがあるので、base付きの形も拾う。
function normalizeBase(base) {
  const trimmed = base.replaceAll(/^\/+|\/+$/gu, "");
  return trimmed === "" ? "" : `/${trimmed}`;
}

const escapeRegExp = (s) =>
  s.replaceAll(/[.*+?^${}()|[\]\\]/gu, String.raw`\$&`);

// 差し替え対象のパスに当たる正規表現。直前がURLの一部(英数字や/、:など)のときは外部URLの途中なので除く。
export function pathPattern(base = "/") {
  const prefix = normalizeBase(base);
  const dirs = MANIFEST_DIRECTORIES.join("|");
  const head = prefix === "" ? "" : `(?:${escapeRegExp(prefix)})?`;
  return new RegExp(
    String.raw`(?<![\w/:.%-])${head}/(${dirs})/([^\s"'<>()\\,;?#&\x60]+)`,
    "gu"
  );
}

function decode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

// text中の対象パスを対応表のURLに替える。対応表に無いパスは書き換えず、キー(public/からの相対パス)をmissingに集める。
export function rewriteText(text, manifest, base = "/") {
  const missing = new Set();
  let replaced = 0;
  const out = text.replace(pathPattern(base), (whole, dir, rest) => {
    const key = `${dir}/${decode(rest)}`;
    const url = manifest.get(key);
    if (url === undefined) {
      missing.add(key);
      return whole;
    }
    replaced += 1;
    return url;
  });
  return { text: out, missing, replaced };
}
