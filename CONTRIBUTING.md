# 開発に参加する

iGEM Keio wikiの開発に参加する人向けの手順。ブランチ名、コミット規約、コードの約束、テストの方針は`AGENTS.md`にある。先にそちらを読む。迷ったらIssueかPRで相談する。

## 環境構築

1. リポジトリをcloneする。
2. Node 24を入れる(`.node-version`)。
3. 依存を入れて開発サーバーを起動する。

```sh
cd web
npm ci
npm run dev
```

4. E2Eを流すなら、初回だけブラウザを入れる。

```sh
npx playwright install chromium
```

`npm ci`はgitのpre-commitフック(lefthook)も入れる。`core.hooksPath`を設定している環境では入らないことがあり、その場合の入れ方は`web/README.md`のpre-commitの節にある。

Notionの同期を手元で試すときの設定は`docs/notion-sync.md`にある。

## 作業の進め方

1. Issueを確認する。なければ立てて、やることと完了条件を書く。
2. ブランチを切る(`AGENTS.md`の開発の流れ)。
3. 変更し、ローカルで確かめる。毎回流すのは次の3つ。
   - `npm run check:code`(エラー0)
   - `npm run typecheck`
   - `npm run dev`で表示を確認する
4. 変更範囲に応じて、`npm test`、`npm run build && npm run check`、対応するE2Eを流す。対応表は`web/e2e/README.md`にある。
5. コミットする。lefthookが整形と型検査を流す。

## PRの出し方

- タイトルはコミットと同じ形式で書く。本文はPRテンプレートを埋め、対応するIssueを`Closes #N`で紐付ける。
- UIを変えたときは、変更前と変更後のスクリーンショットを貼る。PCとモバイル(375px)の両方を確かめる。
- 作業中はDraftにする。レビューに出せる状態になったらDraftを外す。
- PRは小さく保つ。レビューしやすい単位に分ける。

## レビューを受ける

- レビューを受けてからマージする。承認数の強制は無いが、PRとCIの`ci-passed`が緑であることは必須。
- 指摘には、直したらその旨を返信し、直さないなら理由を書く。
- コンフリクトはPRの作成者が解消する。
- レビューが済んだらマージコミット(Create a merge commit)でマージし、ブランチを消す。履歴を残すため、squashはしない。

## 配信の確認

PRを出すとVercelがプレビューURLを発行する。iGEMへの提出用の配信はGitLab Pagesで、設定は`web/README.md`のCIと配信の節にある。

最終のwikiはiGEMのGitLabに置く必要がある。GitLabのリポジトリに`main`をpushすると、`.gitlab-ci.yml`によってPagesが公開される。公開URLは未確定。

## PRを出す前のチェックリスト

- [ ] ブランチ名とコミットメッセージが`AGENTS.md`の規約どおり
- [ ] `npm run check:code`と`npm run typecheck`がエラー0
- [ ] `npm test`と`npm run build && npm run check`が通る
- [ ] ローカルで`npm run dev`を起動して表示を確認した
- [ ] 大きな画像や動画を直接コミットしていない
- [ ] PRテンプレートを埋めた
