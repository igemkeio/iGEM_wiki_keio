// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { AttributionForm } from "./AttributionForm";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const SRC = "https://teams.igem.org/wiki/5539/attributions";

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  act(() => root.render(<AttributionForm src={SRC} />));
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const frame = () => container.querySelector("iframe") as HTMLIFrameElement;
const send = (
  origin: string,
  data: unknown,
  source: MessageEventSource | null = frame().contentWindow
) =>
  act(() => {
    window.dispatchEvent(new MessageEvent("message", { origin, data, source }));
  });
const body = (data: unknown) =>
  JSON.stringify({ type: "igem-attribution-form", data });

describe(AttributionForm, () => {
  it("既定のsrcでiframeを出す", () => {
    expect(frame().getAttribute("src")).toBe(
      "https://teams.igem.org/wiki/5539/attributions"
    );
  });

  it("teams.igem.orgのmessageで高さが変わる", () => {
    send("https://teams.igem.org", body(500));
    expect(frame().style.height).toBe("600px");
  });

  it("違うoriginのmessageは無視する", () => {
    send("https://example.com", body(500));
    expect(frame().style.height).toBe("");
  });

  it("iframe以外から来たmessageは無視する", () => {
    send("https://teams.igem.org", body(500), window);
    expect(frame().style.height).toBe("");
  });

  it("高さは0から20000pxに収める", () => {
    send("https://teams.igem.org", body(99999));
    expect(frame().style.height).toBe("20000px");
    send("https://teams.igem.org", body(-500));
    expect(frame().style.height).toBe("0px");
  });

  it("unmount後のmessageでは高さが変わらない", () => {
    const el = frame();
    const source = el.contentWindow;
    act(() => root.unmount());
    act(() => {
      window.dispatchEvent(
        new MessageEvent("message", {
          origin: "https://teams.igem.org",
          data: body(500),
          source,
        })
      );
    });
    expect(el.style.height).toBe("");
    root = createRoot(container);
  });

  it("壊れたmessageや別のtypeは無視する", () => {
    send("https://teams.igem.org", "not json");
    send(
      "https://teams.igem.org",
      JSON.stringify({ type: "other", data: 500 })
    );
    send("https://teams.igem.org", body("x"));
    expect(frame().style.height).toBe("");
  });
});
