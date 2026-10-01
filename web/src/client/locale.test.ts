// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { rememberLocale, rememberLocaleOnClick } from "./locale";

beforeEach(() => {
  document.body.innerHTML = `<a id="lang" href="/ja/members/" hreflang="ja">JA</a><a id="plain" href="/x/">x</a>`;
});

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("locale", () => {
  it("rememberLocaleはwiki:localeに書く", () => {
    rememberLocale("en");
    expect(localStorage.getItem("wiki:locale")).toBe('"en"');
  });

  it("hreflang付きリンクのクリックで移る先の言語を保存する", () => {
    rememberLocaleOnClick();
    document.getElementById("lang")!.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(localStorage.getItem("wiki:locale")).toBe('"ja"');
  });

  it("hreflangの無いリンクでは保存しない", () => {
    rememberLocaleOnClick();
    document.getElementById("plain")!.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(localStorage.getItem("wiki:locale")).toBeNull();
  });

  it("保存領域が例外を投げてもクリックで例外が出ない", () => {
    vi.stubGlobal("localStorage", {
      setItem: () => {
        throw new Error("denied");
      },
    });
    rememberLocaleOnClick();
    expect(() =>
      document.getElementById("lang")!.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })),
    ).not.toThrow();
  });
});
