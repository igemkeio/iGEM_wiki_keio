import type { ComponentType } from "react";
import { createRoot } from "react-dom/client";

// 島の名前と部品の遅延ローダー。キーはislands.tsのISLANDSと揃える。
// 島ごとに props の型が違うので any で受ける。
// oxlint-disable-next-line typescript/no-explicit-any
const loaders: Record<string, () => Promise<{ default: ComponentType<any> }>> =
  {
    "attribution-form": () => import("../components/AttributionForm"),
    "member-list": () => import("../components/MemberList"),
    "model-viewer": () => import("../components/ModelViewer"),
  };

export async function mountIslands(root: ParentNode = document) {
  const tasks = [
    ...root.querySelectorAll<HTMLElement>(
      "[data-island]:not([data-island-mounted])"
    ),
  ].map(async (el) => {
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
    el.dataset.islandMounted = "";
    try {
      const { default: Comp } = await load();
      createRoot(el).render(<Comp {...props} />);
    } catch (error) {
      console.warn(`島${name}を起動できません`, error);
    }
  });
  await Promise.all(tasks);
}
