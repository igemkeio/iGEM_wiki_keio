// ナビの分類の対応表と、content/のページの突き合わせ。fsに依存しない純粋関数だけを置く。

// 対応表(src/data/nav-categories.json)に載っていない公開ページの警告を返す。
// homeは分類に属さないので対象外。ビルドは止めず、警告として出すだけ。
export function findUnmappedPages(pages, config) {
  const known = new Set(config.categories.flatMap((c) => c.slugs));
  const fallback = config.categories.find((c) => c.id === config.fallback);
  return pages
    .filter((p) => p.slug !== "home" && !known.has(p.slug))
    .map((p) => ({
      file: p.file,
      reason: `src/data/nav-categories.jsonの分類に載っていません。${fallback?.label ?? config.fallback}の末尾に並べます`,
    }));
}
