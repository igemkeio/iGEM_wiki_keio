# iGEM Keio 2026 Wiki

iGEM 2026に出場するKeioチームのwiki。ViteとReactで、`content/`の原稿JSONからページごとの静的HTMLを書き出す。原稿はNotionで書き、同期スクリプトがJSONにする。

## クイックスタート

Node 24(`.node-version`)とnpmが要る。

```sh
cd web
npm ci
npm run dev
```

起動時に表示されるURLを開く。`web/src/`と`content/`を保存すると再ビルドされる。コマンドの一覧は`web/README.md`にある。

## ディレクトリ構成

| ディレクトリ | 内容 |
| --- | --- |
| `web/` | ViteとReactのプロジェクト。開発対象はここ |
| `content/` | 原稿JSON(`content/<locale>/<slug>.json`)。Notion同期が書く |
| `docs/` | 設計メモ、Notion連携の手順、実装の経緯(`tasks/`) |
| `notion-trigger/` | Notionのボタンから同期を起動するVercel関数 |

## 文書

| 文書 | 内容 |
| --- | --- |
| `AGENTS.md` | 運用ルール(ブランチ、コミット、PR、コードの約束、テスト、iGEMの規定) |
| `CONTRIBUTING.md` | 環境構築、PRの出し方、レビューの受け方 |
| `docs/architecture.md` | 技術構成と選定の理由 |
| `docs/notion-sync.md` | Notion連携の手順 |
| `content/README.md` | 原稿JSONの形式 |
| `web/README.md` | コマンド、ビルドと配信、仕組み |
| `web/e2e/README.md` | E2Eとビジュアル回帰 |

## 配信

- PRのプレビューはVercel。
- iGEMへの提出はGitLab Pages(`.gitlab-ci.yml`)。
- 画像、フォント、3Dモデルは`static.igem.wiki`に、動画はiGEM Video Universeに置く。規定と置き場所は`AGENTS.md`にある。

iGEMの要件は[competition.igem.org/deliverables/team-wiki](https://competition.igem.org/deliverables/team-wiki)で確認する。

## ライセンス

[CC BY 4.0](LICENSE)。iGEMのwikiはすべてこのライセンスにする必要があり、`LICENSE`は変更しない。
