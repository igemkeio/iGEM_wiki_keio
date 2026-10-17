import { toText } from "./toc";

export interface MessageParagraph {
  // 段落の中身のhtml。全体がstrongで包まれていれば外してemphasisを立てる。
  html: string;
  emphasis: boolean;
}

export interface HeadingParts {
  title: string;
  // 区切りの後ろ。無ければ省く。
  sub?: string;
}

export interface DescriptionSubsection {
  id: string;
  heading: string;
  body: string;
}

export interface DescriptionSection {
  id: string;
  heading: string;
  // 最初のh3より前のhtml。
  body: string;
  subsections: DescriptionSubsection[];
}

export interface DescriptionParts {
  eyebrow: string;
  message: MessageParagraph[];
  sections: DescriptionSection[];
  // 参考文献の各項目のhtml。先頭の[n]は外す。
  refs: string[];
  // 下書きの見出し以降のhtml。無ければ空。
  rest: string;
}

const noteAside =
  /<aside\b[^>]*\bclass="[^"]*\bnote\b[^"]*"[^>]*>([\s\S]*?)<\/aside>/u;
const japanese = /[぀-ヿ㐀-鿿＀-￯]/u;

// 見出しを大見出しと小さい行に割る。区切りはコロンかダッシュ。
// 後ろが空ならコロンを落とし、日本語を含まない後ろ(Our System: One Directionなど)は割らない。
export function splitHeading(text: string): HeadingParts {
  const m = /^(.*?)\s*(?:[:：]|—)\s*(.*)$/u.exec(text);
  if (!m) {
    return { title: text };
  }
  if (m[2] === "") {
    return { title: m[1] };
  }
  if (japanese.test(m[2])) {
    return { title: m[1], sub: m[2] };
  }
  return { title: text };
}

function idOf(attrs: string): string {
  return /(?:^|\s)id="([^"]*)"/u.exec(attrs)?.[1] ?? "";
}

interface Heading {
  level: number;
  id: string;
  text: string;
  start: number;
  end: number;
}

function headings(html: string): Heading[] {
  return [...html.matchAll(/<h([23])\b([^>]*)>([\s\S]*?)<\/h\1>/gu)].map(
    (m) => ({
      level: Number(m[1]),
      id: idOf(m[2]),
      text: toText(m[3]),
      start: m.index,
      end: m.index + m[0].length,
    })
  );
}

function paragraphs(html: string): string[] {
  return [...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gu)].map((m) => m[1]);
}

function toMessage(inner: string): MessageParagraph {
  const m = /^\s*<strong>([\s\S]*)<\/strong>\s*$/u.exec(inner);
  return m ? { html: m[1], emphasis: true } : { html: inner, emphasis: false };
}

// h3とその本文に割る。h3より前のhtmlをbodyに返す。
function splitByH3(html: string): {
  body: string;
  subsections: DescriptionSubsection[];
} {
  const hs = headings(html).filter((h) => h.level === 3);
  if (hs.length === 0) {
    return { body: html, subsections: [] };
  }
  return {
    body: html.slice(0, hs[0].start),
    subsections: hs.map((h, i) => ({
      id: h.id,
      heading: h.text,
      body: html.slice(h.end, hs[i + 1]?.start ?? html.length),
    })),
  };
}

// 先頭からn個目の段落の終わりで割る。段落がn個に満たなければnull。
export function splitAfterParagraph(
  html: string,
  n: number
): [string, string] | null {
  let count = 0;
  for (const m of html.matchAll(/<\/p>/gu)) {
    count += 1;
    if (count === n) {
      const at = m.index + m[0].length;
      return [html.slice(0, at), html.slice(at)];
    }
  }
  return null;
}

// Descriptionの原稿htmlを、画面を組む単位に切り分ける。形が想定と違えばnull。
export function splitDescription(html: string): DescriptionParts | null {
  const note = noteAside.exec(html);
  if (!note) {
    return null;
  }
  const lead = html.slice(0, note.index);
  const eyebrow = headings(lead).find((h) => h.level === 2)?.text;
  const messageStart = /<h2\b[^>]*>[\s\S]*?<\/h2>/u.exec(note[1]);
  if (!eyebrow || !messageStart) {
    return null;
  }
  const message = paragraphs(
    note[1].slice(messageStart.index + messageStart[0].length)
  ).map(toMessage);

  const afterNote = html.slice(note.index + note[0].length);
  const h2s = headings(afterNote).filter((h) => h.level === 2);
  const draftAt = h2s.findIndex((h) => h.id.startsWith("下書き"));
  const main = draftAt === -1 ? h2s : h2s.slice(0, draftAt);
  const rest = draftAt === -1 ? "" : afterNote.slice(h2s[draftAt].start);
  const mainEnd = draftAt === -1 ? afterNote.length : h2s[draftAt].start;
  if (main.length === 0) {
    return null;
  }

  let refs: string[] = [];
  const sections = main.map((h, i) => {
    const inner = afterNote.slice(h.end, main[i + 1]?.start ?? mainEnd);
    const { body, subsections } = splitByH3(inner);
    const refAt = subsections.findIndex((s) => s.id === "参考文献");
    if (refAt === -1) {
      return { id: h.id, heading: h.text, body, subsections };
    }
    refs = paragraphs(subsections[refAt].body).map((p) =>
      p.replace(/^\s*\[\d+\]\s*/u, "").trim()
    );
    return {
      id: h.id,
      heading: h.text,
      body,
      subsections: subsections.filter((_, j) => j !== refAt),
    };
  });
  return { eyebrow, message, sections, refs, rest };
}

export interface ListCard {
  // liの先頭のstrongの文。
  heading: string;
  // strongの後ろの文。
  text: string;
}

export interface CardList {
  before: string;
  after: string;
  items: ListCard[];
}

// 最初のolを取り出し、liをstrongの見出しと残りの説明に割る。liがn件でなければnull。
export function splitCardList(html: string, count: number): CardList | null {
  const ol = /<ol\b[^>]*>([\s\S]*?)<\/ol>/u.exec(html);
  if (!ol) {
    return null;
  }
  const items = [...ol[1].matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gu)].map(
    (li) => {
      const strong = /^\s*<strong>([\s\S]*?)<\/strong>([\s\S]*)$/u.exec(li[1]);
      return strong
        ? { heading: toText(strong[1]), text: toText(strong[2]) }
        : null;
    }
  );
  if (items.length !== count || items.some((item) => !item)) {
    return null;
  }
  return {
    before: html.slice(0, ol.index),
    after: html.slice(ol.index + ol[0].length),
    items: items as ListCard[],
  };
}
