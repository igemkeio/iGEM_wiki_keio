// HTMLの検査。fsに依存しない純粋関数だけを置く。

// コメント、script、styleの中身は検査の対象にしない。scriptタグ自体は残す。
function stripNoise(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/(<script\b[^>]*>)[\s\S]*?(<\/script>)/gi, "$1$2")
    .replace(/(<style\b[^>]*>)[\s\S]*?(<\/style>)/gi, "$1$2");
}

function decode(value) {
  return value.replace(/&amp;/g, "&");
}

const attrPattern = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'<>`]+)))?/g;

// 開きタグを { name, attrs } の配列にする。属性名は小文字、値のない属性は空文字。
export function parseTags(html) {
  const tags = [];
  for (const m of stripNoise(html).matchAll(/<([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>/g)) {
    const attrs = new Map();
    for (const a of m[2].matchAll(attrPattern)) {
      const value = a[2] ?? a[3] ?? a[4] ?? "";
      attrs.set(a[1].toLowerCase(), decode(value));
    }
    tags.push({ name: m[1].toLowerCase(), attrs });
  }
  return tags;
}

// 外部URLと内部リンクの検査に使うsrcとhref。
// 外部URLの検査ではaのhrefを除くので、タグ名も返す。
export function extractRefs(html) {
  const refs = [];
  for (const { name, attrs } of parseTags(html)) {
    for (const attr of ["src", "href"]) {
      if (attrs.has(attr)) refs.push({ tag: name, attr, value: attrs.get(attr).trim() });
    }
  }
  return refs;
}

const externalTags = new Set(["link", "script", "img", "source", "video", "iframe"]);

export function isExternalCheckTarget(ref) {
  return externalTags.has(ref.tag);
}

// 構造の違反を理由の配列で返す。
export function checkStructure(html) {
  const tags = parseTags(html);
  const reasons = [];
  const titles = tags.filter((t) => t.name === "title").length;
  const h1s = tags.filter((t) => t.name === "h1").length;
  if (titles !== 1) reasons.push(`<title> が ${titles} 個あります(1個である必要があります)`);
  if (h1s !== 1) reasons.push(`<h1> が ${h1s} 個あります(1個である必要があります)`);
  const noAlt = tags.filter((t) => t.name === "img" && !t.attrs.has("alt")).length;
  if (noAlt > 0) reasons.push(`alt 属性のない <img> が ${noAlt} 個あります`);
  return reasons;
}

export function checkLang(html) {
  const htmlTag = parseTags(html).find((t) => t.name === "html");
  const lang = htmlTag?.attrs.get("lang");
  if (lang === "en" || lang === "ja") return [];
  return [`<html lang> が en か ja ではありません(${lang === undefined ? "未指定" : lang})`];
}

// 島のないページにscriptがあれば違反。
export function checkNoScript(html) {
  return parseTags(html).some((t) => t.name === "script")
    ? ["islands が空のページに <script> があります"]
    : [];
}
