// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { rememberLocale, rememberLocaleOnClick } from "./locale";

let stop: (() => void) | undefined;

beforeEach(() => {
  document.body.innerHTML = `<a id="lang" href="/ja/members/" hreflang="ja">JA</a><a id="plain" href="/x/">x</a>`;
});

afterEach(() => {
  stop?.();
  stop = undefined;
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("locale", () => {
  it("rememberLocaleはwiki:localeに書く", () => {
    rememberLocale("en");
    expect(localStorage.getItem("wiki:locale")).toBe('"en"');
  });

  it("hreflang付きリンクのクリックで移る先の言語を保存する", () => {
    stop = rememberLocaleOnClick();
    document.getElementById("lang")!.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(localStorage.getItem("wiki:locale")).toBe('"ja"');
  });

  it("後から描画されたリンクのクリックでも保存する", () => {
    stop = rememberLocaleOnClick();
    document.body.insertAdjacentHTML("beforeend", `<a id="late" href="/en/" hreflang="en"><span id="inner">EN</span></a>`);
    document.getElementById("inner")!.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(localStorage.getItem("wiki:locale")).toBe('"en"');
  });

  it("hreflangの無いリンクでは保存しない", () => {
    stop = rememberLocaleOnClick();
    document.getElementById("plain")!.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(localStorage.getItem("wiki:locale")).toBeNull();
  });

  it("保存領域が例外を投げてもクリックで例外が出ない", () => {
    vi.stubGlobal("localStorage", {
      setItem: () => {
        throw new Error("denied");
      },
    });
    stop = rememberLocaleOnClick();
    expect(() =>
      document.getElementById("lang")!.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })),
    ).not.toThrow();
  });
});
