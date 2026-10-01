// CSSのurl(...)と、url()を使わない@importの文字列を値の配列で返す。コメント内は除く。
// data:なども含めて返し、判定は呼び出し側で行う。
export function extractCssUrls(css) {
  const urls = [];
  const source = css.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const m of source.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)\s]*))\s*\)/gi)) {
    urls.push((m[1] ?? m[2] ?? m[3] ?? "").trim());
  }
  for (const m of source.matchAll(/@import\s*(?:"([^"]*)"|'([^']*)')/gi)) {
    urls.push((m[1] ?? m[2]).trim());
  }
  return urls;
}
