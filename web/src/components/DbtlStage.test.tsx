// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { readPage } from "../content";
import { allCycles, toSummary } from "../lib/dbtl";
import { dbtlFixture } from "../test/fixtures/dbtl";
import { DbtlPage } from "./DbtlPage";
import DbtlStage from "./DbtlStage";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const page = readPage({
  slug: "engineering",
  locale: "ja",
  title: "エンジニアリング成功",
  html: "",
  dbtl: dbtlFixture,
});
const cycles = allCycles(dbtlFixture).map(toSummary);

let root: Root;
let island: HTMLElement;

// ステージは常に画面にあるものとして、矢印キーを効かせる。
function alwaysVisible(notify: IntersectionObserverCallback) {
  return {
    observe: () =>
      notify(
        [{ intersectionRatio: 1 } as IntersectionObserverEntry],
        {} as IntersectionObserver
      ),
    disconnect: vi.fn<() => void>(),
  };
}

beforeEach(() => {
  vi.stubGlobal("IntersectionObserver", alwaysVisible);
  vi.spyOn(Element.prototype, "scrollTo").mockImplementation(
    vi.fn<() => void>()
  );
  document.body.innerHTML = renderToStaticMarkup(
    <DbtlPage page={page} dbtl={dbtlFixture} />
  );
  island = document.querySelector<HTMLElement>('[data-island="dbtl-stage"]')!;
  root = createRoot(island);
  act(() => root.render(<DbtlStage locale="ja" cycles={cycles} />));
});

afterEach(() => {
  act(() => root.unmount());
  vi.unstubAllGlobals();
});

const text = () => island.textContent ?? "";
const press = (key: string) =>
  act(() => {
    document.body.dispatchEvent(
      new KeyboardEvent("keydown", { key, bubbles: true })
    );
  });

describe(DbtlStage, () => {
  it("最初はサイクル①を出し、基盤の道具を3つ並べる", () => {
    expect(text()).toContain("クローニング");
    expect(text()).toContain("TOOLS GAINED");
    for (const tool of ["作る", "見る", "数える"]) {
      expect(text()).toContain(tool);
    }
  });

  it("基盤の3つを押すと、そのサイクルへ移る", () => {
    act(() => {
      island
        .querySelector<HTMLElement>('a[href="#dbtl-cycle-3"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(text()).toContain("画像解析");
    expect(text()).toContain("目でなく数で判定する");
  });

  it("絵の3か所を押すと、設計のサイクルへ移り、USINGに変わる", () => {
    act(() => {
      island
        .querySelector<HTMLElement>('a[href="#dbtl-cycle-5"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(text()).toContain("接着モジュール");
    expect(text()).toContain("USING");
    expect(text()).not.toContain("TOOLS GAINED");
  });

  it("矢印キーで節を1つずつ移る", () => {
    expect(text()).toContain("ITERATION 1");
    press("ArrowDown");
    press("ArrowDown");
    expect(text()).toContain("DESIGN");
    press("ArrowDown");
    expect(text()).toContain("BUILD");
    press("ArrowUp");
    expect(text()).toContain("DESIGN");
  });

  it("箱の中の今いる節に印を付ける", () => {
    press("ArrowDown");
    const current = document.querySelectorAll("[data-dbtl-current]");
    expect(current).toHaveLength(1);
    expect(current[0].textContent).toContain("サイクル1の反復1");
  });
});
