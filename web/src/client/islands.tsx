import type { ComponentType } from "react";
import { createRoot } from "react-dom/client";

// 島の名前と部品の遅延ローダー。キーはislands.tsのISLANDSと揃える。
const loaders: Record<string, () => Promise<{ default: ComponentType<any> }>> = {
  "member-list": () => import("../components/MemberList"),
};

export async function mountIslands(root: ParentNode = document) {
  const tasks = [...root.querySelectorAll<HTMLElement>("[data-island]:not([data-island-mounted])")].map(
    async (el) => {
      const name = el.dataset.island ?? "";
      const load = loaders[name];
      if (!load) {
        console.warn(`未登録の島です: ${name}`);
        return;
      }
      let props: Record<string, unknown>;
      try {
        props = JSON.parse(el.dataset.props || "{}");
      } catch (error) {
        console.warn(`島${name}のdata-propsを読めません`, error);
        return;
      }
      el.setAttribute("data-island-mounted", "");
      const { default: Comp } = await load();
      createRoot(el).render(<Comp {...props} />);
    },
  );
  await Promise.all(tasks);
}
