// URLの検査。fsに依存しない純粋関数だけを置く。
import { posix } from "node:path";

const allowedHosts = ["static.igem.wiki", "video.igem.org", "igem.org", "igem.wiki"];

export function isAllowedHost(host) {
  const h = host.toLowerCase();
  return allowedHosts.some((allowed) => h === allowed || h.endsWith(`.${allowed}`));
}

// http、https、プロトコル相対のURLならホストを返す。それ以外はnull。
export function externalHost(value) {
  const m = /^(?:https?:)?\/\/([^/?#\\]*)/i.exec(value);
  if (!m) return null;
  return m[1].replace(/^.*@/, "").replace(/:\d+$/, "");
}

// 外部URLの違反理由を返す。許可されていれば空配列。
export function checkExternalUrl(value) {
  const host = externalHost(value);
  if (host === null || isAllowedHost(host)) return [];
  return [`許可されていない外部URLです: ${value}`];
}

// "/"で始まるサイト内の絶対パスか。"//"で始まるプロトコル相対URLは含まない。
export function isInternalPath(value) {
  return value.startsWith("/") && !value.startsWith("//");
}

// baseを除いたdist内の相対パスを返す。baseの外を指していればnull。
// baseは"/"か"/keio/"のように前後が"/"の形に揃えて扱う。
export function stripBase(pathname, base) {
  const normalized = `/${base.replace(/^\/+|\/+$/g, "")}/`.replace(/^\/\/$/, "/");
  if (!pathname.startsWith(normalized)) return null;
  return pathname.slice(normalized.length);
}

// 内部リンクの違反理由を返す。files はdist内のファイルの相対パス(posix)の集合。
export function checkInternalLink(value, base, files) {
  if (!isInternalPath(value)) return [];
  const pathname = value.replace(/[?#].*$/, "");
  const rel = stripBase(pathname, base);
  if (rel === null) return [`base(${base})の外を指すリンクです: ${value}`];
  let decoded;
  try {
    decoded = decodeURIComponent(rel);
  } catch {
    decoded = rel;
  }
  const target = posix.normalize(decoded);
  if (target.startsWith("..")) return [`dist の外を指すリンクです: ${value}`];
  const dir = target === "." || target === "" ? "" : target.replace(/\/$/, "");
  const candidates = target.endsWith("/") || dir === "" ? [posix.join(dir, "index.html")] : [dir, posix.join(dir, "index.html")];
  if (candidates.some((c) => files.has(c))) return [];
  return [`リンク先が dist に存在しません: ${value}`];
}
