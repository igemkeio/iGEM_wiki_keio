import type { ReactNode } from "react";

// ブラウザで島を描画する器。中身はclient/islands.tsxがdata-islandを見て差し込む。
// data-propsのエスケープ(アンパサンド、山括弧、引用符)はReactが属性値として出すときに行う。
// childrenはJSが無いときに出す中身で、ブラウザではcreateRootが入れ替える。
const NO_PROPS: Record<string, unknown> = {};

export function Island({
  name,
  props = NO_PROPS,
  children,
}: {
  name: string;
  props?: Record<string, unknown>;
  children?: ReactNode;
}) {
  return (
    <div data-island={name} data-props={JSON.stringify(props)}>
      {children}
    </div>
  );
}
