import { describe, expect, it } from "vitest";

import interviews from "../data/hp-interviews.json";
import { isPlaceholder, kindLabel, splitChapter4, whenOf } from "./hp";

describe("hp-interviews.json", () => {
  it("面談14件に、日付と聞き方がある", () => {
    const entries = Object.entries(interviews);
    expect(entries).toHaveLength(14);
    for (const [, value] of entries) {
      expect(value.date).not.toBe("");
      expect(["inperson", "mail", "planned"]).toContain(value.kind);
    }
  });
});

describe("whenOf と kindLabel", () => {
  it("番号から引き、聞き方を文字にする", () => {
    expect(kindLabel(whenOf("1.3")!)).toBe("メール回答");
    expect(kindLabel(whenOf("2.1.C")!)).toBe("対面・Zoom／2回");
    expect(kindLabel(whenOf("2.1.D")!)).toBe("実施予定");
    expect(whenOf("9.9")).toBeNull();
  });
});

describe("未記入の判定", () => {
  it("空とXXXだけを未記入とみなす", () => {
    expect(isPlaceholder("")).toBe(true);
    expect(isPlaceholder("<p>XXX</p>")).toBe(true);
    expect(isPlaceholder("<p>XXX…</p>")).toBe(true);
    expect(isPlaceholder("<p>結論です</p>")).toBe(false);
  });
});

describe("4章の分割", () => {
  const parts = splitChapter4(
    '<p>前置き</p><h2 id="a">4.1　価値</h2><p>本文</p><h2>4.2　課題</h2><p>導入</p><h3>4.2.A　強度</h3><p>強度</p>'
  );

  it("見出しごとにカードにし、小見出しが続くh2は行にする", () => {
    expect(parts?.leadHtml).toBe("<p>前置き</p>");
    expect(parts?.cards.map((c) => [c.no, c.title, c.group])).toStrictEqual([
      ["4.1", "価値", false],
      ["4.2", "課題", true],
      ["4.2.A", "強度", false],
    ]);
    expect(parts?.cards[2].html).toBe("<p>強度</p>");
  });

  it("見出しが無ければnull", () => {
    expect(splitChapter4("<p>本文だけ</p>")).toBeNull();
  });
});
