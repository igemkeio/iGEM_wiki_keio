// @vitest-environment happy-dom
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { usePersistedState } from "./usePersistedState";

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
  sessionStorage.clear();
});

describe("usePersistedState", () => {
  it("保存が無ければ初期値を返す", () => {
    const { result } = renderHook(() => usePersistedState("t:init", "x"));
    expect(result.current[0]).toBe("x");
  });

  it("保存済みの値があればそれを返す", () => {
    localStorage.setItem("t:saved", JSON.stringify("y"));
    const { result } = renderHook(() => usePersistedState("t:saved", "x"));
    expect(result.current[0]).toBe("y");
  });

  it("壊れたJSONのときは初期値に戻る", () => {
    localStorage.setItem("t:broken", "{broken");
    const { result } = renderHook(() => usePersistedState("t:broken", "x"));
    expect(result.current[0]).toBe("x");
  });

  it("変更すると保存され、関数での更新もできる", () => {
    const { result } = renderHook(() => usePersistedState("t:write", 1));
    act(() => result.current[1](2));
    expect(result.current[0]).toBe(2);
    expect(localStorage.getItem("t:write")).toBe("2");
    act(() => result.current[1]((prev) => prev + 1));
    expect(localStorage.getItem("t:write")).toBe("3");
  });

  it("kindにsessionを渡すとsessionStorageに保存する", () => {
    const { result } = renderHook(() => usePersistedState("t:session", 1, "session"));
    act(() => result.current[1](5));
    expect(sessionStorage.getItem("t:session")).toBe("5");
    expect(localStorage.getItem("t:session")).toBeNull();
  });

  it("同じkeyの2つのhookが揃う", () => {
    const a = renderHook(() => usePersistedState("t:shared", "x"));
    const b = renderHook(() => usePersistedState("t:shared", "x"));
    act(() => a.result.current[1]("z"));
    expect(b.result.current[0]).toBe("z");
  });

  it("同じkeyでもlocalとsessionの値は独立している", () => {
    const local = renderHook(() => usePersistedState("t:kind", "x", "local"));
    const session = renderHook(() => usePersistedState("t:kind", "x", "session"));
    act(() => local.result.current[1]("l"));
    expect(local.result.current[0]).toBe("l");
    expect(session.result.current[0]).toBe("x");
  });

  it("保存領域が例外を投げても動き、値はメモリ上で保たれる", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("denied");
      },
    });
    const { result } = renderHook(() => usePersistedState("t:denied", "x"));
    expect(result.current[0]).toBe("x");
    act(() => result.current[1]("w"));
    expect(result.current[0]).toBe("w");
  });
});
