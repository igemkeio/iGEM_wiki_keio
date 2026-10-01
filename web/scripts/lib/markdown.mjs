import { Marked } from "marked";
import { mathExtensions } from "./katex.mjs";

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'" };

// 見出しのHTMLから表示される文字だけを取り出す。KaTeXのMathML部分は描画テキストと二重になるので除く。
function stripTags(html) {
  return html
    .replace(/<span class="katex-mathml">[\s\S]*?<\/span>/g, "")
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
  const used = new Set();
  return html.replace(/<(h[23])>([\s\S]*?)<\/\1>/g, (_, tag, inner) => {
    const base = slugifyHeading(stripTags(inner));
    let id = base;
    for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
    used.add(id);
    return `<${tag} id="${id}">${inner}</${tag}>`;
  });
}

// 数式の拡張を入れた marked を返す。
export function createRenderer() {
  return new Marked({ async: false, extensions: mathExtensions });
}

// 本文中のh1をh2にする。h1はページの見出しが使うので、本文には置かない。
function demoteH1(html) {
  return html.replace(/<h1(\s[^>]*)?>([\s\S]*?)<\/h1>/g, (_, attrs = "", inner) => `<h2${attrs}>${inner}</h2>`);
}

// 見出しidを付けない本文変換。HTMLブロックの中に埋め込む断片に使う。
function renderFragment(md) {
  return createRenderer().parse(md).trim();
}

// <pre> の中の空行は、外側のHTMLブロックが途切れないよう印に置き換えて運び、最後に空行へ戻す。
const BLANK_MARK = "<!--blank-->";

export function renderMarkdown(md) {
  return addHeadingIds(demoteH1(renderFragment(md))).replaceAll(BLANK_MARK, "");
}

// Notionのcalloutの本文(Markdown)を Note の HTML にする。
// 外側のmarkedがHTMLブロックとして素通しするよう、内側の空行は詰める。
export function renderNote(bodyMarkdown) {
  const body = renderFragment(bodyMarkdown)
    .split(/(<pre[\s\S]*?<\/pre>)/)
    .map((part, i) =>
      i % 2 === 1
        ? part.replace(/\n[ \t]*(?=\n)/g, (m) => `\n${BLANK_MARK}${m.slice(1)}`)
        : part.replace(/\n{2,}/g, "\n")
    )
    .join("");
  return `<aside class="note">\n<p class="note__label">Note</p>\n${body}\n</aside>`;
}

// Notionのrich_text配列をMarkdownにする。インライン数式は$...$、装飾とリンクはMarkdownの記法で書く。
export function richTextToMarkdown(richText) {
  return richText
    .map((t) => {
      if (t.type === "equation") return `$${t.equation.expression}$`;
      const a = t.annotations ?? {};
      let text = t.plain_text;
      if (a.code) text = `\`${text}\``;
      if (a.bold) text = `**${text}**`;
      if (a.italic) text = `_${text}_`;
      if (a.strikethrough) text = `~~${text}~~`;
      if (t.href) text = `[${text}](${t.href})`;
      return text;
    })
    .join("");
}
