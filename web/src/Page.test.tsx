import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { readPage } from "./content";
import { Page } from "./Page";
import { pagePath } from "./routes";
import type { Route } from "./routes";

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
  slug: "members",
  locale: "en",
  title: "Members",
  html: "<h2>Section</h2>",
  islands: ["member-list"],
});
// 対応表に無い島の名前だけのページ。器も script も出ない。
const withUnknownIsland = readPage({
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
  renderToStaticMarkup(
    <Page page={p} routes={routesFor(en, ja)} assets={assets} />
  );
const parse = (html: string) =>
  new DOMParser().parseFromString(html, "text/html");
const scripts = (doc: Document) =>
  doc.querySelectorAll('script[type="module"]');

describe(Page, () => {
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
    const doc = parse(html);
    const found = scripts(doc);
    expect(found).toHaveLength(1);
    expect(found[0].getAttribute("src")).toBe("/assets/index-abc.js");
    expect(doc.querySelector('[data-island="member-list"]')).not.toBeNull();
  });

  it("島の有無によらず、フッター用のscriptを1本だけ入れる", () => {
    for (const p of [en, withIsland, withUnknownIsland]) {
      const found = parse(render(p)).querySelectorAll(
        'script[src$="/footer-sponsors.js"]'
      );
      expect(found).toHaveLength(1);
      expect(found[0]).toHaveAttribute("defer");
    }
  });

  it("対応表に無い島の名前だけならscriptも器も出さない", () => {
    const doc = parse(render(withUnknownIsland));
    expect(scripts(doc)).toHaveLength(0);
    expect(doc.querySelector("[data-island]")).toBeNull();
  });
});

describe("Home", () => {
  const home = readPage({
    slug: "home",
    locale: "en",
    title: "Home",
    html: "",
    order: 0,
  });
  const model = readPage({
    slug: "model",
    locale: "en",
    title: "Model",
    html: '<h2 id="a">A</h2>',
    order: 30,
  });

  it("slugがhomeならヒーローを描き、本文ページの型は使わない", () => {
    const html = renderToStaticMarkup(
      <Page page={home} routes={routesFor(home, model)} assets={assets} />
    );
    expect(html).toContain("one-direction.png");
    expect(html).toContain("<picture");
    expect(html).toContain("hero-ukiyoe.webp");
    expect(html).not.toContain("Contents");
    expect(scripts(parse(html))).toHaveLength(0);
  });

  it("homeでなければHomePageを使わない", () => {
    const html = renderToStaticMarkup(
      <Page page={model} routes={routesFor(home, model)} assets={assets} />
    );
    expect(html).not.toContain("one-direction.png");
    expect(html).not.toContain("hero-ukiyoe");
  });
});

const found = (doc: Document) =>
  doc.querySelectorAll("script[data-palette-switcher]");

describe("パレット切り替え", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("環境変数がなければscriptを出さない", () => {
    expect(found(parse(render(en)))).toHaveLength(0);
  });

  it("WIKI_PALETTE_SWITCHERが1ならスタイルシートより前にscriptを1本出す", () => {
    vi.stubEnv("WIKI_PALETTE_SWITCHER", "1");
    const html = render(en);
    const list = found(parse(html));
    expect(list).toHaveLength(1);
    expect(list[0].hasAttribute("src")).toBe(false);
    expect(list[0].textContent).toContain("wiki:palette");
    expect(list[0].parentElement?.tagName).toBe("HEAD");
    expect(html.indexOf("data-palette-switcher")).toBeLessThan(
      html.indexOf('rel="stylesheet"')
    );
  });

  it("1以外の値では出さない", () => {
    vi.stubEnv("WIKI_PALETTE_SWITCHER", "0");
    expect(found(parse(render(en)))).toHaveLength(0);
  });
});

const h3 = (n: number) =>
  `<h3 id="h${n}">Step ${n}. A — あ</h3><p>本文${n}</p>`;
const description = (locale: "en" | "ja", html: string) =>
  readPage({ slug: "description", locale, title: "D", html });

describe("Descriptionの出し分け", () => {
  const sections = [
    '<h2 id="s1">Introduction: 秩序</h2><p>本文</p>',
    '<h2 id="s2">Engineering — 細胞</h2><p>本文</p>',
    `<h2 id="s3">Our System: One Direction</h2><p>本文</p>${h3(1)}${h3(2)}${h3(3)}`,
    `<h2 id="s4">Applications — 応用</h2><p>本文</p>${h3(4)}${h3(5)}${h3(6)}`,
    '<h2 id="s5">Conclusion:</h2><p>本文</p>',
  ].join("");
  const body = [
    '<h2 id="project-description">Project Description</h2>',
    '<aside class="note"><h2 id="message">Message</h2><p>一</p></aside>',
    sections,
  ].join("");

  it("jaは専用の部品で出す", () => {
    const doc = parse(render(description("ja", body)));
    expect(doc.querySelector("h1")?.textContent).toBe("ONE DIRECTION");
    expect(doc.querySelector("#s3")?.textContent).toBe(
      "Our System: One Direction"
    );
  });

  it("enはArticlePageのまま", () => {
    const doc = parse(render(description("en", body)));
    expect(doc.querySelector("h1")?.textContent).toBe("D");
  });

  it("jaでも節の形が想定と違えばArticlePageで出す", () => {
    const doc = parse(render(description("ja", "<h2>x</h2><p>y</p>")));
    expect(doc.querySelector("h1")?.textContent).toBe("D");
  });
});
