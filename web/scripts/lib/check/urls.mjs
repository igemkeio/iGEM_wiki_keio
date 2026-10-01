// URLの検査。fsに依存しない純粋関数だけを置く。
import { posix } from "node:path";

const allowedHosts = [
  "static.igem.wiki",
  "video.igem.org",
  "igem.org",
  "igem.wiki",
];
const dummyHost = "base.invalid";

export function isAllowedHost(host) {
  const h = host.toLowerCase().replace(/\.$/u, "");
  return allowedHosts.some(
    (allowed) => h === allowed || h.endsWith(`.${allowed}`)
  );
}

// ブラウザと同じ規則でURLを解釈し、http、httpsの外部ホストならホスト名を返す。
// サイト内のパス、mailto:やdata:などのスキーム、解釈できない値はnull。
export function externalHost(value) {
  let url;
  try {
    url = new URL(value, `https://${dummyHost}/`);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return null;
  }
  if (url.hostname === dummyHost) {
    return null;
  }
  return url.hostname.replace(/\.$/u, "");
}

// 外部URLの違反理由を返す。許可されていれば空配列。
export function checkExternalUrl(value) {
  const host = externalHost(value);
  if (host === null || isAllowedHost(host)) {
    return [];
  }
  return [`許可されていない外部URLです: ${value}`];
}

// "/"で始まるサイト内の絶対パスか。"//"や"/\\"で始まるプロトコル相対URLは含まない。
export function isInternalPath(value) {
  return value.startsWith("/") && !/^\/[/\\]/u.test(value);
}

// baseを除いたdist内の相対パスを返す。baseの外を指していればnull。
// baseは"/"、"/keio/"、"keio"のどれでも同じ形に揃えて扱う。
export function stripBase(pathname, base) {
  const normalized = `/${base.replaceAll(/^\/+|\/+$/gu, "")}/`.replace(
    /^\/\/$/u,
    "/"
  );
  if (!pathname.startsWith(normalized)) {
    return null;
  }
  return pathname.slice(normalized.length);
}

// 内部リンクの違反理由を返す。filesはdist内のファイルの相対パス(posix)の集合。
export function checkInternalLink(value, base, files) {
  if (!isInternalPath(value)) {
    return [];
  }
  const pathname = value.replace(/[?#].*$/u, "");
  const rel = stripBase(pathname, base);
  if (rel === null) {
    return [`baseの外を指すリンクです(base: ${base}): ${value}`];
  }
  let decoded;
  try {
    decoded = decodeURIComponent(rel);
  } catch {
    return [`パスをURLデコードできません: ${value}`];
  }
  const target = posix.normalize(decoded);
  if (target === ".." || target.startsWith("../")) {
    return [`distの外を指すリンクです: ${value}`];
  }
  const dir = target === "." || target === "" ? "" : target.replace(/\/$/u, "");
  const candidates =
    target.endsWith("/") || dir === ""
      ? [posix.join(dir, "index.html")]
      : [dir, posix.join(dir, "index.html")];
  if (candidates.some((c) => files.has(c))) {
    return [];
  }
  return [`リンク先がdistに存在しません: ${value}`];
}
