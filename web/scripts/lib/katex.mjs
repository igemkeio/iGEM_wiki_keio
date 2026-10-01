import katex from "katex";

// LaTeX を KaTeX の HTML にする。不正な式でも例外を投げず、エラー表示の HTML を返す。
export function renderMath(latex, displayMode) {
  return katex.renderToString(latex, { displayMode, throwOnError: false });
}

// marked 用の拡張。ブロック数式($$ ... $$)とインライン数式($...$)を KaTeX の HTML にする。
// インラインは、$の直後と直前が空白でなく、閉じの$の直後が数字でないときだけ数式とみなし、金額の$を巻き込まない。
export const mathExtensions = [
  {
    name: "mathBlock",
    level: "block",
    start: (src) => src.indexOf("$$"),
    tokenizer(src) {
      const m = /^\$\$[ \t]*\n?([\s\S]+?)\n?[ \t]*\$\$[ \t]*(?:\n|$)/.exec(src);
      if (!m) return undefined;
      return { type: "mathBlock", raw: m[0], text: m[1].trim() };
    },
    renderer: (token) => `${renderMath(token.text, true)}\n`,
  },
  {
    name: "mathInline",
    level: "inline",
    start: (src) => src.indexOf("$"),
    tokenizer(src) {
      const m = /^\$(?!\s)((?:\\.|[^$\\\n])+?)(?<!\s)\$(?!\d)/.exec(src);
      if (!m) return undefined;
      return { type: "mathInline", raw: m[0], text: m[1] };
    },
    renderer: (token) => renderMath(token.text, false),
  },
];
