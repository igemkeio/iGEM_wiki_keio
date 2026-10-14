import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { readPage } from "../content";
import { pagePath } from "../routes";
import type { Route } from "../routes";
import { alternatePath, EcoliNav } from "./EcoliNav";

const pageOf = (slug: string, locale: "en" | "ja" = "en") =>
  readPage({ slug, locale, title: slug, html: "", order: 1 });
const slugsEn = [
  "home",
  "description",
  "design",
  "experiments",
  "results",
  "model",
  "software",
  "human-practices",
  "members",
];
const routes: Route[] = ["en", "ja"].flatMap((locale) =>
  slugsEn.map((slug) => {
    const page = pageOf(slug, locale as "en" | "ja");
    return { page, path: pagePath(page) };
  })
);

const categoryNav = (name = "Category") =>
  screen.getByRole("navigation", { name });
// 分類の大腸菌のリンク(パネルの中のリンクは含まない)
const cells = (name?: string) =>
  within(categoryNav(name))
    .getAllByRole("link")
    .filter((a) => a.closest("ul") === null);
const link = (name: string) =>
  cells().find((a) => a.textContent === name) as HTMLElement;

afterEach(cleanup);

describe(EcoliNav, () => {
  it("5分類が並び、リンク先は分類の先頭のページ", () => {
    render(<EcoliNav page={pageOf("results")} routes={routes} />);
    const links = cells();
    expect(links.map((a) => a.textContent)).toStrictEqual([
      "Project",
      "Wet Lab",
      "Dry Lab",
      "Human Practices",
      "Team",
    ]);
    expect(links.map((a) => a.getAttribute("href"))).toStrictEqual([
      "/description/",
      "/experiments/",
      "/model/",
      "/human-practices/",
      "/members/",
    ]);
  });

  it("リンク先は対応表の順で先頭の公開ページで、無いslugは飛ばす", () => {
    // orderが逆でも、対応表のdescription、designの順に従う
    const reversed = ["design", "description", "attributions", "members"].map(
      (slug, i) => {
        const page = readPage({
          slug,
          locale: "en",
          title: slug,
          html: "",
          order: i,
        });
        return { page, path: pagePath(page) };
      }
    );
    const { unmount } = render(
      <EcoliNav page={pageOf("design")} routes={reversed} />
    );
    expect(link("Project").getAttribute("href")).toBe("/description/");
    expect(link("Team").getAttribute("href")).toBe("/members/");
    unmount();
    render(
      <EcoliNav
        page={pageOf("design")}
        routes={reversed.filter((r) => r.page.slug !== "description")}
      />
    );
    expect(link("Project").getAttribute("href")).toBe("/design/");
  });

  it("いまのページの分類だけにaria-currentが付く", () => {
    render(<EcoliNav page={pageOf("software")} routes={routes} />);
    const current = cells().filter((a) => a.hasAttribute("aria-current"));
    expect(current.map((a) => a.textContent)).toStrictEqual(["Dry Lab"]);
  });

  it("リンク先がいまのページなら page、同じ分類の別ページなら true になる", () => {
    const { unmount } = render(
      <EcoliNav page={pageOf("description")} routes={routes} />
    );
    expect(link("Project").getAttribute("aria-current")).toBe("page");
    unmount();
    render(<EcoliNav page={pageOf("design")} routes={routes} />);
    expect(link("Project").getAttribute("aria-current")).toBe("true");
  });

  it("homeではどの分類にもaria-currentが付かない", () => {
    render(<EcoliNav page={pageOf("home")} routes={routes} />);
    expect(cells().filter((a) => a.hasAttribute("aria-current"))).toHaveLength(
      0
    );
  });

  it("日本語のページでも表示名は英語で、リンク先は日本語のページ", () => {
    render(<EcoliNav page={pageOf("design", "ja")} routes={routes} />);
    const links = cells("カテゴリ");
    expect(links[0].textContent).toBe("Project");
    expect(links[0].getAttribute("href")).toBe("/ja/description/");
  });
});

const panelLinks = (label: string) =>
  within(link(label).closest("li") as HTMLElement)
    .getAllByRole("link")
    .slice(1);
const pagesNav = () => screen.getByRole("navigation", { name: "Pages" });

describe("パネルと2段目", () => {
  it("orderを逆にしても、パネルは対応表の順に並ぶ", () => {
    const reversed = ["design", "description", "judging", "application"].map(
      (slug, i) => {
        const page = readPage({
          slug,
          locale: "en",
          title: slug,
          html: "",
          order: i,
        });
        return { page, path: pagePath(page) };
      }
    );
    render(<EcoliNav page={pageOf("design")} routes={reversed} />);
    expect(panelLinks("Project").map((a) => a.textContent)).toStrictEqual([
      "description",
      "design",
      "application",
      "judging",
    ]);
  });

  it("各分類のパネルにその分類のページが並び、いまのページにaria-current=pageが付く", () => {
    render(<EcoliNav page={pageOf("results")} routes={routes} />);
    expect(panelLinks("Wet Lab").map((a) => a.textContent)).toStrictEqual([
      "experiments",
      "results",
    ]);
    const current = panelLinks("Wet Lab").filter(
      (a) => a.getAttribute("aria-current") === "page"
    );
    expect(current.map((a) => a.textContent)).toStrictEqual(["results"]);
    expect(
      panelLinks("Dry Lab").filter((a) => a.hasAttribute("aria-current"))
    ).toHaveLength(0);
  });

  it("2段目にはいまの分類のページだけが並ぶ", () => {
    render(<EcoliNav page={pageOf("results")} routes={routes} />);
    const links = within(pagesNav()).getAllByRole("link");
    expect(links.map((a) => a.textContent)).toStrictEqual([
      "experiments",
      "results",
    ]);
    expect(
      links.filter((a) => a.getAttribute("aria-current") === "page")
    ).toHaveLength(1);
  });

  it("Homeでは2段目を出さない", () => {
    render(<EcoliNav page={pageOf("home")} routes={routes} />);
    expect(screen.queryByRole("navigation", { name: "Pages" })).toBeNull();
  });
});

describe("ロゴと言語の切り替え", () => {
  it("ロゴはHomeへ、Homeではaria-current=pageが付く", () => {
    const { unmount } = render(
      <EcoliNav page={pageOf("design", "ja")} routes={routes} />
    );
    const logo = screen.getByRole("link", { name: /iGEM/u });
    expect(logo.getAttribute("href")).toBe("/ja/");
    expect(logo.hasAttribute("aria-current")).toBe(false);
    unmount();
    render(<EcoliNav page={pageOf("home")} routes={routes} />);
    expect(
      screen.getByRole("link", { name: /iGEM/u }).getAttribute("aria-current")
    ).toBe("page");
  });

  it("言語の切り替えは相手の言語の同じページへ向く", () => {
    render(<EcoliNav page={pageOf("design")} routes={routes} />);
    const lang = screen.getByRole("link", { name: "JA" });
    expect(lang.getAttribute("href")).toBe("/ja/design/");
    expect(lang.getAttribute("hreflang")).toBe("ja");
  });
});

describe(alternatePath, () => {
  it("相手の言語に同じslugが無ければ、相手の言語のhomeになる", () => {
    const only = routes.filter((r) => r.page.slug !== "design");
    expect(alternatePath(pageOf("design"), only)).toBe("/ja/");
    expect(alternatePath(pageOf("design"), [])).toBeUndefined();
  });
});
