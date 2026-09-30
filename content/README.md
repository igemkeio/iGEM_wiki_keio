# 原稿JSON

Notion同期とプリレンダーをつなぐ受け渡し形式。同期スクリプトがここに書き、プリレンダーがここを読む。型は`web/src/content.ts`の`WikiPage`と`Locale`。

## 置き場所

`content/<locale>/<slug>.json`。1ページ1ファイル。`locale`は`en`か`ja`。

## フィールド

| フィールド | 型 | 必須 | 内容 |
|---|---|---|---|
| `slug` | string | 必須 | URLの一部。`home`は`/`(jaは`/ja/`)に対応する |
| `locale` | `"en"` または `"ja"` | 必須 | ページの言語 |
| `title` | string | 必須 | ページの見出し(h1)。英語は大文字表示するがデータは原文のまま |
| `subtitle` | string | 任意 | 見出しの下の小見出し。enのページでは日本語(例: 結果)、jaのページでは英語 |
| `lead` | string | 任意 | リード文。簡単なHTMLを含んでよい |
| `html` | string | 必須 | 本文。見出しには`id`が付いている。空文字も許す |
| `order` | number | 任意 | ナビとHomeのカードの並び順。省略時は末尾。同値はslugの辞書順 |
| `islands` | string[] | 任意 | このページで使う島の名前。省略時は空配列 |
| `published` | boolean | 任意 | 省略時はtrue。falseのページはビルドから除く |

- 未知のフィールドは無視する。将来の拡張のため、バリデーションで落とさない。
- `home`は`order: 0`にする。
- `slug`と`locale`の組がURLになる。`en`は`/model/`、`ja`は`/ja/model/`。
- `html`は同期時にMarkdownから変換済みで、見出しには`id`が付いている。

## 例

```json
{
  "slug": "model",
  "locale": "en",
  "title": "Model",
  "subtitle": "モデル",
  "lead": "<b>簡単なHTML</b>を含んでよい",
  "html": "<h2 id=\"overview\">Overview</h2><p>...</p>",
  "order": 30,
  "islands": ["model-sim"],
  "published": true
}
```

サンプルは`en/home.json`と`ja/home.json`。

## FigureカードとNoteのHTMLの形

`html`の中に同期スクリプトが次の形で出す。スタイルは`prose.css`が受ける。

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
