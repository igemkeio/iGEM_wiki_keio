// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MemberList } from "./MemberList";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const list = [
  {
    id: "a",
    name: { ja: "甲", en: "Alice" },
    role: "Wet Lab",
    department: { ja: "学部", en: "Dept" },
    year: 3,
    tags: ["x"],
    bio: { ja: "自己紹介", en: "About Alice" },
  },
];

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  const proto = HTMLDialogElement.prototype;
  proto.showModal ??= function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  proto.close ??= function (this: HTMLDialogElement) {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  act(() => root.render(<MemberList locale="en" list={list} />));
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const dialog = () => container.querySelector("dialog") as HTMLDialogElement;
const openIt = () => act(() => container.querySelector<HTMLButtonElement>("ul button")!.click());

describe("MemberList", () => {
  it("クリックでモーダルが開く", () => {
    expect(dialog().open).toBe(false);
    openIt();
    expect(dialog().open).toBe(true);
    expect(dialog().textContent).toContain("About Alice");
  });

  it("閉じるボタンで閉じる", () => {
    openIt();
    act(() => dialog().querySelector<HTMLButtonElement>("button")!.click());
    expect(dialog().open).toBe(false);
  });

  it("オーバーレイ(dialog自身)のクリックで閉じる", () => {
    openIt();
    act(() => dialog().click());
    expect(dialog().open).toBe(false);
  });

  it("Escでcloseイベントが来ると閉じた状態になる", () => {
    openIt();
    act(() => dialog().close());
    expect(dialog().open).toBe(false);
    expect(dialog().textContent).toBe("");
  });
});
