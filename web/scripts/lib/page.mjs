// slug を小文字英数字とハイフンだけにする。空白とアンダースコアはハイフンにし、それ以外の文字は除く。
export function normalizeSlug(raw) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}

// slug ごとに、そのページで使う島の名前。web/src/islands.ts の ISLANDS のキーと手で揃える。
const ISLANDS_BY_SLUG = {
  members: ["member-list"],
  attributions: ["attribution-form"],
};

export function islandsFor(slug) {
  return ISLANDS_BY_SLUG[slug] ?? [];
}

// content/README.md のフィールド順で JSON 用のオブジェクトを作る。任意フィールドは値があるときだけ入れる。
export function buildPage({ slug, locale, title, subtitle, lead, html, order, islands }) {
  const page = { slug, locale, title };
  if (subtitle) page.subtitle = subtitle;
  if (lead) page.lead = lead;
  page.html = html;
  if (typeof order === "number") page.order = order;
  if (islands?.length) page.islands = islands;
  return page;
}

export function serializePage(page) {
  return `${JSON.stringify(page, null, 2)}\n`;
}
