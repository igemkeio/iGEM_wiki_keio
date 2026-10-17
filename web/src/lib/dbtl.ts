import type { Dbtl, DbtlCycle, Locale } from "../content";

export const PHASES = ["design", "build", "test", "learn"] as const;

export type Phase = (typeof PHASES)[number];

// 画面に出す固定の文言。原稿に無いものはここで持つ。
export const DBTL_TEXT = {
  ja: {
    layer: { base: "基盤", design: "設計" },
    cycle: (mark: string) => `サイクル${mark}`,
    iteration: "ITERATION",
    aim: "狙い",
    reached: "到達",
    hypothesis: "仮説",
    criteria: "成功基準",
    prevLearn: "前回の学び",
    readFrom: "DESIGN から読む",
    complete: "COMPLETE",
    nextIteration: (no: number) => `次: 反復 ${no} の DESIGN へ`,
    cycleComplete: "このサイクルは以上",
    outcomes: "このサイクルで確立したこと",
    handoff: "次のサイクルへ",
    toolsGained: "TOOLS GAINED",
    using: "USING",
    prev: "前へ",
    next: "次へ",
    stage: "DBTLサイクルの読み進め",
    box: "DBTLのサイクルの本文",
    figureAlt: "記号化した細胞1個。設計サイクルの3か所を選べる",
    tools: { 1: "作る", 2: "見る", 3: "数える" },
  },
  en: {
    layer: { base: "Foundation", design: "Design" },
    cycle: (mark: string) => `Cycle ${mark}`,
    iteration: "ITERATION",
    aim: "Aim",
    reached: "Result",
    hypothesis: "Hypothesis",
    criteria: "Success criteria",
    prevLearn: "Previous learn",
    readFrom: "Start from DESIGN",
    complete: "COMPLETE",
    nextIteration: (no: number) => `Next: DESIGN of iteration ${no}`,
    cycleComplete: "End of this cycle",
    outcomes: "What this cycle established",
    handoff: "To the next cycle",
    toolsGained: "TOOLS GAINED",
    using: "USING",
    prev: "Previous",
    next: "Next",
    stage: "DBTL cycle reader",
    box: "DBTL cycle text",
    figureAlt: "A symbolized cell. Three spots select the design cycles",
    tools: { 1: "Build", 2: "Observe", 3: "Count" },
  },
} as const;

export const dbtlText = (locale: Locale) => DBTL_TEXT[locale];

const MARKS = ["①", "②", "③", "④", "⑤", "⑥"] as const;

// 絵の部分の名前。CellFigureのグループと対応する。
export type FigurePart = "poles" | "adhesion" | "coil";

// サイクル番号で引く、原稿に無い対応。表に無い番号は道具も絵の部分も持たない。
export const CYCLE_META: Record<
  number,
  { tool?: 1 | 2 | 3; uses?: number[]; part?: FigurePart }
> = {
  1: { tool: 1 },
  2: { tool: 2 },
  3: { tool: 3 },
  4: { uses: [1, 2, 3], part: "poles" },
  5: { uses: [1], part: "adhesion" },
  6: { uses: [1, 2, 3], part: "coil" },
};

// 基盤サイクルの道具。番号順に並べる。
export const TOOL_CYCLES = [1, 2, 3] as const;

export const cycleMark = (no: number) => MARKS[no - 1] ?? String(no);

export const cycleUses = (no: number) => CYCLE_META[no]?.uses ?? [];

export const figurePartOf = (no: number) => CYCLE_META[no]?.part;

// 島に渡す、サイクルの軽い要約。本文のHTMLは載せない。
export interface CycleSummary {
  no: number;
  layer: DbtlCycle["layer"];
  title: string;
  tagline: string;
  iterations: { no: number; title: string }[];
}

export const toSummary = (cycle: DbtlCycle): CycleSummary => ({
  no: cycle.no,
  layer: cycle.layer,
  title: cycle.title,
  tagline: cycle.tagline,
  iterations: cycle.iterations.map(({ no, title }) => ({ no, title })),
});

// 箱の中の節。キー操作と矢印ボタンはこの列を1つずつ移る。
export type Stop =
  | { kind: "intro"; cycle: number }
  | { kind: "focus"; cycle: number; iter: number }
  | { kind: "phase"; cycle: number; iter: number; phase: number }
  | { kind: "lap"; cycle: number; iter: number }
  | { kind: "outcomes"; cycle: number }
  | { kind: "handoff"; cycle: number };

// 箱の中のdata-dbtl-stopと同じ順で節を並べる。描画と島はどちらもこの関数を通す。
export function buildStops(cycles: CycleSummary[]): Stop[] {
  return cycles.flatMap((cycle) => {
    const { no } = cycle;
    return [
      { kind: "intro", cycle: no } as Stop,
      ...cycle.iterations.flatMap((_, iter) => [
        { kind: "focus", cycle: no, iter } as Stop,
        ...PHASES.map(
          (_phase, index) =>
            ({ kind: "phase", cycle: no, iter, phase: index }) as Stop
        ),
        { kind: "lap", cycle: no, iter } as Stop,
      ]),
      { kind: "outcomes", cycle: no } as Stop,
      { kind: "handoff", cycle: no } as Stop,
    ];
  });
}

// サイクル番号ごとの、読み終えたとみなす節の位置(最後の反復の区切り)。
export function doneAtOf(stops: Stop[]): Record<number, number> {
  const at: Record<number, number> = {};
  for (const [index, stop] of stops.entries()) {
    if (stop.kind === "lap") {
      at[stop.cycle] = index;
    }
  }
  return at;
}

export const allCycles = (dbtl: Dbtl): DbtlCycle[] =>
  dbtl.parts.flatMap((part) => part.cycles);

// introの先頭にあるh2のうち、ページの題と重複するものだけを落とす。別の見出しなら残す。
export function stripLeadingHeading(html: string, title: string): string {
  const found = /^\s*<h2\b[^>]*>([\s\S]*?)<\/h2>\s*/u.exec(html);
  if (!found) {
    return html;
  }
  const text = found[1].replaceAll(/<[^>]*>/gu, "").trim();
  return text === title.trim() || text === "Engineering"
    ? html.slice(found[0].length)
    : html;
}
