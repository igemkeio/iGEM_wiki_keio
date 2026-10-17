import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { HomePage } from "./components/HomePage";
import type { WikiPage } from "./content";
import { NAV_CONFIG } from "./lib/navGroups";
import { pagePath } from "./routes";
import type { Route } from "./routes";

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
  dbtl: null,
  hp: null,
};

const pageOf = (slug: string, locale: "en" | "ja" = "en"): WikiPage => ({
  ...home,
  slug,
  locale,
});
const routes: Route[] = ["description", "experiments", "model", "members"].map(
  (slug) => {
    const page = pageOf(slug);
    return { page, path: pagePath(page) };
  }
);

const render = (page = home, list = routes) =>
  renderToStaticMarkup(<HomePage page={page} routes={list} />);

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
    expect(html.match(/<figure /gu)).toHaveLength(11);
    expect(html).toContain("Figure 6 (placeholder)");
    expect(html).toContain("ENERGY");
    expect(html).toContain("ONE DIRECTION");
    expect(html).toContain("Giving direction to cellular system");
  });

  it("各ページへの入口を、ページのある分類だけ分類の先頭ページへ張る", () => {
    const html = render();
    const doors = [
      ...html.matchAll(/<a class="[^"]*" href="([^"]*)"><b>(.*?)<\/b>/gu),
    ].map((m) => [m[2], m[1]]);
    expect(doors).toStrictEqual([
      ["Project", "/description/"],
      ["Wet Lab", "/experiments/"],
      ["Dry Lab", "/model/"],
      ["Team", "/members/"],
    ]);
  });

  it("分類のすべてに入口と説明文がある", () => {
    const all = NAV_CONFIG.categories.map((c) => {
      const page = pageOf(c.slugs[0]);
      return { page, path: pagePath(page) };
    });
    const html = render(home, all);
    const texts = [
      ...html.matchAll(
        /<a class="[^"]*" href="[^"]*"><b>.*?<\/b><span>(.*?)<\/span>/gu
      ),
    ].map((m) => m[1]);
    expect(texts).toHaveLength(NAV_CONFIG.categories.length);
    expect(texts.every((t) => t.length > 0)).toBe(true);
  });

  it("入口は表示中の言語のページへ張る", () => {
    const ja = [
      ...routes,
      ...["description"].map((slug) => {
        const page = pageOf(slug, "ja");
        return { page, path: pagePath(page) };
      }),
    ];
    const html = render({ ...home, locale: "ja" }, ja);
    expect(html).toContain('href="/ja/description/"');
    expect(html).not.toContain('href="/model/"');
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
