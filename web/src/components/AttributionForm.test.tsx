// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AttributionForm } from "./AttributionForm";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  act(() => root.render(<AttributionForm />));
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const send = (origin: string, data: unknown) =>
  act(() => {
    window.dispatchEvent(new MessageEvent("message", { origin, data }));
  });
const frame = () => container.querySelector("iframe") as HTMLIFrameElement;
const body = (data: unknown) => JSON.stringify({ type: "igem-attribution-form", data });

describe("AttributionForm", () => {
  it("既定のsrcでiframeを出す", () => {
    expect(frame().getAttribute("src")).toBe("https://teams.igem.org/wiki/5539/attributions");
  });

  it("teams.igem.orgのmessageで高さが変わる", () => {
    send("https://teams.igem.org", body(500));
    expect(frame().style.height).toBe("600px");
  });

  it("違うoriginのmessageは無視する", () => {
    send("https://example.com", body(500));
    expect(frame().style.height).toBe("");
  });

  it("壊れたmessageや別のtypeは無視する", () => {
    send("https://teams.igem.org", "not json");
    send("https://teams.igem.org", JSON.stringify({ type: "other", data: 500 }));
    send("https://teams.igem.org", body("x"));
    expect(frame().style.height).toBe("");
  });
});
