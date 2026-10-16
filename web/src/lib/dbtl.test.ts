import { describe, expect, it } from "vitest";

import { dbtlFixture } from "../test/fixtures/dbtl";
import {
  allCycles,
  buildStops,
  cycleMark,
  cycleUses,
  dbtlText,
  doneAtOf,
  figurePartOf,
  stripLeadingHeading,
  toSummary,
} from "./dbtl";

const summaries = allCycles(dbtlFixture).map(toSummary);

describe(buildStops, () => {
  it("1サイクルは 導入 + 反復ごとの6節 + まとめ + 受け渡し", () => {
    const stops = buildStops(summaries.slice(0, 1));
    expect(stops).toHaveLength(1 + 4 * 6 + 2);
    expect(stops.map((s) => s.kind).slice(0, 8)).toStrictEqual([
      "intro",
      "focus",
      "phase",
      "phase",
      "phase",
      "phase",
      "lap",
      "focus",
    ]);
    expect(stops.at(-2)?.kind).toBe("outcomes");
    expect(stops.at(-1)?.kind).toBe("handoff");
  });

  it("6サイクル分を順に並べる", () => {
    const stops = buildStops(summaries);
    expect(stops).toHaveLength(27 * 3 + 33 * 2 + 9);
    expect([...new Set(stops.map((s) => s.cycle))]).toStrictEqual([
      1, 2, 3, 4, 5, 6,
    ]);
  });

  it("サイクルが無ければ節も無い", () => {
    expect(buildStops([])).toStrictEqual([]);
  });
});

describe(doneAtOf, () => {
  it("サイクルごとに、最後の反復の区切りの位置を返す", () => {
    const stops = buildStops(summaries);
    const at = doneAtOf(stops);
    expect(stops[at[1]]).toStrictEqual({ kind: "lap", cycle: 1, iter: 3 });
    expect(stops[at[6]]).toStrictEqual({ kind: "lap", cycle: 6, iter: 0 });
  });
});

describe(stripLeadingHeading, () => {
  it("先頭のh2を落とす", () => {
    expect(stripLeadingHeading(dbtlFixture.intro)).toBe(
      "<p>このページの読み方。</p>"
    );
  });

  it("先頭がh2でなければ何も変えない", () => {
    expect(stripLeadingHeading("<p>本文</p><h2>節</h2>")).toBe(
      "<p>本文</p><h2>節</h2>"
    );
  });
});

describe("サイクル番号で引く表", () => {
  it("記号は①から⑥、表に無い番号は数字のまま", () => {
    expect(cycleMark(1)).toBe("①");
    expect(cycleMark(6)).toBe("⑥");
    expect(cycleMark(7)).toBe("7");
  });

  it("設計サイクルが使う基盤と、絵の部分", () => {
    expect(cycleUses(4)).toStrictEqual([1, 2, 3]);
    expect(cycleUses(5)).toStrictEqual([1]);
    expect(cycleUses(7)).toStrictEqual([]);
    expect(figurePartOf(4)).toBe("poles");
    expect(figurePartOf(5)).toBe("adhesion");
    expect(figurePartOf(6)).toBe("coil");
    expect(figurePartOf(1)).toBeUndefined();
  });
});

describe(toSummary, () => {
  it("本文のHTMLを落とし、反復は番号と題だけにする", () => {
    const summary = toSummary(allCycles(dbtlFixture)[4]);
    expect(Object.keys(summary)).toStrictEqual([
      "no",
      "layer",
      "title",
      "tagline",
      "iterations",
    ]);
    expect(summary.iterations[0]).toStrictEqual({
      no: 1,
      title: "サイクル5の反復1",
    });
  });
});

describe(dbtlText, () => {
  it("localeごとに固定の文言を返す", () => {
    expect(dbtlText("ja").toolsGained).toBe("TOOLS GAINED");
    expect(dbtlText("ja").layer.base).toBe("基盤");
    expect(dbtlText("en").layer.base).toBe("Foundation");
  });
});
