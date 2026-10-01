# 実装指示書: #34 Flask と Bootstrap 由来のファイルを消す

Issue: https://github.com/igemkeio/iGEM_wiki_keio/issues/34
前提: #28 と #27 がマージ済みの `feature/vite-mpa` から分岐する

## 目的

iGEM 公式テンプレート由来の Flask、Jinja、Bootstrap と、Next.js 時代の `web/public/` の残骸を消し、リポジトリを新構成だけにする。

## 消すもの

- `wiki/layout.html`、`wiki/menu.html`、`wiki/footer.html`、`wiki/pages/`、`wiki/pages_md/`(`wiki/` ディレクトリごと)
- `static/`(Bootstrap の CSS と JS、`style.css`)
- `web/public/static/`(Bootstrap のコピー)、`web/public/people/`(Next.js 時代のメンバー写真。MemberList は `static.igem.wiki` の URL を使う)
- `web/public/notion-images/` は消さない(#27 の同期が引き続き書く。#13 で扱う)
- `web/scripts/notion-sync.mjs` の `NOTION_SYNC_LEGACY_HTML` の分岐と `web/scripts/lib/legacy.mjs`(とそのテスト)。`main` の Next.js 版は、この統合ブランチが `main` に入る時点で消えるので、旧形式を出す必要がなくなる
- `docs/notion-sync.md` の旧形式の記述
- `.gitlab-ci.yml` は #38 で書き換えるので触らない

## 足すもの(同じファイルを触るのでここで行う)

- `web/scripts/notion-sync.mjs` に、slug から `islands` を決める表 `ISLANDS_BY_SLUG = { members: ["member-list"] }` を足し、JSON の `islands` に出す。#31 で手置きした `content/*/members.json` が同期で上書きされても島が消えないようにするため。`web/scripts/lib/page.mjs` の `buildPage` に `islands` を通し、テストを足す。`docs/notion-sync.md` に表の場所を書く
- `web/src/islands.ts`(#31)の名前と `ISLANDS_BY_SLUG` の名前が一致していることを `npm run check`(#36)で検査するのは別 Issue とし、ここでは README に手で揃える旨を書く

## 触らないもの

- `web/src/`、`content/`、`vercel.json`、`.github/`、`notion-trigger/`、`README.md`(#41)

## 受け入れ条件

- `git grep -n -e url_for -e '{% block' -e bootstrap -e LEGACY_HTML` が、`docs/architecture.md` と `docs/tasks/` 以外で0件
- `npm run build && npm run check`、`npm test`、`corepack yarn test:sync`(または npm 化後の `npm run test:sync`)が通る
- `dist/` に `static/`、`people/` が無い

## 規約

- コミットは `rm:` を使い、消す単位で分ける(wiki と static、web/public の残骸、同期の旧形式)
- Claude の痕跡を付けない
- PR は作らず、push して本文の案を報告する
