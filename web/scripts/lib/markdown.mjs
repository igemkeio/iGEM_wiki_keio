import { Marked } from "marked";

// Markdown を本文 HTML に変換する。拡張は marked の拡張として順に足していく。
export function createRenderer() {
  return new Marked({ async: false });
}

export function renderMarkdown(md) {
  return createRenderer().parse(md).trim();
}
