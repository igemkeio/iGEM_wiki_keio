// 同期で消す JSON を選ぶ。existingFiles と keep は "<locale>/<name>.json" 形式。
// source が "local" の JSON と、読めない JSON は消さない。読めないものは unreadable に返す。
export function staleJsonFiles(existingFiles, keep, readJson) {
  const stale = [];
  const unreadable = [];
  for (const file of existingFiles) {
    if (!file.endsWith(".json") || keep.has(file)) continue;
    let data;
    try {
      data = readJson(file);
    } catch {
      unreadable.push(file);
      continue;
    }
    if (data?.source === "local") continue;
    stale.push(file);
  }
  return { stale, unreadable };
}
