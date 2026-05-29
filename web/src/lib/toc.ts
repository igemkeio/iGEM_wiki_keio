// ページ本文のHTMLからh2/h3見出しを抽出し、目次(TOC)を生成するユーティリティ。
// 各見出しにアンカー用のid属性を付与したHTMLと、ネストした目次データを返す。

export type TocEntry = {
  id: string;
  text: string;
  level: 2 | 3;
  children: TocEntry[];
};

// HTMLタグと主要なエンティティを除去して表示用テキストにする。
function stripTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

// 見出しテキストからアンカー用のslugを生成する。
function slugify(text: string): string {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  return slug || "section";
}

// 本文HTMLを走査して、h2/h3にidを付与しつつ目次を組み立てる。
export function buildToc(html: string): { html: string; toc: TocEntry[] } {
  const used = new Set<string>();
  const flat: { id: string; text: string; level: 2 | 3 }[] = [];

  const withIds = html.replace(
    /<(h[23])([^>]*)>([\s\S]*?)<\/\1>/gi,
    (_m, tag: string, attrs: string, inner: string) => {
      const text = stripTags(inner);

      // すでにid属性があればそれを尊重し、無ければslugから一意なidを採番する。
      const existing = attrs.match(/\sid=["']([^"']+)["']/i);
      let id: string;
      if (existing) {
        id = existing[1];
      } else {
        const base = slugify(text);
        id = base;
        let n = 1;
        while (used.has(id)) {
          n += 1;
          id = `${base}-${n}`;
        }
      }
      used.add(id);

      const level = tag.toLowerCase() === "h2" ? 2 : 3;
      flat.push({ id, text, level });

      const newAttrs = existing ? attrs : `${attrs} id="${id}"`;
      return `<${tag}${newAttrs}>${inner}</${tag}>`;
    }
  );

  // フラットな見出し列を h2 → h3 のネスト構造に変換する。
  const toc: TocEntry[] = [];
  for (const h of flat) {
    if (h.level === 2) {
      toc.push({ ...h, children: [] });
    } else {
      const parent = toc[toc.length - 1];
      if (parent) {
        parent.children.push({ ...h, children: [] });
      } else {
        // 先頭にh2が無くh3から始まる場合はトップレベルに置く。
        toc.push({ ...h, children: [] });
      }
    }
  }

  return { html: withIds, toc };
}
