import { useCallback } from "react";
import { createStore, useStore, type Store } from "./store";
import { readStorage, writeStorage, type StorageKind } from "./storage";

// 同じkindとkeyを使う島が同じ値を見るよう、ストアはモジュールスコープで共有する。
const stores = new Map<string, Store<unknown>>();

function storeFor<T>(kind: StorageKind, key: string, initial: T): Store<T> {
  const id = `${kind}:${key}`;
  let store = stores.get(id);
  if (!store) {
    const saved = readStorage(kind, key);
    store = createStore<unknown>(saved === undefined ? initial : saved);
    stores.set(id, store);
  }
  return store as Store<T>;
}

// useStateと同じ戻り値で、値をブラウザの保存領域に残す。保存された値の型は検証しない。
export function usePersistedState<T>(
  key: string,
  initial: T,
  kind: StorageKind = "local",
): [T, (next: T | ((prev: T) => T)) => void] {
  const store = storeFor(kind, key, initial);
  const value = useStore(store);
  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const resolved = typeof next === "function" ? (next as (prev: T) => T)(store.get()) : next;
      store.set(resolved);
      writeStorage(kind, key, resolved);
    },
    [store, kind, key],
  );
  return [value, setValue];
}
