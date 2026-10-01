# 実装指示書: #31 islands.tsx の土台と MemberList の島

Issue: https://github.com/igemkeio/iGEM_wiki_keio/issues/31
設計メモ: docs/architecture.md(「島」「状態の永続化」)
原稿の形式: content/README.md(`islands` フィールド)
前提: #28 がマージ済みの `feature/vite-mpa` から分岐する

## 目的

対話が必要な部品だけをブラウザで動かす仕組みを作り、最初の島として MemberList を移す。島のないページには React の JS を配信しない。

## 変更範囲

触るファイル

- `web/src/islands.tsx`(新規): 島の名前と部品の対応表。`document.querySelectorAll("[data-island]")` で器を見つけ、`data-props` を JSON.parse して `createRoot(el).render(<Comp {...props} />)` する。対応表に無い名前は `console.warn` して飛ばす
- `web/src/main.tsx`: `islands.tsx` を import して起動する。ここはブラウザでしか動かない(ビルド時に Node で実行されない)ので `document` を使ってよい。ただし `src/` のビルド時コードとの境界をはっきりさせるため、ブラウザ専用のコードは `web/src/client/` に置き、`main.tsx` は `import "./client/islands"` の1行を足すだけにする(`islands.tsx` は `web/src/client/islands.tsx`)
- `web/src/components/Island.tsx`(新規): ビルド時に器を出す部品。`<Island name="member-list" props={{...}} />` が `<div data-island="member-list" data-props='...'></div>` を出す。`props` の JSON は `&` `<` `>` `"` をエスケープする
- `web/src/components/MemberList.tsx` と `.module.css`(新規): 島の中身。`web/src/data/members.json` を読む。メンバーの一覧(名前、役割、写真)と、クリックで開くモーダル(`<dialog>`、`showModal()`、Esc とオーバーレイのクリックで閉じる、閉じるボタン)。写真は `static.igem.wiki` の URL をそのまま使い、無ければ出さない
- `web/src/components/ArticlePage.tsx`: `page.islands` に `member-list` が含まれるとき、本文の後に `<Island name="member-list" props={{ locale }} />` を出す。島の名前と差し込み位置の対応は `ArticlePage` に小さな表として持つ(将来の島はここに足す)
- `web/src/Page.tsx`: `islands` が空でないときの `<script type="module">` は #26 で入っている。島ごとに JS を分ける(`manualChunks` や島ごとのエントリ)ことはこの Issue ではしない。設計メモの「挙がった島の JS だけを読み込む」は、島が複数になったときに別 Issue で扱う
- `web/src/data/members.json`: いまの形(Next.js 時代)を読んで、必要なら `locale` ごとの名前と役割を持つ形に整える。形を変えたら `content/README.md` に1節足す
- `web/vite.config.ts`: 必要なら `build.rollupOptions.input` を調整(通常は `index.html` のエントリのままで足りる)
- テスト: `MemberList.test.tsx`(クリックでモーダルが開く、Esc で閉じる、閉じるボタンで閉じる。happy-dom の `<dialog>` の `showModal` が無ければ `HTMLDialogElement.prototype.showModal` をテスト内で補う)、`Island.test.tsx`(器の属性とエスケープ)、`Page.test.tsx` に島のあるページで module script が1本出るケース
- `content/en/members.json` と `content/ja/members.json`: Notion の `members` ページに `islands: ["member-list"]` を付ける必要がある。これは Notion の DB 側で `islands` を扱えないので、同期スクリプト側で slug ごとの固定の対応(`members` → `["member-list"]`)を持たせる。`web/scripts/notion-sync.mjs` に `ISLANDS_BY_SLUG` の小さな表を足し、`docs/notion-sync.md` に書く。この部分だけ `web/scripts/` を触る

触らないファイル

- `routes.ts`、`content.ts`、`Sidebar`、`Footer`、`PageShell`、`Toc`、`prose.css`、`web/scripts/prerender.mjs`

## 約束

- `web/src/client/` 以外のビルド時コードでは `window`、`document` を参照しない。`MemberList.tsx` は `createRoot` でブラウザでだけ描画されるので `useState` と `useRef` を使ってよいが、モジュールの最上位で `document` を触らない(import 時に Node で評価されないよう、`islands.tsx` から動的 import するか、参照を関数の中に閉じる)
- 島の `props` は JSON にできる値だけ

## 受け入れ条件

- `/members/` と `/ja/members/` でメンバー一覧が出て、クリックでモーダルが開き、Esc、オーバーレイ、閉じるボタンで閉じる(`npm run build && npm run preview` を Chrome で開いて確認。ヘッドレスなら `--dump-dom` ではなくスクリーンショットで)
- `/` や `/model/` など島のないページの HTML に `<script>` が無い。`/members/` には `<script type="module">` が1本ある
- `npm run check`、`npm test`、`npm run typecheck`、`npm run build` が通る
- `grep -rnE '\b(window|document)\b' web/src --include=*.ts --include=*.tsx` の結果が `web/src/client/` と `MemberList.tsx` の関数内だけ
- `web/scripts/notion-sync.mjs` の変更は `ISLANDS_BY_SLUG` の追加と JSON への反映だけ(`corepack yarn test:sync` が通る。Notion への接続は不要)

## 規約

- コミットは `<prefix>: 日本語一行。`。1コミット1論理単位(Island と islands.tsx の土台、MemberList、ArticlePage への差し込み、同期の ISLANDS_BY_SLUG、テスト)
- コメントと README は日本語。太字とカギ括弧を使わず、英単語や数字の両端に半角スペースを入れない
- Claude の痕跡を付けない
- PR は作らず、push して本文の案を報告する
