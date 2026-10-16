import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { readPage } from "../content";
import { allCycles, buildStops, toSummary } from "../lib/dbtl";
import { dbtlFixture } from "../test/fixtures/dbtl";
import { DbtlPage } from "./DbtlPage";

const page = readPage({
  slug: "engineering",
  locale: "ja",
  title: "エンジニアリング成功",
  html: "<h2>Engineering</h2>",
  lead: "リード",
  dbtl: dbtlFixture,
});

const doc = new DOMParser().parseFromString(
  renderToStaticMarkup(<DbtlPage page={page} dbtl={dbtlFixture} />),
  "text/html"
);

describe(DbtlPage, () => {
  it("h1はページの題で、introの先頭のh2は出さない", () => {
    expect(doc.querySelectorAll("h1")).toHaveLength(1);
    expect(doc.querySelector("h1")?.textContent).toBe("エンジニアリング成功");
    expect(doc.body.textContent).not.toContain("Engineering");
    expect(doc.body.textContent).toContain("このページの読み方。");
  });

  it("箱の中の節は、buildStopsと同じ数だけ同じ順に並ぶ", () => {
    const stops = buildStops(allCycles(dbtlFixture).map(toSummary));
    const found = doc.querySelectorAll("#dbtl-box [data-dbtl-stop]");
    expect(found).toHaveLength(stops.length);
    expect(found[0].id).toBe("dbtl-cycle-1");
  });

  it("6サイクル分の本文をすべて出す", () => {
    const text = doc.querySelector("#dbtl-box")?.textContent ?? "";
    for (const cycle of allCycles(dbtlFixture)) {
      expect(text).toContain(cycle.title);
      expect(text).toContain(`サイクル${cycle.no}で確立したこと。`);
      for (const iteration of cycle.iterations) {
        expect(text).toContain(`反復${iteration.no}のLearn。`);
      }
    }
  });

  it("leadHtmlは導入より前に、目立つ形で出す", () => {
    const intro = doc.querySelector("#dbtl-cycle-5");
    expect(intro?.textContent).toContain("✓ エンジニアリングの達成");
    const html = intro?.innerHTML ?? "";
    expect(html.indexOf("エンジニアリングの達成")).toBeLessThan(
      html.indexOf("サイクル5の導入。")
    );
  });

  it("2回目以降の反復のDESIGNに、前の反復の学びを引用する", () => {
    expect(doc.body.textContent).toContain("前回の学び");
  });

  it("島には、JSが無いときの中身とサイクルの要約を入れる", () => {
    const island = doc.querySelector('[data-island="dbtl-stage"]');
    expect(island?.textContent).toContain("クローニング");
    const props = JSON.parse(
      (island as HTMLElement | null)?.dataset.props ?? "{}"
    );
    expect(props.locale).toBe("ja");
    expect(props.cycles).toHaveLength(6);
    expect(props.cycles[0].whyHtml).toBeUndefined();
  });

  it("左の目次は出さない", () => {
    expect(doc.querySelector('nav[aria-label="目次"]')).toBeNull();
  });
});
