import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { WikiPage } from "./content";
import { Page } from "./Page";
import { pagePath, type Route } from "./routes";

const base: WikiPage = {
  slug: "home",
  locale: "en",
  title: "Home",
  html: "",
  subtitle: "",
  lead: "",
  order: 0,
  islands: [],
  published: true,
};
const assets = { css: ["assets/index.css"], js: "assets/index.js" };
const route = (page: WikiPage): Route => ({ page, path: pagePath(page) });

describe("Page", () => {
  it("slugがhomeならヒーローとContentsを描き、本文ページの型は使わない", () => {
    const model = { ...base, slug: "model", title: "Model", order: 30 };
    const html = renderToStaticMarkup(<Page page={base} routes={[route(base), route(model)]} assets={assets} />);
    expect(html).toContain("one-direction.svg");
    expect(html).toContain("Contents");
    expect(html).not.toContain("<script");
  });

  it("homeでなければHomePageを使わない", () => {
    const model = { ...base, slug: "model", title: "Model", html: "<h2 id=\"a\">A</h2>" };
    const html = renderToStaticMarkup(<Page page={model} routes={[route(base), route(model)]} assets={assets} />);
    expect(html).not.toContain("one-direction.svg");
  });
});
