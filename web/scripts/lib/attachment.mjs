import crypto from "node:crypto";

import { escapeHtml } from "./figure.mjs";

// ハッシュと区切りの17バイトを足しても、ファイル名の上限255バイトに収まる値。
const MAX_NAME_BYTES = 200;
const VIDEO_EXT = /\.(mp4|mov|webm|m4v|avi|mkv|wmv|flv|mpe?g|ogv|3gp)$/iu;

// 署名付きURLのパスから、ダウンロード時の元のファイル名を取り出す。
export function fileNameFromUrl(url) {
  const last = new URL(url).pathname.split("/").pop() ?? "";
  try {
    return decodeURIComponent(last);
  } catch {
    return last;
  }
}

// パスとして使えない文字と空白を _ にし、UTF-8で長すぎる名前は拡張子を残して文字の境目で切る。
function sanitizeName(name) {
  const safe = name
    .replaceAll(/[\\/:*?"<>|\s\p{Cc}]+/gu, "_")
    .replace(/^\.+/u, "");
  if (Buffer.byteLength(safe) <= MAX_NAME_BYTES) {
    return safe || "file";
  }
  const dot = safe.lastIndexOf(".");
  const ext =
    dot > 0 && Buffer.byteLength(safe.slice(dot)) <= 10 ? safe.slice(dot) : "";
  const stem = ext ? safe.slice(0, dot) : safe;
  let out = "";
  let bytes = Buffer.byteLength(ext);
  for (const ch of stem) {
    bytes += Buffer.byteLength(ch);
    if (bytes > MAX_NAME_BYTES) {
      break;
    }
    out += ch;
  }
  return out + ext;
}

// 保存名は内容のsha256先頭16桁と元のファイル名。同じ内容は同じ名前になり二重に保存されない。
export function attachmentFileName(buf, originalName) {
  const hash = crypto
    .createHash("sha256")
    .update(buf)
    .digest("hex")
    .slice(0, 16);
  return `${hash}-${sanitizeName(originalName)}`;
}

// 配信用のパス。ファイル名はURLとして安全な形にエンコードする。
export function attachmentHref(prefix, fileName) {
  return `${prefix}/${encodeURIComponent(fileName)}`;
}

// ブロックに name があればそれを、無ければURLのパスから元のファイル名を得る。
function originalNameOf(body) {
  return typeof body.name === "string" && body.name.trim()
    ? body.name.trim()
    : fileNameFromUrl(body.file.url);
}

// file / pdf / video ブロックのカスタム変換。
// save(url) はダウンロードして保存し、配信用パスを返す(失敗時は null)。
// 戻り値が文字列ならその内容に置き換え、false なら notion-to-md の既定変換に任せる。
export async function transformAttachment(block, save, warn) {
  const { type } = block;
  const body = block[type];
  if (body.type !== "file") {
    return false;
  }
  const name = originalNameOf(body);
  // 動画はiGEMの規定でリポジトリに入れないため、videoブロックでなくても拡張子で除く。
  if (type === "video" || VIDEO_EXT.test(name)) {
    warn(
      `Notionにアップロードされた動画は出力しません。外部URLに差し替えてください: ${name} (ブロック ${block.id})`
    );
    return "";
  }
  const href = await save(body.file.url, name);
  if (!href) {
    return `<!-- ファイルをスキップしました -->`;
  }
  const caption = (body.caption ?? []).map((t) => t.plain_text).join("");
  const text = (caption.trim() || name).replaceAll(/\s*\n\s*/gu, " ");
  return `<p><a href="${escapeHtml(href)}">${escapeHtml(text)}</a></p>`;
}
