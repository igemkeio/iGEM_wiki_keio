import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { readPage } from "../content";
import { pagePath } from "../routes";
import type { Route } from "../routes";
import { EcoliNav } from "./EcoliNav";
import { Sidebar } from "./Sidebar";

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

const link = (name: string) => screen.getByRole("link", { name });

afterEach(cleanup);

describe(EcoliNav, () => {
  it("5分類が並び、リンク先は分類の先頭のページ", () => {
    render(<EcoliNav page={pageOf("results")} routes={routes} />);
    const links = within(
      screen.getByRole("navigation", { name: "Category" })
    ).getAllByRole("link");
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
    const current = screen
      .getAllByRole("link")
      .filter((a) => a.hasAttribute("aria-current"));
    expect(current.map((a) => a.textContent)).toStrictEqual(["Dry Lab"]);
  });

  it("リンク先がいまのページなら page、同じ分類の別ページなら true になる", () => {
    const { unmount } = render(
      <EcoliNav page={pageOf("description")} routes={routes} />
    );
    expect(
      screen.getByRole("link", { name: "Project" }).getAttribute("aria-current")
    ).toBe("page");
    unmount();
    render(<EcoliNav page={pageOf("design")} routes={routes} />);
    expect(
      screen.getByRole("link", { name: "Project" }).getAttribute("aria-current")
    ).toBe("true");
  });

  it("homeではどの分類にもaria-currentが付かない", () => {
    render(<EcoliNav page={pageOf("home")} routes={routes} />);
    expect(
      screen.getAllByRole("link").filter((a) => a.hasAttribute("aria-current"))
    ).toHaveLength(0);
  });

  it("日本語のページでも表示名は英語で、リンク先は日本語のページ", () => {
    render(<EcoliNav page={pageOf("design", "ja")} routes={routes} />);
    const links = screen.getAllByRole("link");
    expect(links[0].textContent).toBe("Project");
    expect(links[0].getAttribute("href")).toBe("/ja/description/");
    expect(screen.getByRole("navigation", { name: "カテゴリ" })).toBeDefined();
  });
});

const mainNav = () => screen.getByRole("navigation", { name: "Main" });

describe(Sidebar, () => {
  it("同じ分類のページだけを並べ、いまのページにaria-current=pageが付く", () => {
    render(<Sidebar page={pageOf("results")} routes={routes} />);
    const links = within(mainNav()).getAllByRole("link");
    expect(links.map((a) => a.textContent)).toStrictEqual([
      "experiments",
      "results",
    ]);
    expect(
      links.filter((a) => a.getAttribute("aria-current") === "page")
    ).toHaveLength(1);
  });

  it("Homeでは全分類を見出し付きで並べる", () => {
    render(<Sidebar page={pageOf("home")} routes={routes} />);
    const nav = mainNav();
    for (const label of [
      "Project",
      "Wet Lab",
      "Dry Lab",
      "Human Practices",
      "Team",
    ]) {
      expect(within(nav).getByText(label)).toBeDefined();
    }
    expect(within(nav).getAllByRole("link")).toHaveLength(slugsEn.length - 1);
  });
});
