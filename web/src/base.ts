// 配信パスの接頭辞(vite.config.tsのbase)をpathに付ける。pathは"/"から始める。
export function withBase(
  path: string,
  base: string = import.meta.env.BASE_URL
): string {
  return base.replace(/\/$/u, "") + path;
}
