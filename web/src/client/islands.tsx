import type { ComponentType } from "react";
import { createRoot } from "react-dom/client";
import { MemberList } from "../components/MemberList";

// 島の名前と部品の対応表。新しい島はここに足す。
const islands: Record<string, ComponentType<any>> = {
  "member-list": MemberList,
};

export function mountIslands(root: ParentNode = document) {
  for (const el of root.querySelectorAll<HTMLElement>("[data-island]")) {
    const name = el.dataset.island ?? "";
    const Comp = islands[name];
    if (!Comp) {
      console.warn(`未登録の島です: ${name}`);
      continue;
    }
    createRoot(el).render(<Comp {...JSON.parse(el.dataset.props || "{}")} />);
  }
}

mountIslands();
