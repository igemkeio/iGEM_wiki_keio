export const IGEM_STATIC_HOST = "static.igem.wiki";

export function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// キャプションの先頭が Fig. N の形ならラベルとして分ける。
// 残りの1行目をタイトル、2行目以降を説明の段落にする。
export function parseCaption(caption) {
  const text = caption.trim();
  const m = /^(Fig\.?\s*\d+)[\s.:：\-–—]*([\s\S]*)$/i.exec(text);
  const label = m ? m[1] : "";
  const lines = (m ? m[2] : text)
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  return { label, title: lines[0] ?? "", description: lines.slice(1) };
}

// 画像とキャプションを Figure カードの HTML にする。キャプションが無ければ素の img にする。
// 空行を含めないのは、外側のmarkedにHTMLブロックとして素通しさせるため。
export function renderImage({ src, caption }) {
  const text = caption.trim();
  const alt = escapeHtml(text);
  const img = `<img src="${escapeHtml(src)}" alt="${alt}" />`;
  if (!text) return img;
  const { label, title, description } = parseCaption(text);
  const body = [
    label && `<p class="figure-card__label">${escapeHtml(label)}</p>`,
    title && `<h3 class="figure-card__title">${escapeHtml(title)}</h3>`,
    ...description.map((line) => `<p>${escapeHtml(line)}</p>`),
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
