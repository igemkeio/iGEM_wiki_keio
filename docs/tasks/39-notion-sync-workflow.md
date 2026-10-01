# 実装指示書: #39 GitHub Actions の notion-sync を新構成に合わせる

Issue: https://github.com/igemkeio/iGEM_wiki_keio/issues/39
前提: #27 と #26 がマージ済みの `feature/vite-mpa` から分岐する(npm と `content/` 出力の両方が必要)

## 目的

`.github/workflows/notion-sync.yml` を、yarn から npm に、`wiki/pages/` から `content/` に合わせる。

## 変更範囲

- `.github/workflows/notion-sync.yml`
  - `corepack enable` と `yarn install --immutable` を `npm ci` に。Node は `.node-version` を読む(`actions/setup-node` の `node-version-file`)
  - `yarn notion:sync` を `npm run notion:sync` に
  - `peter-evans/create-pull-request` の `add-paths` を `content/**` に限る(`web/public/notion-images/` は今まで通り含めるかを判断: 含める。#13 までは暫定で画像をリポジトリに持つため)
  - PR のタイトルと本文の `wiki/pages/*.html` を `content/<locale>/<slug>.json` に
  - 同期の最後に `content/images-todo.json` の件数と先頭10件をジョブのサマリー(`$GITHUB_STEP_SUMMARY`)に出す(ファイル自体は gitignore されているので、人が見る手段として)
  - 同期後に `npm run build && npm run check` を走らせ、落ちたら PR を作らずにジョブを失敗させる(壊れた原稿を PR にしない)
- `docs/notion-sync.md`: yarn の表記を npm に、ワークフローの説明を更新
- `notion-trigger/README.md`: 変更があれば(通常は無い)

## 触らないもの

- `web/`、`content/`、他のワークフロー、`vercel.json`、`.gitlab-ci.yml`(#38)

## 受け入れ条件

- `workflow_dispatch` で手動実行し、PR が作られ、差分が `content/` と `web/public/notion-images/` だけであること(実行はメインセッションかユーザーが行う。実装者は YAML を `actionlint` 相当で検査できれば検査し、できなければ構文の目視確認を報告に書く)
- ジョブのサマリーに images-todo の件数が出る
- `docs/notion-sync.md` に yarn の記述が残っていない

## 規約

- コミットは `ci:` と `docs:` で分ける
- Claude の痕跡を付けない
- PR は作らず、push して本文の案を報告する
