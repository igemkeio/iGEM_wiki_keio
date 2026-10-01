export type StorageKind = "local" | "session";

// localStorageやsessionStorageへの参照自体が例外を投げる環境があるため、取得も含めて握る。
function getStorage(kind: StorageKind): Storage | undefined {
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return undefined;
  }
}

// 読めない、無い、壊れたJSONのときはundefinedを返す。
export function readStorage(kind: StorageKind, key: string): unknown {
  try {
    const raw = getStorage(kind)?.getItem(key);
    return raw == null ? undefined : JSON.parse(raw);
  } catch {
    return undefined;
  }
}

// 保存領域が使えない、容量超過などの失敗は何もしない。
export function writeStorage(kind: StorageKind, key: string, value: unknown): void {
  try {
    getStorage(kind)?.setItem(key, JSON.stringify(value));
  } catch {
    // 保存できなくても画面の動作は続ける
  }
}
