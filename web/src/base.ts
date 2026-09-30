// 配信パスの接頭辞(vite.config.ts の base)を path に付ける。path は "/" から始める。
export function withBase(path: string, base: string = import.meta.env.BASE_URL): string {
  return base.replace(/\/$/, "") + path;
}
