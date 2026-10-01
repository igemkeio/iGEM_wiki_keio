import { describe, expect, it } from "vitest";
import { readPage } from "./content";
import { ISLANDS } from "./islands";

const page = (extra: object = {}) =>
  readPage({ slug: "x", locale: "en", title: "X", html: "", ...extra });

describe("ISLANDS", () => {
  it("model-viewerがafterBodyで登録されている", () => {
    expect(ISLANDS["model-viewer"]?.place).toBe("afterBody");
  });

  it("model-viewerのpropsはmodelsの先頭を返し、無ければ空オブジェクト", () => {
    const model = { src: "/a.glb", poster: "/a.png", alt: "a" };
    const props = ISLANDS["model-viewer"].props;
    expect(props(page({ models: [model, { ...model, src: "/b.glb" }] }))).toEqual(model);
    expect(props(page())).toEqual({});
  });

  it("model-viewerのpropsは/で始まるURLにだけbaseを付ける", () => {
    const props = ISLANDS["model-viewer"].props;
    const abs = { src: "https://static.igem.wiki/a.glb", poster: "//cdn.example/a.png", alt: "a" };
    expect(props(page({ models: [abs] }))).toEqual(abs);
  });

  it("modelsの既定値は空配列", () => {
    expect(page().models).toEqual([]);
  });
});
