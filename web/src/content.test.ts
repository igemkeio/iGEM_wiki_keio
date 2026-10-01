import { describe, expect, it } from "vitest";
import { readPage } from "./content";

const minimal = { slug: "model", locale: "en", title: "Model", html: "<p>a</p>" };

describe("readPage", () => {
  it.each(["slug", "locale", "title", "html"])("%sが欠けるとthrowする", (key) => {
    const raw: Record<string, unknown> = { ...minimal };
    delete raw[key];
    expect(() => readPage(raw)).toThrow(/必須フィールド/);
  });

  it("localeがenとja以外ならthrowする", () => {
    expect(() => readPage({ ...minimal, locale: "fr" })).toThrow(/必須フィールド/);
  });

  it("nullでもthrowする", () => {
    expect(() => readPage(null)).toThrow(/必須フィールド/);
  });

  it("sourceをメッセージに含める", () => {
    expect(() => readPage({}, "content/en/x.json")).toThrow(/content\/en\/x\.json/);
  });

  it("任意フィールドの既定値を埋める", () => {
    expect(readPage(minimal)).toMatchObject({
      subtitle: "",
      lead: "",
      order: Number.MAX_SAFE_INTEGER,
      islands: [],
      published: true,
      source: "notion",
    });
  });

  it("指定した任意フィールドは上書きしない", () => {
    const page = readPage({ ...minimal, order: 3, islands: ["x"], published: false });
    expect(page).toMatchObject({ order: 3, islands: ["x"], published: false });
  });

  it("sourceはlocalを保ち、省略時はnotionになる", () => {
    expect(readPage({ ...minimal, source: "local" }).source).toBe("local");
    expect(readPage(minimal).source).toBe("notion");
  });

  it("未知のフィールドを落とさない", () => {
    expect(readPage({ ...minimal, extra: 1 })).toHaveProperty("extra", 1);
  });
});
