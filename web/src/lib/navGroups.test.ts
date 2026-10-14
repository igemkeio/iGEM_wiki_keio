import { describe, expect, it } from "vitest";

import { readPage } from "../content";
import { pagePath } from "../routes";
import type { Route } from "../routes";
import { categoryIdOf, groupRoutes, NAV_CONFIG } from "./navGroups";

const route = (slug: string, locale: "en" | "ja" = "en"): Route => {
  const page = readPage({ slug, locale, title: slug, html: "" });
  return { page, path: pagePath(page) };
};

const slugs = (routes: Route[]) => routes.map((r) => r.page.slug);

describe(groupRoutes, () => {
  it("分類ごとにまとめ、分類内は対応表の順に並べる", () => {
    const groups = groupRoutes("en", [
      route("home"),
      route("model"),
      route("design"),
      route("members"),
      route("description"),
    ]);
    expect(groups.map((g) => g.category.id)).toStrictEqual([
      "project",
      "wet-lab",
      "dry-lab",
      "human-practices",
      "team",
    ]);
    expect(slugs(groups[0].routes)).toStrictEqual(["description", "design"]);
    expect(slugs(groups[2].routes)).toStrictEqual(["model"]);
    expect(slugs(groups[4].routes)).toStrictEqual(["members"]);
  });

  it("対応表にないページはProjectの末尾にroutesの順で入る", () => {
    const groups = groupRoutes("en", [
      route("stray-b"),
      route("design"),
      route("stray-a"),
      route("description"),
      route("members"),
    ]);
    expect(slugs(groups[0].routes)).toStrictEqual([
      "description",
      "design",
      "stray-b",
      "stray-a",
    ]);
    expect(slugs(groups[4].routes)).toStrictEqual(["members"]);
  });

  it("別のlocaleのページとhomeは含めない", () => {
    const groups = groupRoutes("ja", [
      route("home", "ja"),
      route("design", "en"),
      route("design", "ja"),
    ]);
    expect(groups.flatMap((g) => g.routes.map((r) => r.path))).toStrictEqual([
      "/ja/design/",
    ]);
  });
});

describe(categoryIdOf, () => {
  it("slugから分類のidを返す", () => {
    expect(categoryIdOf("model-3")).toBe("dry-lab");
    expect(categoryIdOf("safety-and-security")).toBe("wet-lab");
    expect(categoryIdOf("human-practices")).toBe("human-practices");
  });

  it("homeはundefined、対応表にないslugはfallbackになる", () => {
    expect(categoryIdOf("home")).toBeUndefined();
    expect(categoryIdOf("stray")).toBe(NAV_CONFIG.fallback);
  });

  it("slugは複数の分類に載らない", () => {
    const all = NAV_CONFIG.categories.flatMap((c) => c.slugs);
    expect(new Set(all).size).toBe(all.length);
  });
});
