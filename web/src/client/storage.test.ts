// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { readStorage, writeStorage } from "./storage";

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
  sessionStorage.clear();
});

const throwingStorage = {
  getItem: () => {
    throw new Error("denied");
  },
  setItem: () => {
    throw new Error("denied");
  },
};

describe("storage", () => {
  it("書いた値を読み戻せる", () => {
    writeStorage("local", "k", { a: [1, 2] });
    expect(readStorage("local", "k")).toEqual({ a: [1, 2] });
  });

  it("localとsessionは別の領域", () => {
    writeStorage("session", "k", "s");
    expect(readStorage("local", "k")).toBeUndefined();
    expect(readStorage("session", "k")).toBe("s");
  });

  it("無いキーはundefined", () => {
    expect(readStorage("local", "none")).toBeUndefined();
  });

  it("壊れたJSONはundefined", () => {
    localStorage.setItem("k", "{broken");
    expect(readStorage("local", "k")).toBeUndefined();
  });

  it("getItemとsetItemが例外を投げても読みはundefined、書きは何もしない", () => {
    vi.stubGlobal("localStorage", throwingStorage);
    expect(readStorage("local", "k")).toBeUndefined();
    expect(() => writeStorage("local", "k", 1)).not.toThrow();
  });

  it("localStorageへの参照が例外を投げても壊れない", () => {
    vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
      throw new Error("denied");
    });
    expect(readStorage("local", "k")).toBeUndefined();
    expect(() => writeStorage("local", "k", 1)).not.toThrow();
    vi.restoreAllMocks();
  });
});
