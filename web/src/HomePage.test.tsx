import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { HomePage } from "./components/HomePage";
import type { WikiPage } from "./content";

const home: WikiPage = {
  slug: "home",
  locale: "en",
  title: "Home",
  html: "",
  subtitle: "",
  lead: "",
  order: 0,
  islands: [],
  models: [],
  published: true,
  source: "notion",
};

const render = (page = home) => renderToStaticMarkup(<HomePage page={page} />);

const expectedSentences = [
  "Individually, we may be weak. But together, we become stronger.",
  "The more diverse a collective is, the more challenges it can overcome.",
  "But what happens when everyone is moving in a different direction?",
  "In cellular systems, disorganized collectives can become dangerous, as seen in cancer.",
  "Order begins with direction. What we need is a way to bring order to the collective.",
  "We propose a mechanism that uses synthetic biology to organize and align engineered materials and molecular robots into structured assemblies.",
  "A new dimension in cellular engineering",
  "One platform. Infinite possibilities.",
];

describe(HomePage, () => {
  it("Contentsの節を出さない", () => {
    const html = render();
    expect(html).not.toContain("Contents");
  });

  it("ヒーローの後ろに8枚のスライドを順に出す", () => {
    const html = render();
    expect(html.match(/data-testid="home-slide"/gu)).toHaveLength(8);
    const sentences = [...html.matchAll(/<h2[^>]*>(.*?)<\/h2>/gu)].map(
      (m) => m[1]
    );
    expect(sentences).toStrictEqual(expectedSentences);
    expect(html.indexOf("</section>")).toBeLessThan(
      html.indexOf('data-testid="home-slide"')
    );
  });

  it("ja のHomeにも同じ英語のスライドを出す", () => {
    const html = render({ ...home, locale: "ja" });
    const sentences = [...html.matchAll(/<h2[^>]*>(.*?)<\/h2>/gu)].map(
      (m) => m[1]
    );
    expect(sentences).toStrictEqual(expectedSentences);
  });

  it("図の数が0から3のスライドを出し、仮の枠に見出しを付ける", () => {
    const html = render();
    expect(html.match(/<figure /gu)).toHaveLength(12);
    expect(html).toContain("Figure 6 (placeholder)");
    expect(html).toContain("ENERGY");
    expect(html).toContain("ONE DIRECTION");
    expect(html).toContain("Giving direction to cellular system");
  });

  it("htmlが空なら説明を出さず、あれば出す", () => {
    expect(render()).not.toContain('data-testid="home-description"');
    const withBody = render({ ...home, html: "<p>本文</p>" });
    expect(withBody).toContain('data-testid="home-description"');
    expect(withBody).toContain("<p>本文</p>");
  });

  it("ヒーローのイラストを空altのpictureで出し、1600px版をsourceに置く", () => {
    const html = render();
    expect(html).toMatch(
      /<picture[^>]*><source media="\(max-width: 1600px\)" srcSet="[^"]*hero-ukiyoe-1600\.webp"\/><img src="[^"]*hero-ukiyoe\.webp" alt=""/u
    );
  });

  it("ロゴ画像にaltがあり、h1はtitleを持つ", () => {
    const html = render();
    expect(html).toMatch(/<img[^>]*alt="One Direction"/u);
    expect(html).toMatch(/<h1[^>]*>Home<\/h1>/u);
  });
});
