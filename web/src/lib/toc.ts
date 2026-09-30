export type TocItem = {
  id: string;
  text: string;
  children: TocItem[];
};

const entities: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&nbsp;": " ",
};

function toText(inner: string): string {
  return inner
    .replace(/<span class="katex-mathml">[\s\S]*?<\/span>/g, "")
    .replace(/<[^>]*>/g, "")
    .replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g, (m) => entities[m])
    .replace(/\s+/g, " ")
    .trim();
}

// htmlのh2とh3からidとテキストを拾い、h2の下にh3を入れた木を返す。aside.note内の見出しは除く。
export function buildToc(html: string): TocItem[] {
  const body = html.replace(/<aside\b[^>]*\bclass="[^"]*\bnote\b[^"]*"[^>]*>[\s\S]*?<\/aside>/g, "");
  const items: TocItem[] = [];
  let current: TocItem | null = null;
  for (const m of body.matchAll(/<h([23])\b([^>]*)>([\s\S]*?)<\/h\1>/g)) {
    const id = /\bid="([^"]*)"/.exec(m[2])?.[1];
    if (!id) continue;
    const item: TocItem = { id, text: toText(m[3]), children: [] };
    if (m[1] === "2") {
      items.push(item);
      current = item;
    } else if (current) {
      current.children.push(item);
    } else {
      items.push(item);
    }
  }
  return items;
}
