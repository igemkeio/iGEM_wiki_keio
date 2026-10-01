import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { readPage } from "./content";
import { Page } from "./Page";
import { pagePath, type Route } from "./routes";

const assets = { css: ["assets/index-abc.css"], js: "assets/index-abc.js" };

const en = readPage({
  slug: "model",
  locale: "en",
  title: "Model",
  subtitle: "Sub",
  lead: "Lead",
  html: "<h2>Section</h2>",
});
const ja = readPage({
  slug: "model",
  locale: "ja",
  title: "モデル",
  subtitle: "サブ",
  lead: "リード",
  html: "<h2>節</h2>",
});
const withIsland = readPage({
  slug: "model",
  locale: "en",
  title: "Model",
  html: "<h2>Section</h2>",
  islands: ["x"],
});

// ナビに出す一覧はテストごとに固定し、content/ の実データに依存させない。
const routesFor = (...pages: (typeof en)[]): Route[] =>
  pages.map((page) => ({ page, path: pagePath(page) }));
const render = (p: typeof en) =>
  renderToStaticMarkup(<Page page={p} routes={routesFor(en, ja)} assets={assets} />);
const parse = (html: string) => new DOMParser().parseFromString(html, "text/html");
const scripts = (doc: Document) => doc.querySelectorAll('script[type="module"]');

describe("Page", () => {
  it("enのページ", () => {
    const html = render(en);
    expect(html).toMatchSnapshot();
    const doc = parse(html);
    expect(doc.documentElement.lang).toBe("en");
    expect(doc.title).toBe("Model | iGEM Keio 2026");
    expect(doc.querySelector("h1")?.textContent).toBe("Model");
    expect(scripts(doc)).toHaveLength(0);
  });

  it("jaのページ", () => {
    const html = render(ja);
    expect(html).toMatchSnapshot();
    const doc = parse(html);
    expect(doc.documentElement.lang).toBe("ja");
    expect(doc.title).toBe("モデル | iGEM Keio 2026");
    expect(doc.querySelector("h1")?.textContent).toBe("モデル");
    expect(scripts(doc)).toHaveLength(0);
  });

  it("islandsがあるページだけscriptを入れる", () => {
    const html = render(withIsland);
    expect(html).toMatchSnapshot();
    const found = scripts(parse(html));
    expect(found.length).toBeGreaterThanOrEqual(1);
    expect(found[0].getAttribute("src")).toBe("/assets/index-abc.js");
  });
});
