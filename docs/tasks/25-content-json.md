# 実装指示書: #25 原稿JSONの形式を決めてサンプルを置く

Issue: https://github.com/igemkeio/iGEM_wiki_keio/issues/25
設計メモ: docs/architecture.md(特に「原稿の受け渡し形式」「デザイン」の節)

## 目的

Notion同期(#27)とプリレンダー(#26)をつなぐ受け渡し形式を固定する。この2つは並列に進むので、ここで決めた形式が両者の唯一の約束事になる。

## 作業ブランチ

- 統合ブランチは`feature/vite-mpa`。ここから`feat/25-content-json`を切る。
- `main`ではなく`feature/vite-mpa`に向けてPRを出す。

## 変更範囲

触るファイル(すべて新規)

- `content/README.md`: フィールドの定義、例、Figureカード・NoteのHTMLの形
- `content/en/home.json`、`content/ja/home.json`: サンプル。`wiki/pages/home.html`と`wiki/pages/ja/home.html`の`{% block %}`の中身から起こす
- `web/src/content.ts`: `WikiPage`型と`Locale`型。実行時コードは含めない(型と、JSONを型として読むための最小の関数のみ)

触らないファイル

- `web/`の既存のNext.jsのコード、`wiki/pages/`、`scripts/`、CI、文書(READMEなど)

## 形式

`content/<locale>/<slug>.json`。1ページ1ファイル。

| フィールド | 型 | 必須 | 内容 |
|---|---|---|---|
| `slug` | string | 必須 | URLの一部。`home`は`/`(jaは`/ja/`)に対応する |
| `locale` | `"en"` \| `"ja"` | 必須 | |
| `title` | string | 必須 | ページの見出し(h1)。英語は大文字表示するがデータは原文のまま |
| `subtitle` | string | 任意 | 見出しの下の小見出し。enのページでは日本語(例: 結果)、jaのページでは英語 |
| `lead` | string | 任意 | リード文。簡単なHTMLを含んでよい |
| `html` | string | 必須 | 本文。見出しには`id`が付いている。空文字も許す |
| `order` | number | 任意 | ナビとHomeのカードの並び順。省略時は末尾。同値はslugの辞書順 |
| `islands` | string[] | 任意 | このページで使う島の名前。省略時は空配列 |
| `published` | boolean | 任意 | 省略時はtrue。falseのページはビルドから除く |

- 未知のフィールドは無視する(将来の拡張のため、バリデーションで落とさない)。
- `home`は`order: 0`にする。

## Figureカード・NoteのHTMLの形

`html`の中に同期スクリプトが出し、`prose.css`(#29)が受ける。READMEにこの形をそのまま書く。

```html
<figure class="figure-card">
  <div class="figure-card__media">
    <img src="https://static.igem.wiki/teams/xxxx/fig1.png" alt="...">
  </div>
  <figcaption class="figure-card__body">
    <p class="figure-card__label">Fig. 1</p>
    <h3 class="figure-card__title">見出し</h3>
    <p>説明</p>
  </figcaption>
</figure>

<aside class="note">
  <p class="note__label">Note</p>
  <p>本文</p>
</aside>
```

## 受け入れ条件

- サンプル2ファイルが`web/src/content.ts`の型に合う(`tsc`で確認する簡単なテストか、型注釈付きのimportで示す)
- `content/README.md`に、全フィールドの表、省略時の扱い、FigureカードとNoteのHTMLの形がある
- 既存のNext.jsのビルドとlintが壊れていない(`cd web && yarn lint`)

## 規約

- コミットは`<prefix>: 日本語一行。`(末尾に句点)。新規追加は`add:`。1コミット1論理単位。
- コメントとREADMEは日本語。太字とカギ括弧は使わない。
- コミット・PRにClaudeの痕跡(Co-Authored-By、Generated with)を付けない。
- PRのタイトルは日本語、本文は常体、`Closes #25`を入れる。PR作成の前に本文をメインセッションに見せる(実装者はPRを作らず、ブランチをpushして本文の案を報告するまで)。
