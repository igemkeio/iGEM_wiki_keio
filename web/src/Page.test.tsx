// @vitest-environment happy-dom
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { WikiPage } from "./content";
import { Page } from "./Page";

const base: WikiPage = {
  slug: "members",
  locale: "en",
  title: "Members",
  subtitle: "",
  lead: "",
  html: "<h2 id=\"a\">A</h2>",
  order: 1,
  islands: [],
  models: [],
  published: true,
};
const assets = { css: [], js: "assets/index.js" };
const render = (page: WikiPage) =>
  renderToStaticMarkup(<Page page={page} routes={[{ page, path: "/members/" }] as never} assets={assets} />);

describe("Page", () => {
  it("島の無いページにはscriptを出さない", () => {
    expect(render(base)).not.toContain("<script");
  });

  it("島のあるページにはmodule scriptを1本と器を出す", () => {
    const html = render({ ...base, islands: ["member-list"] });
    expect(html.match(/<script type="module"/g)).toHaveLength(1);
    expect(html).toContain('data-island="member-list"');
  });
});
