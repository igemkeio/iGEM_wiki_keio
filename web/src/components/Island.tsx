// ブラウザで島を描画する器。中身は client/islands.tsx が data-island を見て差し込む。
// data-props の & < > " のエスケープはReactが属性値として出すときに行う。
export function Island({ name, props = {} }: { name: string; props?: Record<string, unknown> }) {
  return <div data-island={name} data-props={JSON.stringify(props)} />;
}
