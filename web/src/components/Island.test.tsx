// @vitest-environment happy-dom
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Island } from "./Island";

describe(Island, () => {
  it("名前とpropsを属性に持つ器を出す", () => {
    const html = renderToStaticMarkup(
      <Island name="member-list" props={{ locale: "ja" }} />
    );
    const el = new DOMParser()
      .parseFromString(html, "text/html")
      .querySelector<HTMLElement>("[data-island]");
    expect(el?.dataset.island).toBe("member-list");
    expect(JSON.parse(el?.dataset.props ?? "")).toStrictEqual({
      locale: "ja",
    });
  });

  it("& < > と引用符をエスケープし、属性を壊さずに復元できる", () => {
    const props = { text: `a&b<c>"d"` };
    const html = renderToStaticMarkup(<Island name="x" props={props} />);
    expect(html).not.toMatch(/data-props="[^"]*[<>]/u);
    const el = new DOMParser()
      .parseFromString(html, "text/html")
      .querySelector<HTMLElement>("[data-island]");
    expect(JSON.parse(el?.dataset.props ?? "")).toStrictEqual(props);
  });
});
