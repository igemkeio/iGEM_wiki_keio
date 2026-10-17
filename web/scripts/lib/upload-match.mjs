// iGEMはアップロードでファイル名を作り変える(PNGの拡張子が.avifになる、日本語が切り詰められて小文字になる)。
// アップロード前後の一覧の差分から、元のファイル名に対応する名前を保守的に引き当てる純関数。fsにもネットワークにも触れない。

function splitName(name) {
  const dot = name.lastIndexOf(".");
  return dot <= 0
    ? { base: name, ext: "" }
    : { base: name.slice(0, dot), ext: name.slice(dot) };
}

// 基底名の先頭から続くASCII英数字とハイフンを小文字にし、末尾のハイフンを落とした部分。
function asciiPrefix(base) {
  return /^[A-Za-z0-9-]*/u.exec(base)[0].toLowerCase().replace(/-+$/u, "");
}

// 1ファイルぶんの候補。完全一致、同じ基底名で拡張子だけ違う名前、ASCIIの先頭部分で前方一致する名前の順に絞り、
// 最初に1つ以上見つかった段階で打ち切る。1つなら{ name }、複数なら{ ambiguous }、無ければ{}を返す。
function findCandidate(name, after, fresh) {
  if (after.has(name)) {
    return { name };
  }
  const { base } = splitName(name);
  const stages = [
    (candidate) => splitName(candidate).base === base,
    (candidate) => {
      const prefix = asciiPrefix(base);
      return prefix !== "" && splitName(candidate).base.startsWith(prefix);
    },
  ];
  for (const stage of stages) {
    const found = fresh.filter(stage);
    if (found.length === 1) {
      return { name: found[0] };
    }
    if (found.length > 1) {
      return { ambiguous: found };
    }
  }
  return {};
}

// names: アップロードしたファイル名、before、after: アップロード前後のディレクトリの名前の一覧。
// 戻り値は { matched: Map(元の名前 → 一覧の名前), unmatched: [元の名前] }。
// 新しく現れた名前(after − before)のうち、他のファイルの完全一致に使われたものと、2つ以上のファイルが同じ候補を指したものは使わない。
export function matchUploadedNames(names, before, after) {
  const beforeSet = new Set(before);
  const afterSet = new Set(after);
  const exact = new Set(names.filter((name) => afterSet.has(name)));
  const fresh = [...afterSet].filter(
    (name) => !beforeSet.has(name) && !exact.has(name)
  );

  const picks = new Map();
  for (const name of names) {
    const found = findCandidate(name, afterSet, fresh);
    if (found.name !== undefined) {
      picks.set(name, found.name);
    }
  }
  const claims = new Map();
  for (const picked of picks.values()) {
    claims.set(picked, (claims.get(picked) ?? 0) + 1);
  }
  const matched = new Map();
  for (const [name, picked] of picks) {
    if (claims.get(picked) === 1) {
      matched.set(name, picked);
    }
  }
  return { matched, unmatched: names.filter((name) => !matched.has(name)) };
}
