import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HomePage } from "./components/HomePage";
import type { Locale, WikiPage } from "./content";
import { pagePath, type Route } from "./routes";

const make = (slug: string, locale: Locale, extra: Partial<WikiPage> = {}): Route => {
  const page: WikiPage = {
    slug,
    locale,
    title: slug,
    html: "",
    subtitle: "",
    lead: "",
    order: Number.MAX_SAFE_INTEGER,
    islands: [],
    models: [],
    published: true,
    source: "notion",
    ...extra,
  };
  return { page, path: pagePath(page) };
};

const home = make("home", "en", { title: "Home", order: 0 });
const routes: Route[] = [
  home,
  make("model", "en", { title: "Model", order: 30, lead: "Model <a href=\"/x\">lead</a>" }),
  make("design", "en", { title: "Design", order: 20, subtitle: "設計" }),
  make("description", "en", { title: "Description", order: 10 }),
  make("model", "ja", { title: "モデル", order: 30 }),
  make("hidden", "en", { title: "Hidden", order: 5, published: false }),
];

const render = (page = home.page) => renderToStaticMarkup(<HomePage page={page} routes={routes} />);

describe("HomePage", () => {
  it("カードを現在のlocaleのorder順に並べ、home自身と非公開と別localeを除く", () => {
    const html = render();
    const titles = [...html.matchAll(/class="[^"]*cardTitle[^"]*">([^<]*)</g)].map((m) => m[1]);
    expect(titles).toEqual(["Description", "Design", "Model"]);
    expect(html).toContain('href="/design/"');
  });

  it("カードのleadにaを入れ子にしない", () => {
    expect(render()).toContain("Model lead");
    expect(render()).not.toContain('<a href="/x">');
  });

  it("htmlが空なら説明を出さず、あれば出す", () => {
    expect(render()).not.toContain("data-testid=\"home-description\"");
    const withBody = render({ ...home.page, html: "<p>本文</p>" });
    expect(withBody).toContain("data-testid=\"home-description\"");
    expect(withBody).toContain("<p>本文</p>");
  });

  it("ロゴ画像にaltがあり、h1はtitleを持つ", () => {
    const html = render();
    expect(html).toMatch(/<img[^>]*alt="One Direction"/);
    expect(html).toMatch(/<h1[^>]*>Home<\/h1>/);
  });
});
