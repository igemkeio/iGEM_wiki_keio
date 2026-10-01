import { describe, expect, it } from "vitest";

import { readPage } from "./content";
import { ISLANDS } from "./islands";

const page = (extra: object = {}) =>
  readPage({ slug: "x", locale: "en", title: "X", html: "", ...extra });

// oxlint-disable-next-line vitest/prefer-describe-function-title -- ISLANDS は関数ではなくオブジェクト
describe("ISLANDS", () => {
  it("model-viewerがafterBodyで登録されている", () => {
    expect(ISLANDS["model-viewer"]?.place).toBe("afterBody");
  });

  it("model-viewerのpropsはmodelsの先頭を返し、無ければ空オブジェクト", () => {
    const model = { src: "/a.glb", poster: "/a.png", alt: "a" };
    const { props } = ISLANDS["model-viewer"];
    expect(
      props(page({ models: [model, { ...model, src: "/b.glb" }] }))
    ).toStrictEqual(model);
    expect(props(page())).toStrictEqual({});
  });

  it("model-viewerのpropsは/で始まるURLにだけbaseを付ける", () => {
    const { props } = ISLANDS["model-viewer"];
    const abs = {
      src: "https://static.igem.wiki/a.glb",
      poster: "//cdn.example/a.png",
      alt: "a",
    };
    expect(props(page({ models: [abs] }))).toStrictEqual(abs);
  });

  it("attribution-formはafterBodyで、固定のsrcをpropsに渡す", () => {
    expect(ISLANDS["attribution-form"]?.place).toBe("afterBody");
    expect(ISLANDS["attribution-form"].props(page())).toStrictEqual({
      src: "https://teams.igem.org/wiki/5539/attributions",
    });
  });

  it("modelsの既定値は空配列", () => {
    expect(page().models).toStrictEqual([]);
  });
});
