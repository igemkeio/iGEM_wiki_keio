// content/のページとdist/のindex.htmlの対応付け。fsに依存しない純粋関数だけを置く。

// routes.tsのpagePathと同じ規則で、baseを含まないdist内のindex.htmlのパスを返す。
export function pagePath({ locale, slug }) {
  const prefix = locale === "en" ? "" : "ja/";
  return slug === "home" ? `${prefix}index.html` : `${prefix}${slug}/index.html`;
}

// 原稿JSONを { file, dist, islands } にする。publishedがfalseならnull。
// slugとlocaleはJSONの値を使い、なければファイル名とディレクトリ名で補う。
export function toPage(locale, fileName, json) {
  if (json?.published === false) return null;
  const slug = typeof json?.slug === "string" ? json.slug : fileName.replace(/\.json$/, "");
  const loc = json?.locale === "en" || json?.locale === "ja" ? json.locale : locale;
  return {
    file: `content/${locale}/${fileName}`,
    dist: pagePath({ locale: loc, slug }),
    islands: Array.isArray(json?.islands) ? json.islands : [],
  };
}

// content/から作ったページと、dist/のindex.htmlの集合を突き合わせ、{ file, reason }の配列で返す。
export function comparePages(pages, indexFiles) {
  const expected = new Set(pages.map((p) => p.dist));
  const actual = new Set(indexFiles);
  const violations = [];
  for (const file of [...actual].sort()) {
    if (!expected.has(file)) {
      violations.push({ file: `dist/${file}`, reason: "対応するcontent/のページがありません" });
    }
  }
  for (const page of pages) {
    if (!actual.has(page.dist)) {
      violations.push({ file: page.file, reason: `対応するdist/${page.dist}がありません` });
    }
  }
  return violations;
}
