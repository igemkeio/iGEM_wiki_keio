import { writeStorage } from "./storage";

export const LOCALE_KEY = "wiki:locale";

export function rememberLocale(locale: string): void {
  writeStorage("local", LOCALE_KEY, locale);
}

// 言語切り替えリンク(hreflang付きのa)のクリックで、移る先の言語を保存する。保存した言語への自動遷移はしない。
export function rememberLocaleOnClick(root: ParentNode = document): void {
  root.querySelectorAll<HTMLAnchorElement>("a[hreflang]").forEach((a) => {
    a.addEventListener("click", () => {
      const locale = a.hreflang;
      if (locale) rememberLocale(locale);
    });
  });
}
