// distの容量の検査。fsに依存しない純粋関数だけを置く。

// iGEMのwikiの成果物の上限(5MB)。
export const SIZE_LIMIT_BYTES = 5 * 1024 * 1024;

// 容量を検査するかどうか。WIKI_CHECK_SIZE=1の明示があるときだけ見る。PRERENDER_ALL=1のdistはE2E用で配信しないので見ない。
export function shouldCheckSize(env) {
  return env.WIKI_CHECK_SIZE === "1" && env.PRERENDER_ALL !== "1";
}

const formatMB = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)}MB`;

// files: { path, size }の配列。合計が上限を超えたとき、大きい順の上位topN件を含む違反の文言を返す。
export function checkTotalSize(files, limit = SIZE_LIMIT_BYTES, topN = 10) {
  const total = files.reduce((sum, f) => sum + f.size, 0);
  if (total <= limit) {
    return [];
  }
  const top = [...files].toSorted((a, b) => b.size - a.size).slice(0, topN);
  const lines = top.map((f) => `  ${formatMB(f.size)} ${f.path}`);
  return [
    `distの合計が${formatMB(total)}で、上限${formatMB(limit)}を超えています。大きい順の上位${top.length}件:\n${lines.join("\n")}`,
  ];
}
