// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const loaded = vi.fn();
vi.mock("@google/model-viewer", () => {
  loaded();
  return {};
});

import { ModelViewer } from "./ModelViewer";

const model = { src: "/models/a.glb", poster: "/models/a.png", alt: "A model" };

let container: HTMLDivElement;
let root: Root;

const stubWebGL = (available: boolean) => {
  vi.stubGlobal("WebGLRenderingContext", available ? function () {} : undefined);
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation((() =>
    available ? {} : null) as never);
};

const flush = () => act(async () => {});

beforeEach(() => {
  loaded.mockClear();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("ModelViewer", () => {
  it("WebGLが無いときはposterのimgを出し、model-viewerを読み込まない", async () => {
    stubWebGL(false);
    act(() => root.render(<ModelViewer {...model} />));
    await flush();
    const img = container.querySelector("img");
    expect(img?.getAttribute("src")).toBe(model.poster);
    expect(img?.getAttribute("alt")).toBe(model.alt);
    expect(container.querySelector("model-viewer")).toBeNull();
    expect(loaded).not.toHaveBeenCalled();
  });

  it("getContextがnullを返すときもposterを出す", async () => {
    stubWebGL(true);
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation((() => null) as never);
    act(() => root.render(<ModelViewer {...model} />));
    await flush();
    expect(container.querySelector("img")).not.toBeNull();
    expect(loaded).not.toHaveBeenCalled();
  });

  it("WebGLが使えるときはmodel-viewerを動的importして要素を出す", async () => {
    stubWebGL(true);
    act(() => root.render(<ModelViewer {...model} />));
    expect(container.querySelector("model-viewer")).toBeNull();
    expect(container.querySelector("img")).not.toBeNull();
    await flush();
    const el = container.querySelector("model-viewer");
    expect(loaded).toHaveBeenCalledTimes(1);
    expect(el?.getAttribute("src")).toBe(model.src);
    expect(el?.getAttribute("poster")).toBe(model.poster);
    expect(el?.getAttribute("loading")).toBe("lazy");
    expect(el?.getAttribute("reveal")).toBe("auto");
    expect(el?.hasAttribute("camera-controls")).toBe(true);
    expect(el?.hasAttribute("auto-rotate")).toBe(true);
    expect(container.querySelector("img")).toBeNull();
  });

  it("srcが無いときは何も出さない", async () => {
    stubWebGL(true);
    act(() => root.render(<ModelViewer />));
    await flush();
    expect(container.innerHTML).toBe("");
    expect(loaded).not.toHaveBeenCalled();
  });
});
