import { describe, expect, it } from "vitest";
import { buildRoutes, pagePath } from "./routes";

const page = (over: Record<string, unknown> = {}) => ({
  slug: "model",
  locale: "en",
  title: "Model",
  html: "<h2>a</h2>",
  ...over,
});

describe("pagePath", () => {
  it("homeは言語ごとのルートになる", () => {
    expect(pagePath({ locale: "en", slug: "home" })).toBe("/");
    expect(pagePath({ locale: "ja", slug: "home" })).toBe("/ja/");
  });

  it("home以外はslugのディレクトリになる", () => {
    expect(pagePath({ locale: "en", slug: "model" })).toBe("/model/");
    expect(pagePath({ locale: "ja", slug: "model" })).toBe("/ja/model/");
  });
});

describe("buildRoutes", () => {
  it("published: falseのページを除く", () => {
    const routes = buildRoutes({
      "a.json": page({ slug: "a" }),
      "b.json": page({ slug: "b", published: false }),
    });
    expect(routes.map((r) => r.path)).toEqual(["/a/"]);
  });

  it("orderの昇順に並べ、同値はslugの辞書順にする", () => {
    const routes = buildRoutes({
      "c.json": page({ slug: "c", order: 1 }),
      "b.json": page({ slug: "b", order: 1 }),
      "z.json": page({ slug: "z", order: 0 }),
      "n.json": page({ slug: "n" }),
    });
    expect(routes.map((r) => r.page.slug)).toEqual(["z", "b", "c", "n"]);
  });

  it("pathが衝突したら両方のファイル名を含めてthrowする", () => {
    expect(() =>
      buildRoutes({
        "en/a.json": page({ slug: "same" }),
        "en/b.json": page({ slug: "same" }),
      })
    ).toThrow(/en\/a\.json.*en\/b\.json/);
  });

  it("言語が違えば同じslugでも衝突しない", () => {
    const routes = buildRoutes({
      "en/a.json": page({ slug: "home" }),
      "ja/a.json": page({ slug: "home", locale: "ja" }),
    });
    expect(routes.map((r) => r.path).sort()).toEqual(["/", "/ja/"]);
  });
});
