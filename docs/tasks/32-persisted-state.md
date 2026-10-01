# 実装指示書: #32 状態の永続化、島の間の共有ストア、View Transitions

Issue: https://github.com/igemkeio/iGEM_wiki_keio/issues/32
設計メモ: docs/architecture.md(「状態の永続化」「アニメーション」)
前提: #31(島)の上に積む。`origin/feat/31-islands` から `feat/32-persisted-state` を切り、PR は `feature/vite-mpa` に向ける

## 目的

MPA でページをまたいで状態を持つ仕組みと、島の間で状態を共有する仕組みを作る。View Transitions の CSS は #28 で入っているので、ここでは言語の選択を保存する実装と、保存の仕組みのテストが中心になる。

## 変更範囲

触るファイル(すべて `web/src/client/` 以下。ブラウザでしか動かないコード)

- `web/src/client/storage.ts`(新規): `readStorage(kind, key)`、`writeStorage(kind, key, value)`。`kind` は `"local"` か `"session"`。`localStorage` が例外を投げる環境(private mode、無効化)では読みは `undefined`、書きは何もしない。値は JSON で保存し、壊れた JSON は `undefined` として扱う
- `web/src/client/usePersistedState.ts`(新規): `usePersistedState<T>(key, initial, kind = "local")`。`useState` と同じ戻り値。初回は storage から読み(無ければ `initial`)、変更のたびに書く。同じ key を使う島が同じページに複数あっても整合するよう、内部は `useSyncExternalStore` と、下の `createStore` を使う
- `web/src/client/store.ts`(新規): `createStore<T>(initial)` が `{ get, set, subscribe }` を返すモジュールスコープのストア。`useStore(store)` が `useSyncExternalStore` で購読する。島の間で状態を共有するときはこれを使う。設計メモどおり、状態管理ライブラリは入れない
- `web/src/client/locale.ts`(新規): 言語の選択を保存する。`rememberLocale(locale)` が `localStorage` の `wiki:locale` に書く。自動で飛ばす処理は作らない(設計メモ)。Sidebar の言語切り替えリンクのクリックで保存する必要があるが、Sidebar はビルド時コードで JS を持たないので、`client/locale.ts` が `document.querySelectorAll("a[hreflang]")` にクリックの listener を付ける形にする。`main.tsx` から `rememberLocaleOnClick()` を呼ぶ。ただし、島のないページには JS が配信されないので、この保存は島のあるページでしか動かない。これは設計上の制約として `web/README.md` に書く(言語の保存を全ページで行いたくなったら、数行の素の JS を `public/` に置く別 Issue にする)
- `web/src/client/*.test.ts`(新規): storage(例外を投げる storage、壊れた JSON、往復)、usePersistedState(初期値、書き込み、同じ key の2つの hook が揃う)、store(set で購読者が呼ばれる、useStore が再描画する)、locale(クリックで保存される)
- `web/README.md`: 永続化の節(どの storage に何を置くか、島のないページでは動かないこと)

触らないファイル

- ビルド時コード(`Page.tsx`、`components/`、`routes.ts`)、`web/scripts/`、`content/`、`global.css`(View Transitions は #28 で入っている)

## 受け入れ条件

- `/members/` で言語を切り替えて `/ja/members/` に移ると、`localStorage` の `wiki:locale` が `ja` になっている(Chrome の DevTools か、ヘッドレスで `localStorage.getItem` を評価して確認)
- storage が例外を投げる環境でも島が壊れない(テストで `localStorage` を例外を投げるオブジェクトに差し替えて確認)
- `npm test`、`npm run typecheck`、`npm run build` が通る(Vitest は #35 が統合ブランチに入るまでは `--no-save` で一時導入して走らせ、その旨を報告する)
- 島のないページの HTML に `<script>` が無いまま

## 規約

- コミットは `<prefix>: 日本語一行。`。1コミット1論理単位(storage、store、usePersistedState、locale、README)
- コメントと README は日本語。太字とカギ括弧を使わず、英単語や数字の両端に半角スペースを入れない
- Claude の痕跡を付けない
- PR は作らず、push して本文の案を報告する
