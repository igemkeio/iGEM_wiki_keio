export interface TocItem {
  id: string;
  text: string;
  children: TocItem[];
}

const named: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

// 名前付きと数値の文字参照を1回の走査で復号する。復号結果が別の参照に見えても再復号しない。
function decodeEntities(text: string): string {
  return text.replaceAll(
    /&(?:#(\d+)|#[xX]([0-9a-fA-F]+)|(amp|lt|gt|quot|apos|nbsp));/gu,
    (m, dec, hex, name) => {
      if (name) {
        return named[name];
      }
      const code = dec ? Number(dec) : Number.parseInt(hex, 16);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : m;
    }
  );
}

function toText(inner: string): string {
  return decodeEntities(
    inner
      .replaceAll(/<span class="katex-mathml">[\s\S]*?<\/span>/gu, "")
      .replaceAll(/<[^>]*>/gu, "")
  )
    .replaceAll(/\s+/gu, " ")
    .trim();
}

// htmlのh2とh3からidとテキストを拾い、h2の下にh3を入れた木を返す。aside.note内の見出しは除く。
export function buildToc(html: string): TocItem[] {
  const body = html.replaceAll(
    /<aside\b[^>]*\bclass="[^"]*\bnote\b[^"]*"[^>]*>[\s\S]*?<\/aside>/gu,
    ""
  );
  const items: TocItem[] = [];
  let current: TocItem | null = null;
  for (const m of body.matchAll(/<h([23])\b([^>]*)>([\s\S]*?)<\/h\1>/gu)) {
    const id = /(?:^|\s)id="([^"]*)"/u.exec(m[2])?.[1];
    if (!id) {
      continue;
    }
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
