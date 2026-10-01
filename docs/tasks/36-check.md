# 実装指示書: #36 npm run check(出力の検査)

Issue: https://github.com/igemkeio/iGEM_wiki_keio/issues/36
設計メモ: docs/architecture.md(「iGEMの規定への対応」「テスト」の節)

## 目的

ビルド後の `dist/` を走査して、iGEM の規定違反や壊れたページを CI で落とせるようにする。

## 作業ブランチ

- `origin/feat/26-vite-prerender` から `feat/36-check` を切る。PR は `feature/vite-mpa` に向ける。

## 変更範囲

触るファイル

- `web/scripts/check.mjs`(新規)と、検査の関数を置く `web/scripts/lib/check/`(新規)。関数は fs に依存しない純粋関数にし、`web/scripts/lib/check/*.test.mjs` に node:test でテストを書く(Vitest は #35 で入るが、同時進行なので使わない)
- `web/package.json`: scripts に `check`(`node scripts/check.mjs`)と `test:check`(`node --test "scripts/lib/check/*.test.mjs"`)を足す。依存は足さない(HTML の解析は正規表現か、Node 組み込みで済ませる。どうしても要るなら `node-html-parser` のような小さいものを1つだけ)。他の行は触らない
- `web/README.md`: `npm run check` の説明

触らないファイル

- `web/src/`、`web/scripts/prerender.mjs`、`dev.mjs`、`content/`、CI

## 検査の内容

`dist/` の `**/*.html` と `**/*.css` を対象にする。`dist/notion-images/`、`dist/people/`、`dist/static/` などの `web/public/` 由来のディレクトリは、HTML と CSS 以外は読まない。

1. ページ数。`content/*/*.json` のうち `published !== false` の数と、`dist/**/index.html` の数が一致する
2. 外部 URL。HTML の `src`、`href`(`<a>` は除く。`<link>`、`<script>`、`<img>`、`<source>`、`<video>`、`<iframe>` が対象)と、CSS の `url(...)` について、`http://` か `https://` で始まるものは、ホストが `static.igem.wiki`、`video.igem.org`、`*.igem.org`、`*.igem.wiki` のどれかであること。それ以外は違反。`<a href>` の外部リンクは許す
3. 内部リンク。`href` と `src` が `/` で始まる相対パス(`base` 込み)なら、`dist/` 内にファイルか `index.html` が存在する。`#` だけの href と `mailto:` は無視
4. 構造。各 HTML に `<title>` と `<h1>` が1つずつある。`<img>` に `alt` 属性がある(空文字は許す)
5. `<html lang>` が `en` か `ja`
6. 島。`content/` で `islands` が空のページの HTML に `<script` が無い

各違反は `ファイル: 理由` の1行で出し、最後に件数を出して、1件でもあれば終了コード1。環境変数 `WIKI_BASE` を読んで、内部リンクの先頭の `base` を除いてから `dist/` を探す。

## 受け入れ条件

- `npm run build && npm run check` が現在の `dist/` に対して通る(違反0件)。ただし `web/public/` 由来の `dist/static/bootstrap.min.css` 内の外部 URL(あれば)は #34 で消えるまで残るので、検査対象を `dist/assets/**/*.css` と HTML に限ることで通す。この制限は README に書く
- 意図的に `content/en/home.json` の html に `<img src="https://example.com/x.png">` を入れてビルドすると、`check` がその行を出して終了コード1になる(確認後に戻す)
- `WIKI_BASE=/keio/ npm run build && WIKI_BASE=/keio/ npm run check` も通る
- `npm run test:check` が通る

## 規約

- コミットは `<prefix>: 日本語一行。`。1コミット1論理単位(検査関数とテスト、check.mjs、package.json、README)
- コメントと README は日本語。太字とカギ括弧を使わず、英単語や数字の両端に半角スペースを入れない
- Claude の痕跡を付けない
- PR は作らず、push して本文の案を報告する
