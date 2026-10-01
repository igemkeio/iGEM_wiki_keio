// @vitest-environment happy-dom
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Island } from "./Island";

describe("Island", () => {
  it("名前とpropsを属性に持つ器を出す", () => {
    const html = renderToStaticMarkup(<Island name="member-list" props={{ locale: "ja" }} />);
    const el = new DOMParser().parseFromString(html, "text/html").querySelector("[data-island]");
    expect(el?.getAttribute("data-island")).toBe("member-list");
    expect(JSON.parse(el?.getAttribute("data-props") ?? "")).toEqual({ locale: "ja" });
  });

  it("& < > と引用符をエスケープし、属性を壊さずに復元できる", () => {
    const props = { text: `a&b<c>"d"` };
    const html = renderToStaticMarkup(<Island name="x" props={props} />);
    expect(html).not.toMatch(/data-props="[^"]*[<>]/);
    const el = new DOMParser().parseFromString(html, "text/html").querySelector("[data-island]");
    expect(JSON.parse(el?.getAttribute("data-props") ?? "")).toEqual(props);
  });
});
