import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { readPage } from "./content";
import { Page } from "./Page";

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

const render = (p: typeof en) => renderToStaticMarkup(<Page page={p} assets={assets} />);

describe("Page", () => {
  it("enのページ", () => {
    const html = render(en);
    expect(html).toMatchSnapshot();
    expect(html).toContain('<html lang="en">');
    expect(html).toContain("<title>Model | iGEM Keio 2026</title>");
    expect(html).toContain("<h1>Model</h1>");
    expect(html).not.toContain("<script");
  });

  it("jaのページ", () => {
    const html = render(ja);
    expect(html).toMatchSnapshot();
    expect(html).toContain('<html lang="ja">');
    expect(html).toContain("<title>モデル | iGEM Keio 2026</title>");
    expect(html).toContain("<h1>モデル</h1>");
    expect(html).not.toContain("<script");
  });

  it("islandsがあるページだけscriptを入れる", () => {
    const html = render(withIsland);
    expect(html).toMatchSnapshot();
    expect(html).toContain('<script type="module" src="/assets/index-abc.js">');
  });
});
