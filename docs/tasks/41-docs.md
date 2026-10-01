# 実装指示書: #41 文書を新構成に更新する

Issue: https://github.com/igemkeio/iGEM_wiki_keio/issues/41
設計メモ: docs/architecture.md
前提: `origin/feature/vite-mpa` から `docs/41-update-docs` を切る。#40 がマージされてから着手する

## 目的

新しい人が `README.md` と `AGENTS.md` だけを読んで `npm run dev` まで辿れる状態にする。Next.js、yarn、Flask、Bootstrap の記述を消す。

## 変更範囲

- `AGENTS.md`(新規): 運用ルールの本体。内容は、リポジトリの構成(`web/`、`content/`、`docs/`、`notion-trigger/`)、開発の流れ(ブランチ、コミット規約、PR、CI、lefthook)、コードの約束(ビルド時コードで `window`/`document` を触らない、島の足し方、CSS の書き方、原稿 JSON の形式へのリンク)、テスト方針(層と `e2e/README.md` の対応表へのリンク)、Notion 同期の運用(`docs/notion-sync.md` へのリンク)、iGEM の規定(外部リソース、画像の置き場所、LICENSE)。長さは pachira の AGENTS.md ほど要らない。200行以内
- `CLAUDE.md`: `@AGENTS.md` を読み込むだけにする(1〜3行)
- `CONTRIBUTING.md`: `AGENTS.md` と重複する部分を消し、人向けの手順(環境構築、PR の出し方、レビューの受け方)だけにする。`yarn`、`Next.js`、`wiki/`、`static/` の記述を消す
- `README.md`: iGEM テンプレートの文面(Flask、venv、`python app.py`、Bootstrap)を消し、プロジェクトの説明、ディレクトリ構成、クイックスタート(`cd web && npm ci && npm run dev`)、文書へのリンク(`AGENTS.md`、`docs/architecture.md`、`docs/notion-sync.md`、`content/README.md`、`web/README.md`、`e2e/README.md`)。LICENSE(CC BY 4.0)の記述は残す
- `web/README.md`: 古い記述(「#27で更新予定」、消えた `static/`、`people/` の除外の説明)を直す。節の順序を、コマンド、開発、ビルドと配信、テスト、Lint、仕組み(プリレンダー、レイアウト、島、永続化、3D、フォント、画像)に整える
- `docs/architecture.md`: 最終状態に合わせて直す(Tailwind を入れない記述、島の一覧、Draco の記述、Vercel の Root Directory、GitLab の `$CI_PROJECT_NAME`、テストの実態)。「範囲外」に残っているものを確認
- `docs/notion-sync.md`: 全体を読み直し、`wiki/pages` と yarn の残りを消す
- `docs/tasks/`: そのまま残す(実装の経緯の記録)
- `.github/ISSUE_TEMPLATE/*.md`: `yarn` などの記述があれば直す
- `notion-trigger/README.md`: 変更があれば

## 受け入れ条件

- `git grep -n -i -e yarn -e next.js -e flask -e bootstrap -e 'wiki/pages' -e 'static/'` が `docs/tasks/`、`docs/architecture.md` の「選定の理由」(Next.js をやめた経緯として残す)、`web/package-lock.json` 以外で0件
- `README.md` のクイックスタートどおりに実行して `npm run dev` が動く
- `AGENTS.md` が200行以内で、`CLAUDE.md` が `@AGENTS.md` を読むだけ
- 日本語の文書の規約(太字なし、カギ括弧なし、英単語と数字の両端に半角スペースなし)を全文書で守る。既存の文も直す

## 規約

- コミットは `docs:`。ファイルごとか論点ごとに分ける
- Claude の痕跡を付けない
- PR は作らず、push して本文の案を報告する
