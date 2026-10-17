import type { HpInterview } from "../content";
// Human Practicesの画面で使う、原稿の外にある値と、4章の分割。
import interviewMeta from "../data/hp-interviews.json";
import usePivots from "../data/hp-uses.json";

export type InterviewKind = "inperson" | "mail" | "planned";

export interface InterviewWhen {
  date: string;
  kind: InterviewKind;
  times?: number;
}

export interface UsePivot {
  subtitle?: string;
  before: string;
  after: string;
  when: string;
}

const KIND_LABEL: Record<InterviewKind, string> = {
  inperson: "対面・Zoom",
  mail: "メール回答",
  planned: "実施予定",
};

// 面談の番号から日付と聞き方を引く。無ければnull。
export function whenOf(no: string): InterviewWhen | null {
  const table = interviewMeta as Record<string, InterviewWhen>;
  return table[no] ?? null;
}

export function kindLabel({ kind, times }: InterviewWhen): string {
  return times && times > 1
    ? `${KIND_LABEL[kind]}／${times}回`
    : KIND_LABEL[kind];
}

// 用途の番号から、聞く前と聞いたあとを引く。無ければnull。
export function pivotOf(no: string): UsePivot | null {
  const table: Record<string, UsePivot> = usePivots;
  return table[no] ?? null;
}

const USE_COLORS: Record<string, string> = {
  "2.1": "var(--color-use-bandage)",
  "2.2": "var(--color-use-wire)",
  "2.3": "var(--color-use-cascade)",
};

export const colorOfUse = (no: string): string =>
  USE_COLORS[no] ?? "var(--color-muted)";

// 面談の番号(2.1.Aなど)や章の番号からid属性を作る。
export const anchorId = (no: string): string =>
  `hp-${no.replaceAll(".", "-").toLowerCase()}`;

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&nbsp;": " ",
};

// タグと太字の残骸の**を除いたテキスト。
export function textOf(html: string): string {
  return html
    .replaceAll(/<[^>]*>/gu, "")
    .replaceAll(
      /&(?:amp|lt|gt|quot|nbsp|#39);/gu,
      (entity) => ENTITIES[entity] ?? entity
    )
    .replaceAll("**", "")
    .replaceAll(/\s+/gu, " ")
    .trim();
}

// 本文が空か、XXXと省略記号だけなら、まだ書かれていない。
export function isPlaceholder(html: string): boolean {
  return /^[Xx×\s.…・]*$/u.test(textOf(html));
}

// 仮の枠にする面談: 題にXXXが残る、目的とTake homeが無い、まだ実施していない。
export function isTentative(
  interview: HpInterview,
  when: InterviewWhen | null
): boolean {
  return (
    interview.draft === true ||
    (isPlaceholder(interview.purposeHtml) &&
      isPlaceholder(interview.takeHomeHtml)) ||
    when?.kind === "planned"
  );
}

export interface Chapter4Card {
  no: string;
  title: string;
  html: string;
  // 見出し直下に小見出しが続くときは、カードではなく小見出しの行にする。
  group: boolean;
  // 本文が長いカードは、2列に並べず1行を使う。
  long: boolean;
}

export interface Chapter4 {
  leadHtml: string;
  cards: Chapter4Card[];
}

const LONG_CARD = 400;
const HEADING = /<(h[23])\b[^>]*>([\s\S]*?)<\/\1>/giu;
const NUMBERED = /^(\d+(?:\.\d+)*(?:\.[A-Za-z])?)\s*(.*)$/u;

// 4章のhtmlを、見出し(h2、h3)の位置で分ける。見出しが1つも無ければnull。
export function splitChapter4(html: string): Chapter4 | null {
  const heads = [...html.matchAll(HEADING)];
  if (heads.length === 0) {
    return null;
  }
  const cards = heads.map((head, i) => {
    const next = heads[i + 1];
    const text = textOf(head[2]);
    const match = NUMBERED.exec(text);
    const end = next?.index ?? html.length;
    const body = html.slice(head.index + head[0].length, end).trim();
    return {
      no: match?.[1] ?? "",
      title: match ? match[2] : text,
      html: body,
      long: textOf(body).length > LONG_CARD,
      group: head[1].toLowerCase() === "h2" && next?.[1].toLowerCase() === "h3",
    };
  });
  return { leadHtml: html.slice(0, heads[0].index).trim(), cards };
}
