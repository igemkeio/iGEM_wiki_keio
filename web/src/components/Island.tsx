// ブラウザで島を描画する器。中身はclient/islands.tsxがdata-islandを見て差し込む。
// data-propsのエスケープ(アンパサンド、山括弧、引用符)はReactが属性値として出すときに行う。
export function Island({ name, props = {} }: { name: string; props?: Record<string, unknown> }) {
  return <div data-island={name} data-props={JSON.stringify(props)} />;
}
