# 実装指示書: #35 Vitest と Testing Library を入れ、プリレンダーのスナップショットテストを書く

Issue: https://github.com/igemkeio/iGEM_wiki_keio/issues/35
設計メモ: docs/architecture.md(「テスト」の節)

## 目的

ユニットテストとコンポーネントテストの土台を入れ、いまある純粋なロジック(`routes.ts`、`content.ts`)とプリレンダーの出力をテストで固定する。

## 作業ブランチ

- `origin/feat/26-vite-prerender` から `feat/35-vitest` を切る。PR は `feature/vite-mpa` に向ける。

## 変更範囲

触るファイル

- `web/package.json`: devDependencies に vitest、@testing-library/react、@testing-library/jest-dom、@testing-library/user-event、happy-dom を足す。scripts に `test`(`vitest run`)と `test:watch`(`vitest`)を足す。他の行は触らない(#28 と #36 が同じファイルを触っている)
- `web/package-lock.json`
- `web/vitest.config.ts`(新規)、`web/src/test/setup.ts`(新規、jest-dom の matcher を登録)
- `web/src/routes.test.ts`、`web/src/content.test.ts`(新規)
- `web/src/Page.test.tsx`(新規): プリレンダーのスナップショット
- `web/src/__snapshots__/`(Vitest が生成)
- `web/tsconfig.json`: `types` に `vitest/globals` を足す必要があれば足す(globals を使わず import する方針なら不要)
- `web/README.md`: テストの実行とスナップショットの更新手順を足す

触らないファイル

- `web/src/Page.tsx`、`routes.ts`、`content.ts`、`web/scripts/`、`content/`

## テストの内容

### routes.test.ts

`routes.ts` は `import.meta.glob` で `content/` を読むので、そのままではテストで入力を差し替えにくい。`routes.ts` の中で、glob の結果(`Record<string, unknown>`)を受け取ってページ一覧を作る純粋関数(`buildRoutes(modules)` など)が切り出せる形になっているか確認し、なっていなければ、その切り出しだけを最小の変更で行う(挙動は変えない)。テストはこの純粋関数に対して書く。

- published: false を除く
- URL の規則(home は `/` と `/ja/`、他は `/<slug>/` と `/ja/<slug>/`)
- order 昇順、同値は slug の辞書順
- path の衝突で throw し、メッセージに2つのファイルが入る

### content.test.ts

- 必須フィールドが欠けると throw し、source がメッセージに入る
- 既定値(subtitle、lead は空文字、order は Number.MAX_SAFE_INTEGER、islands は []、published は true)
- 未知のフィールドが落ちない

### Page.test.tsx

- `renderToStaticMarkup(<Page ... />)` の結果をスナップショットにする。入力は en と ja の最小のページ(title、subtitle、lead、html に h2 が1つ)と、`islands: ["x"]` のページの3つ
- スナップショットとは別に、`lang` 属性、`<title>`、`<h1>`、`islands` が空なら `<script>` が無いこと、を個別の assert でも確認する(スナップショットが更新されても意図が残るように)
- `assets` の引き渡し方は `Page.tsx` の現状に合わせる

### 設定

- `vitest.config.ts`: `environment: "happy-dom"`、`setupFiles: ["src/test/setup.ts"]`、`include: ["src/**/*.test.{ts,tsx}"]`。`vite.config.ts` を `mergeConfig` で継承するか、独立させるかは、`import.meta.glob` と `define` が動く方を選ぶ
- `web/scripts/lib/*.test.mjs`(#27 が node:test で書いている)はこの Issue では触らない。Vitest への移行は #27 のマージ後に別で行う

## 受け入れ条件

- `npm test` が通る(3ファイル)
- `npm run typecheck` がエラー0(テストファイルも含む)
- `npm run build` が引き続き通る
- `web/README.md` に、`npm test`、`npm run test:watch`、スナップショットの更新(`npx vitest run -u`)の手順がある

## 規約

- コミットは `<prefix>: 日本語一行。`。1コミット1論理単位(Vitest の導入、routes のテスト、content のテスト、Page のスナップショット、README)
- コメントと README は日本語。太字とカギ括弧を使わず、英単語や数字の両端に半角スペースを入れない
- Claude の痕跡を付けない
- PR は作らず、push して本文の案を報告する
