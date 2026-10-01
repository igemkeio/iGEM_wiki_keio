# 実装指示書: #40 lefthook の pre-commit と run-check skill

Issue: https://github.com/igemkeio/iGEM_wiki_keio/issues/40
設計メモ: docs/architecture.md(「ツールチェーン」「テスト」「運用」)
前提: `origin/feature/vite-mpa` から `feat/40-lefthook` を切る。#37(E2E)がマージされてから着手する(整形が E2E のファイルにも掛かるため)

## 目的

Lint と Format を Ultracite 経由の oxlint と oxfmt に揃え、lefthook の pre-commit で自動修正する。変更範囲に応じた確認をエージェントに実行させる skill を置く。

## 変更範囲

- `web/package.json`: devDependencies に `ultracite`、`oxlint`、`oxfmt`、`lefthook`。scripts に `check:code`(`ultracite check`)、`fix`(`ultracite fix`)、`prepare`(`lefthook install`)。既存の `check`(dist の検査)とは名前を分ける
- `web/oxlint.config.ts`、`web/oxfmt.config.ts`: Ultracite のプリセットを継承する最小の設定(参考: `~/Documents/medical-shift/repos/pachira` の同名ファイル。ただし Next.js と Tailwind の設定は入れない)。oxfmt の対象に `.ts`、`.tsx`、`.mjs`、`.css`、`.json`、`.md` を含める。`src/__snapshots__/`、`e2e/**/*-snapshots/`、`public/`、`dist/` は除外
- `lefthook.yml`(リポジトリ直下): pre-commit で、ステージした `web/` 配下のファイルに oxfmt --write → oxlint --fix を直列で実行し、`git add` し直す。`tsc --noEmit` は変更ファイルが `.ts`/`.tsx` のときだけ。gitleaks のフックが既に動いているなら共存させる(`lefthook.yml` に同居させるか、既存の仕組みを残す。既存の設定を確認して報告)
- 一度 `npm run fix` を全体に掛け、整形の差分を1コミット(`style: oxfmt と oxlint で全体を整形。`)にまとめる。整形で挙動が変わらないことを `npm test`、`npm run test:sync`、`npm run test:check`、`npm run build && npm run check` で確認する。lint のエラーが出たら、ルールを緩めるのではなく、理由を見て直すか、理由が妥当なら `oxlint.config.ts` で個別に無効化し、コメントに理由を書く
- `.github/workflows/ci.yml`: `lint` ジョブ(`npm run check:code`)を足し、`ci-passed` の needs に加える
- `.claude/skills/run-check/SKILL.md`(新規): 変更範囲からスモークを選んで流す手順。`e2e/README.md` の対応表を参照する。`npm run build && npm run check`、該当する Vitest と E2E、agent-browser(入っていれば)で変更したページを開いて確かめる手順。pachira の `skills/run-e2e/SKILL.md` を参考にする
- `.claude/settings.json`(新規または追記): `npm test`、`npm run typecheck`、`npm run check`、`npm run check:code`、`npm run fix`、`npm run build`、`npm run test:e2e` を確認なしで実行できる許可
- `web/README.md`: Lint と Format の節、pre-commit の節
- `CONTRIBUTING.md` の `yarn lint` と Prettier の記述は #41 で直すので触らない

## 受け入れ条件

- `npm run check:code` がエラー0
- 変更ファイルをステージして `git commit` すると、整形と lint の修正が自動で入る(実際に1ファイルに空白を足してコミットし、直ることを確認。確認用のコミットは消す)
- CI の `lint` ジョブが通る
- `npm test`、`npm run test:sync`、`npm run test:check`、`npm run build && npm run check`、`npm run test:e2e` が整形後も通る
- skill の手順どおりに実行して結果が読める

## 規約

- コミットは `<prefix>: 日本語一行。`(導入 chore:、整形 style:、CI ci:、skill add:、文書 docs:)
- 日本語、太字とカギ括弧なし、英単語の両端のスペースなし
- Claude の痕跡を付けない
- PR は作らず、push して本文の案を報告する
