import { writeStorage } from "./storage";

export const LOCALE_KEY = "wiki:locale";

export function rememberLocale(locale: string): void {
  writeStorage("local", LOCALE_KEY, locale);
}

// 言語切り替えリンク(hreflang付きのa)のクリックで、移る先の言語を保存する。保存した言語への自動遷移はしない。
// documentに1つだけ付けるので、島の中に描画されたリンクも拾える。戻り値は解除関数。
export function rememberLocaleOnClick(root: Document = document): () => void {
  const onClick = (event: Event) => {
    const link = (event.target as Element | null)?.closest?.<HTMLAnchorElement>("a[hreflang]");
    if (link?.hreflang) rememberLocale(link.hreflang);
  };
  root.addEventListener("click", onClick);
  return () => root.removeEventListener("click", onClick);
}
