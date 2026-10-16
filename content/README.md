# 原稿JSON

Notion同期とプリレンダーをつなぐ受け渡し形式。同期スクリプトがここに書き、プリレンダーがここを読む。型は`web/src/content.ts`の`WikiPage`と`Locale`。

## 置き場所

`content/<locale>/<slug>.json`。1ページ1ファイル。`locale`は`en`か`ja`。

## フィールド

| フィールド  | 型                   | 必須 | 内容                                                                     |
| ----------- | -------------------- | ---- | ------------------------------------------------------------------------ |
| `slug`      | string               | 必須 | URLの一部。`home`は`/`(jaは`/ja/`)に対応する                             |
| `locale`    | `"en"` または `"ja"` | 必須 | ページの言語                                                             |
| `title`     | string               | 必須 | ページの見出し(h1)。英語は大文字表示するがデータは原文のまま             |
| `subtitle`  | string               | 任意 | 見出しの下の小見出し。enのページでは日本語(例: 結果)、jaのページでは英語 |
| `lead`      | string               | 任意 | リード文。簡単なHTMLを含んでよい                                         |
| `html`      | string               | 必須 | 本文。見出しには`id`が付いている。空文字も許す                           |
| `order`     | number               | 任意 | Homeのカードの並び順。ナビでは`web/src/data/nav-categories.json`にないページだけがこの順に並ぶ。省略時は末尾。同値はslugの辞書順 |
| `islands`   | string[]             | 任意 | このページで使う島の名前。省略時は空配列                                 |
| `models`    | `{ src, poster, alt }[]` | 任意 | 3Dモデルの一覧。省略時は空配列。`model-viewer`島は先頭の1件を表示する |
| `published` | boolean              | 任意 | 省略時はtrue。falseのページはビルドから除く                              |
| `source`    | `"notion"` または `"local"` | 任意 | 省略時はnotion。localはリポジトリ側で置く確認用ページで、Notion同期が消さない |
| `dbtl`      | object               | 任意 | `engineering`のDBTLの構造(サイクルと反復)。Notion同期が`html`から読み取って書く。形は[dbtl](#dbtl)の節 |

- 任意フィールドの既定値は`readPage`が埋める。`WikiPage`型では`subtitle`と`lead`が空文字、`order`が`Number.MAX_SAFE_INTEGER`、`islands`と`models`が空配列、`published`がtrueに、`source`が`"notion"`になる。
- JSONを直接importすると`locale`がstringに広がるので、`readPage`を通して読む。
- 未知のフィールドは無視する。将来の拡張のため、バリデーションで落とさない。
- `home`は`order: 0`にする。
- `slug`と`locale`の組がURLになる。`en`は`/model/`、`ja`は`/ja/model/`。
- `html`は同期時にMarkdownから変換済みで、見出しには`id`が付いている。
- `html`と`lead`の中の`/`で始まるURL(`/notion-images/...`など)は、ビルド時に`src`、`href`、`poster`、`srcset`の先頭へbaseが付く。`//`で始まるURLと絶対URLは変えない。

## dbtl

`engineering`のページだけに付く。`web/scripts/lib/dbtl.mjs`が同期のときに`html`を読んで作る。`html`は変えずに残るので、`dbtl`が無いページは`html`をそのまま表示する。

読み取れる原稿の形は次のとおり。

- 層の見出し(h1かh2): `第 I 部　道具をつくる（基盤サイクル）`。ラベル(`第 I 部`)と題に分ける
- サイクルの見出し(h1かh2): `〔基盤〕① クローニング技術 — 鋳型をいかに取り除くか`。層(`〔基盤〕`は`base`、`〔設計〕`は`design`)、番号(①〜⑥)、題、キャッチに分ける。区切りはem dash
- サイクルの中: 見出しの後に`h3`(なぜこの仮説に至ったか)と本文、仮説と成功基準の2列表、`<strong>反復N — 題</strong>`の段落と直後のDESIGN/BUILD/TEST/LEARNの4列表(反復の数だけ)、`このサイクルで確立したこと`(または`このサイクルの現状`)の段落と本文、`↳ 次のサイクルへ`の段落

| フィールド | 型 | 内容 |
| --- | --- | --- |
| `intro` | string(HTML) | 最初の層の見出しより前の本文 |
| `parts[]` | object[] | `label`、`title`、`introHtml`(層の見出しから最初のサイクルまでの本文)、`cycles[]` |
| `cycles[]` | object[] | `no`(1から連番)、`layer`(`base`か`design`)、`title`、`tagline`、`whyHtml`、`hypothesis`、`criteria`、`iterations[]`、`outcomesHtml`、`handoffHtml`。サイクルの見出しとh3の間に本文があるときだけ`leadHtml` |
| `iterations[]` | object[] | `no`(1から連番)、`title`、`design`、`build`、`test`、`learn`、`notesHtml`(反復の表の後、次の反復か確立したことまでの本文。図のキャプションなど) |
| `outro` | string(HTML) | 最後のサイクルより後の本文 |

- 表のセルと本文はHTMLのまま持つ。太字、リンク、文献番号が残る
- 層とサイクルの見出しが1つも無いページには`dbtl`を付けず、警告も出さない
- 見出しがあって読み取れないサイクルが1つでもあるときは、同期が警告を出して`dbtl`を書き出さない。一部のサイクルだけは出さない

## models

3Dモデルを表示するページに置く。`islands`に`model-viewer`も入れる。

```json
"islands": ["model-viewer"],
"models": [{ "src": "https://static.igem.wiki/teams/xxxx/models/xxx.glb", "poster": "https://static.igem.wiki/teams/xxxx/models/xxx.png", "alt": "モデルの説明" }]
```

- `src`は.glbのURL、`poster`は読み込み前とWebGL非対応時に出す静止画のURL、`alt`は静止画の代替テキスト。
- 本番では.glbとposterを`static.igem.wiki`に置く。暫定のサンプルは`web/public/models/`にある。
- `model-viewer`島は`models`の先頭1件だけを表示する。`models`が空のページに島を指定すると、器だけが出て何も描かれない。
- Notion同期(#27)がこのフィールドを出す対応は別Issueで扱う。それまでは原稿JSONを手で書く。

## 規定

- 見出しid: h2とh3に付ける。見出しの文字列を小文字化し、空白をハイフンに、句読点と記号を除き、Unicodeの文字(日本語を含む)はそのまま残す。同じidが出たら2つ目以降に-2、-3を付ける。Figureカードのh3.figure-card\_\_titleにはidを付けず、目次にも載せない。
- lead: インライン要素(b、i、a、codeなど)のみ。pなどのブロック要素で包まない。描画側がpで包む。
- slug: ファイル名は`<slug>.json`で、slugと一致させる。使える文字は小文字英数字とハイフンのみ。スラッシュは不可。
- 画像のsrc: static.igem.wiki、video.igem.org、*.igem.org、*.igem.wiki以外のURLは、`npm run check`が違反として落とす。
- Homeで使うフィールド: titleは`<title>`とh1(視覚的に隠す)に使う(見た目はロゴ画像)。leadはロゴ下のキャッチで、`<b>`で囲んだ語は青で強調する(例: `WITH <b>SYNBIO</b>`)。subtitleは右下のiGEM Keio 2026の下に出す短いキャッチ(例: 走性を、設計する。)。htmlは右下の説明文で、3文程度の短い説明を想定し、6行を超える分は表示されず、空なら出さない。Contentsカードには各ページのtitle、subtitle、leadを出す。
- 片方の言語しかないページ: ナビには現在の言語のページだけを出す。言語切り替えリンクは、相手の言語に同じslugがあればそこへ、なければ相手の言語のhomeへ向ける。

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
    <img src="https://static.igem.wiki/teams/xxxx/fig1.png" alt="..." />
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
