// @vitest-environment happy-dom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createStore, useStore } from "./store";

describe("createStore", () => {
  it("setで値が変わり購読者が呼ばれる", () => {
    const store = createStore(0);
    const listener = vi.fn();
    store.subscribe(listener);
    store.set(1);
    expect(store.get()).toBe(1);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("同じ値のsetでは購読者を呼ばない", () => {
    const store = createStore(0);
    const listener = vi.fn();
    store.subscribe(listener);
    store.set(0);
    expect(listener).not.toHaveBeenCalled();
  });

  it("購読解除後は呼ばれない", () => {
    const store = createStore(0);
    const listener = vi.fn();
    store.subscribe(listener)();
    store.set(1);
    expect(listener).not.toHaveBeenCalled();
  });
});

describe("useStore", () => {
  it("setで再描画され、別のhookにも伝わる", () => {
    const store = createStore("a");
    const first = renderHook(() => useStore(store));
    const second = renderHook(() => useStore(store));
    act(() => store.set("b"));
    expect(first.result.current).toBe("b");
    expect(second.result.current).toBe("b");
  });
});
