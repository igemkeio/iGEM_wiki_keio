# Notion連携

Notionを原稿置き場(CMS)として使い、本文をMarkdownで書くと`content/<locale>/<slug>.json`が自動生成される。JSONの形式は[`../content/README.md`](../content/README.md)にある。

```
Notion(Markdownで執筆) → API取得 → Markdown化 → HTML化 → content/<locale>/<slug>.json
```

この仕組みではNotionが正になる。`content/**/*.json`は同期で上書きされ、Notionに無くなったページのJSONは削除されるので、直接編集しない。`content/README.md`は削除されない。リポジトリ側で置く確認用ページは、JSONに`"source": "local"`を付けると同期が消さない。

ページで使う島(`islands`)はNotionには持たせない。`web/scripts/lib/page.mjs`の`ISLANDS_BY_SLUG`(slugから島の名前の配列を引く表)で決め、JSONの`islands`に出す。島の名前は`web/src/islands.ts`の`ISLANDS`のキーと手で揃える。`attributions`には島`attribution-form`(iGEMの貢献者フォームのiframe)を付け、本文にはHTMLを差し込まない。

## 1. Notion Integrationを作る

1. `https://www.notion.so/my-integrations`を開き、新しいIntegrationを作る。
2. 種類はInternal。発行されたSecret(`ntn_...`)が`NOTION_TOKEN`になる。
3. 対象のDatabaseを開き、右上のメニューのConnectionsから、作ったIntegrationを接続する。これをしないとAPIから見えない。

## 2. Databaseを用意する

1行が1ページ。次のプロパティを持たせる。

| プロパティ | 型 | 内容 |
| --- | --- | --- |
| `slug` | Title | ページのスラッグ。例: `home`、`model` |
| `locale` | Select | `en`または`ja` |
| `heading` | Rich text | ページの見出し(JSONの`title`) |
| `lead` | Rich text | リード文(簡単なHTMLを含んでよい) |
| `order` | Number | 任意。ナビとHomeのカードの並び順 |
| `subtitle` | Rich text | 任意。見出しの下の小見出し |
| `published` | Checkbox | 任意。チェックを外した行は同期しない |

`heading`は本来`title`と呼びたいが、Notionではtitle型のプロパティ(`slug`)と名前が衝突して壊れるため`heading`にしている。

`order`と`subtitle`は、人がDBにプロパティを追加する(NotionのDBの+ボタンから、名前と型を上の表のとおりにする)。無い場合は省略として扱い、同期は失敗しない。`home`の`order`は`0`にする。

`slug`は小文字の英数字とハイフンだけに正規化される。大文字は小文字に、空白とアンダースコアはハイフンに変え、それ以外の文字は除く。変わった場合は同期のログに出る。

本文は各ページの中身にMarkdownで書く。日英はそれぞれ別の行で、`locale`で`en`と`ja`を区別し、`slug`は共通にする。

Database IDはDBのURLに含まれる32文字の英数字。

### Notionのブロックの変換

| Notionのブロック | 出力 |
| --- | --- |
| 見出し1 | `<h2 id="...">`。ページのh1はtitleが使うので、本文の見出し1は見出し2として出す |
| 見出し2、見出し3 | `<h2 id="...">`、`<h3 id="...">`。idは見出しの文字列を小文字化し、空白をハイフンに、句読点と記号を除いたもの(日本語は残す)。重複は`-2`、`-3` |
| equation(ブロック数式)、文中の数式 | KaTeXで描画したHTML |
| callout | `<aside class="note"><p class="note__label">Note</p>...</aside>`。アイコンは捨てる |
| キャプション付きのimage | `<figure class="figure-card">`。キャプションが`Fig. N`で始まれば`figure-card__label`に、残りを`figure-card__title`にする |
| キャプションなしのimage | `<img>` |

HTMLの形は[`../content/README.md`](../content/README.md)のFigureカードとNoteのHTMLの形の節にある。

### 画像の扱い(暫定)

Notionの本文に貼った画像は、同期時に`web/public/notion-images/<ハッシュ>.<拡張子>`に取り込まれ(内容ハッシュで重複を排除する)、`/notion-images/...`として配信される。外部URL(例: `static.igem.wiki`の画像を埋め込みで貼った場合)はそのまま通す。

同期のたびに、`static.igem.wiki`以外を指す画像を`content/images-todo.json`(`[{ "slug", "locale", "src" }]`)に出す。人が`static.igem.wiki`に上げ直すための一覧で、gitには入れない。自動アップロードは行わない。

これはプレビュー運用の暫定方式。iGEMの規定では画像をリポジトリに直接コミットせず`static.igem.wiki`を使う必要があるため、本番の提出前に自動アップロードへ移行する([Issue #13](https://github.com/igemkeio/iGEM_wiki_keio/issues/13))。

## 3. ローカルで手動同期

```sh
cd web
cp .env.local.example .env.local   # 値を埋める(NOTION_TOKEN、NOTION_DATABASE_ID)
npm run notion:sync                # content/にJSONを生成
npm run dev                        # 反映を確認
```

`.env.local`は`.gitignore`済みで、コミットされない。

## 4. GitHub Actionsで自動同期

`.github/workflows/notion-sync.yml`が次を行う。

- 手動実行(Actionsタブのworkflowを実行)か、毎日0時(UTC。日本時間の9時)に起動する。
- `npm ci`のあと`npm run notion:sync`を実行し、`content/images-todo.json`の件数と先頭10件をジョブのサマリーに出す。
- `npm run build && npm run check`を実行する。失敗したらPRを作らずにジョブを失敗させる。
- 差分があれば`chore/notion-sync`ブランチにコミットしてPRを自動で作る(`main`へ直接pushはしない)。コミット対象は`content/`と`web/public/notion-images/`だけ。

### 必要なSecrets

リポジトリのSettingsのSecrets and variablesのActionsに登録する。

- `NOTION_TOKEN`(Secret)
- `NOTION_DATABASE_ID`(Secret)
- `NOTION_BUILD_PAGE_ID`(Secret): プレビューのURLなどを書き戻す`__build__`行のページID
- `VERCEL_PREVIEW_URL`(Variable): `chore/notion-sync`ブランチの固定プレビューURL

## 5. Notionのボタンで同期を起動する

Notionのボタンを押すとGitHub Actionsが起動し、PRの作成、Vercelのプレビュービルドを経て、プレビューのURLがNotionの`__build__`行に書き戻される。

```
Notionのボタン → notion-trigger(Vercel関数) → workflow_dispatch
  → notion-sync.yml(sync → PR) → Vercelのプレビュー → __build__行へURLを書き戻す
```

- 中継エンドポイントの実体とデプロイ手順は[`../notion-trigger/README.md`](../notion-trigger/README.md)にある。
- `__build__`はDB内の制御行で、`published`を外してあり、ページは生成されない。`preview_url`、`pr_url`、`last_synced`のプロパティに最新の結果が入る。

### プレビューのURLについて

PR用のブランチは常に`chore/notion-sync`で固定なので、VercelのブランチのプレビューURLも一定になる。そのURLを`VERCEL_PREVIEW_URL`に入れておくと、毎回`__build__`行へ書き戻される。PRのコメントにもVercelが自動でURLを出す。
