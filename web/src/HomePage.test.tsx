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

describe(HomePage, () => {
  it("Contentsの節を出さない", () => {
    const html = render();
    expect(html).not.toContain("Contents");
    expect(html).not.toContain("<h2");
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
