import { Marked } from "marked";
import { mathExtensions } from "./katex.mjs";

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'" };

function stripTags(html) {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&(amp|lt|gt|quot|#39);/g, (_, name) => ENTITIES[name]);
}

// 見出しの文字列からid用の文字列を作る。小文字化し、空白をハイフンに、句読点と記号(ハイフンを除く)を除く。
export function slugifyHeading(text) {
  const slug = text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/(?!-)[\p{P}\p{S}]/gu, "");
  return slug || "section";
}

// 属性のないh2とh3にidを付ける。重複は2つ目以降に-2、-3を付ける。
export function addHeadingIds(html) {
  const used = new Map();
  return html.replace(/<(h[23])>([\s\S]*?)<\/\1>/g, (_, tag, inner) => {
    const base = slugifyHeading(stripTags(inner));
    const count = (used.get(base) ?? 0) + 1;
    used.set(base, count);
    const id = count === 1 ? base : `${base}-${count}`;
    return `<${tag} id="${id}">${inner}</${tag}>`;
  });
}

// Markdown を本文 HTML に変換する。拡張は marked の拡張として順に足していく。
export function createRenderer() {
  return new Marked({ async: false, extensions: mathExtensions });
}

export function renderMarkdown(md) {
  return addHeadingIds(createRenderer().parse(md).trim());
}
