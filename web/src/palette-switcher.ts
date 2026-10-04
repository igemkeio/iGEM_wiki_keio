// Vercelのプレビューでだけhead先頭に埋め込むスクリプト。ビルド時に?rawで文字列として読むので、
// 型注釈やimportなど、そのままブラウザで動かない構文を書かない。
(() => {
  const KEY = "wiki:palette";
  const NAMES = ["a", "b", "c"];
  const root = document.documentElement;

  const read = () => {
    try {
      return localStorage.getItem(KEY);
    } catch {
      return null;
    }
  };

  // 現在の選択。クエリ、保存値、既定の順に決める。NAMESに無い値は既定として扱う。
  let current =
    new URLSearchParams(location.search).get("palette") ?? read() ?? "";

  const sync = () => {
    const valid = NAMES.includes(current);
    if (valid) {
      root.dataset.palette = current;
    } else {
      delete root.dataset.palette;
    }
    try {
      if (valid) {
        localStorage.setItem(KEY, current);
      } else {
        localStorage.removeItem(KEY);
      }
    } catch {
      // 保存できない環境では、そのページの間だけ切り替わる。
    }
  };

  sync();

  document.addEventListener("DOMContentLoaded", () => {
    const bar = document.createElement("div");
    bar.setAttribute("role", "group");
    bar.setAttribute("aria-label", "Palette");
    bar.style.cssText =
      "position:fixed;right:16px;bottom:16px;z-index:2147483647;display:flex;gap:4px;padding:4px;border-radius:999px;background:#fff;box-shadow:0 0 0 1px rgba(13,15,18,0.24);font:12px/1 sans-serif";

    const mark = () => {
      const selected = NAMES.includes(current) ? current : "default";
      for (const button of bar.querySelectorAll("button")) {
        const active = button.dataset.paletteChoice === selected;
        button.setAttribute("aria-pressed", String(active));
        button.style.background = active ? "#0d0f12" : "transparent";
        button.style.color = active ? "#fff" : "#0d0f12";
      }
    };

    const buttons = ["default", ...NAMES].map((name) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = name === "default" ? "既定" : name;
      button.dataset.paletteChoice = name;
      button.style.cssText =
        "padding:8px 12px;border:0;border-radius:999px;font:inherit;cursor:pointer";
      button.addEventListener("click", () => {
        current = name;
        sync();
        mark();
      });
      return button;
    });

    bar.append(...buttons);
    document.body.append(bar);
    mark();
  });
})();
