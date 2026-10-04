// HTMLの検査。fsに依存しない純粋関数だけを置く。
import { extractCssUrls } from "./css.mjs";

// コメント、scriptとstyleの中身は、タグの解析の対象にしない。タグ自体は残す。
function stripNoise(html) {
  return html
    .replaceAll(/<!--[\s\S]*?-->/gu, "")
    .replaceAll(/(<script\b[^>]*>)[\s\S]*?(<\/script>)/giu, "$1$2")
    .replaceAll(/(<style\b[^>]*>)[\s\S]*?(<\/style>)/giu, "$1$2");
}

const namedEntities = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

// 属性値の文字参照を戻す。1回の置換で処理し、戻した結果をさらに解釈しない。
function decode(value) {
  return value.replaceAll(
    /&(?:#[xX]([0-9a-fA-F]+)|#(\d+)|(amp|lt|gt|quot|apos));/gu,
    (whole, hex, dec, name) => {
      if (name) {
        return namedEntities[name];
      }
      const code = hex ? Number(`0x${hex}`) : Number(dec);
      return code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : whole;
    }
  );
}

const attrPattern =
  /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'<>`]+)))?/gu;

// 開きタグを { name, attrs } の配列にする。名前と属性名は小文字、値のない属性は空文字。
export function parseTags(html) {
  const tags = [];
  for (const m of stripNoise(html).matchAll(
    /<([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>/gu
  )) {
    const attrs = new Map();
    for (const a of m[2].matchAll(attrPattern)) {
      attrs.set(a[1].toLowerCase(), decode(a[2] ?? a[3] ?? a[4] ?? ""));
    }
    tags.push({ name: m[1].toLowerCase(), attrs });
  }
  return tags;
}

// srcsetの候補ごとのURLを返す。URLにカンマを含んでよいので、空白で区切ってから末尾のカンマを落とす。
export function splitSrcset(value) {
  const urls = [];
  let rest = value.trim();
  while (rest !== "") {
    rest = rest.replace(/^[\s,]+/u, "");
    const m = /^\S+/u.exec(rest);
    if (!m) {
      break;
    }
    rest = rest.slice(m[0].length);
    const url = m[0].replace(/,+$/u, "");
    if (url !== "") {
      urls.push(url);
    }
    if (m[0].endsWith(",")) {
      continue;
    }
    const comma = rest.indexOf(",");
    rest = comma === -1 ? "" : rest.slice(comma + 1);
  }
  return urls;
}

const urlAttrs = ["src", "href", "data", "poster", "xlink:href"];

// URLを持つ属性を { tag, attr, value } の配列で返す。
// style属性と<style>の中身は、CSSとして別にextractStyleUrlsで取る。
export function extractRefs(html) {
  const refs = [];
  for (const { name, attrs } of parseTags(html)) {
    for (const attr of urlAttrs) {
      if (attrs.has(attr)) {
        refs.push({ tag: name, attr, value: attrs.get(attr).trim() });
      }
    }
    for (const attr of ["srcset", "imagesrcset"]) {
      if (!attrs.has(attr)) {
        continue;
      }
      for (const value of splitSrcset(attrs.get(attr))) {
        refs.push({ tag: name, attr, value });
      }
    }
    if (name === "meta" && attrs.has("content")) {
      const content = attrs.get("content").trim();
      const refresh = /^\s*\d*\s*;?\s*url\s*=\s*['"]?([^'"]*)/iu.exec(content);
      refs.push({
        tag: name,
        attr: "content",
        value: refresh ? refresh[1].trim() : content,
      });
    }
  }
  return refs;
}

// style属性と<style>の中身のCSSのurl(...)と@importを返す。
export function extractStyleUrls(html) {
  const urls = [];
  const source = html.replaceAll(/<!--[\s\S]*?-->/gu, "");
  for (const m of source.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/giu)) {
    urls.push(...extractCssUrls(m[1]));
  }
  for (const { attrs } of parseTags(html)) {
    if (attrs.has("style")) {
      urls.push(...extractCssUrls(attrs.get("style")));
    }
  }
  return urls;
}

// 外部URLの検査から外すのは、ページ遷移のリンク(aとareaのhref)だけ。
export function isExternalCheckTarget(ref) {
  return !(
    (ref.tag === "a" || ref.tag === "area") &&
    (ref.attr === "href" || ref.attr === "xlink:href")
  );
}

// 内部リンクの検査に使うのは、値がURLだと決まっている属性。metaのcontentは除く。
export function isInternalCheckTarget(ref) {
  return ref.tag !== "meta";
}

// 構造の違反を理由の配列で返す。
export function checkStructure(html) {
  const reasons = [];
  // SVGの<title>はページのtitleではないので、数える前にsvgを除く。
  const titles = parseTags(
    html.replaceAll(/<svg\b[\s\S]*?<\/svg>/giu, "")
  ).filter((t) => t.name === "title").length;
  const tags = parseTags(html);
  const h1s = tags.filter((t) => t.name === "h1").length;
  if (titles !== 1) {
    reasons.push(`<title>が${titles}個あります(1個である必要があります)`);
  }
  if (h1s !== 1) {
    reasons.push(`<h1>が${h1s}個あります(1個である必要があります)`);
  }
  const noAlt = tags.filter(
    (t) => t.name === "img" && !t.attrs.has("alt")
  ).length;
  if (noAlt > 0) {
    reasons.push(`alt属性のない<img>が${noAlt}個あります`);
  }
  return reasons;
}

export function checkLang(html) {
  const htmlTag = parseTags(html).find((t) => t.name === "html");
  const lang = htmlTag?.attrs.get("lang");
  if (lang === "en" || lang === "ja") {
    return [];
  }
  return [
    `<html lang>がenかjaではありません(${lang === undefined ? "未指定" : lang})`,
  ];
}

// 島のないページにscriptがあれば違反。許すのは、srcを持たず data-palette-switcher を持つインラインscriptだけ。
export function checkNoScript(html) {
  return parseTags(html).some(
    (t) =>
      t.name === "script" &&
      !(t.attrs.has("data-palette-switcher") && !t.attrs.has("src"))
  )
    ? ["islandsが空のページに<script>があります"]
    : [];
}
