// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const state = vi.hoisted(() => ({ imported: 0 }));

const model = { src: "/models/a.glb", poster: "/models/a.png", alt: "A model" };

let container: HTMLDivElement;
let root: Root;
let ModelViewer: typeof import("./ModelViewer").ModelViewer;
let intersect: (isIntersecting: boolean) => void;
let observed: { rootMargin?: string } = {};

const stubWebGL = (context: unknown) => {
  vi.stubGlobal("WebGLRenderingContext", function () {});
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation((() => context) as never);
};

const stubObserver = () => {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(cb: (entries: { isIntersecting: boolean }[]) => void, options?: { rootMargin?: string }) {
        observed = options ?? {};
        intersect = (isIntersecting) => cb([{ isIntersecting }]);
      }
      observe() {}
      disconnect() {}
    },
  );
};

const flush = () => act(async () => {});
const render = async (props: object = model) => {
  act(() => root.render(<ModelViewer {...props} />));
  await flush();
};

beforeEach(async () => {
  vi.resetModules();
  state.imported = 0;
  vi.doMock("@google/model-viewer", () => {
    state.imported += 1;
    return {};
  });
  observed = {};
  ({ ModelViewer } = await import("./ModelViewer"));
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
  it("WebGLRenderingContextが無いときはposterを出し、読み込まない", async () => {
    vi.stubGlobal("WebGLRenderingContext", undefined);
    stubObserver();
    await render();
    const img = container.querySelector("img");
    expect(img?.getAttribute("src")).toBe(model.poster);
    expect(img?.getAttribute("alt")).toBe(model.alt);
    expect(container.querySelector("model-viewer")).toBeNull();
    expect(state.imported).toBe(0);
  });

  it("getContextがnullを返すときはposterを出し、読み込まない", async () => {
    stubWebGL(null);
    stubObserver();
    await render();
    expect(container.querySelector("img")).not.toBeNull();
    expect(state.imported).toBe(0);
  });

  it("画面に近づく前は読み込まず、近づいてからimportして要素を出す", async () => {
    stubWebGL({ getExtension: () => null });
    stubObserver();
    await render();
    expect(observed.rootMargin).toBe("200px");
    expect(state.imported).toBe(0);
    expect(container.querySelector("model-viewer")).toBeNull();
    act(() => intersect(false));
    await flush();
    expect(state.imported).toBe(0);
    act(() => intersect(true));
    await flush();
    const el = container.querySelector("model-viewer");
    expect(state.imported).toBe(1);
    expect(el?.getAttribute("src")).toBe(model.src);
    expect(el?.getAttribute("poster")).toBe(model.poster);
    expect(el?.getAttribute("loading")).toBe("lazy");
    expect(el?.getAttribute("reveal")).toBe("auto");
    expect(el?.hasAttribute("camera-controls")).toBe(true);
    expect(el?.hasAttribute("auto-rotate")).toBe(true);
    expect(container.querySelector("img")).toBeNull();
    const config = (window as unknown as { ModelViewerElement: Record<string, string> }).ModelViewerElement;
    expect(config.dracoDecoderLocation).toMatch(/models\/decoders\/draco\/$/);
    expect(config.ktx2TranscoderLocation).toMatch(/models\/decoders\/basis\/$/);
  });

  it("IntersectionObserverが無い環境では即importする", async () => {
    stubWebGL({ getExtension: () => null });
    vi.stubGlobal("IntersectionObserver", undefined);
    await render();
    await flush();
    expect(state.imported).toBe(1);
    expect(container.querySelector("model-viewer")).not.toBeNull();
  });

  it("判定用のコンテキストを解放する", async () => {
    const loseContext = vi.fn();
    stubWebGL({ getExtension: () => ({ loseContext }) });
    stubObserver();
    await render();
    expect(loseContext).toHaveBeenCalled();
  });

  it("srcが無いときは何も出さない", async () => {
    stubWebGL({ getExtension: () => null });
    stubObserver();
    await render({});
    expect(container.innerHTML).toBe("");
  });
});
