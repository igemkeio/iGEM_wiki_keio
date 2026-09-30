export const IGEM_STATIC_HOST = "static.igem.wiki";

export function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// キャプションの先頭が Fig. N の形ならラベルとして分け、残りをタイトルにする。
export function parseCaption(caption) {
  const text = caption.trim();
  const m = /^(Fig\.?\s*\d+)[\s.:：\-–—]*([\s\S]*)$/i.exec(text);
  if (!m) return { label: "", title: text };
  return { label: m[1], title: m[2].trim() };
}

// 画像とキャプションを Figure カードの HTML にする。キャプションが無ければ素の img にする。
// 空行を含めないのは、外側のmarkedにHTMLブロックとして素通しさせるため。
export function renderImage({ src, caption }) {
  const text = caption.trim();
  const alt = escapeHtml(text);
  const img = `<img src="${escapeHtml(src)}" alt="${alt}" />`;
  if (!text) return img;
  const { label, title } = parseCaption(text);
  const body = [
    label && `<p class="figure-card__label">${escapeHtml(label)}</p>`,
    title && `<h3 class="figure-card__title">${escapeHtml(title)}</h3>`,
  ].filter(Boolean);
  return [
    '<figure class="figure-card">',
    `<div class="figure-card__media">${img}</div>`,
    '<figcaption class="figure-card__body">',
    ...body,
    "</figcaption>",
    "</figure>",
  ].join("\n");
}

// HTML 中の img の src を出現順に返す。
export function collectImageSrcs(html) {
  return [...html.matchAll(/<img\b[^>]*?\bsrc="([^"]*)"/g)].map((m) =>
    m[1].replace(/&amp;/g, "&")
  );
}

export function isIgemStatic(src) {
  try {
    return new URL(src).hostname === IGEM_STATIC_HOST;
  } catch {
    return false;
  }
}
