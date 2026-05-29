# 開発ガイドライン (CONTRIBUTING)

iGEM Keio Wiki プロジェクトの開発ルールです。コードを変更する前に必ず一読してください。
このドキュメントが唯一の正となるルールです。迷ったらここを参照し、記載がなければ Issue / PR で相談してください。

---

## 1. リポジトリ構成と各ディレクトリの責務

このリポジトリには **2 つの系統** が同居しています。**通常の開発は `web/`（Next.js）で行います。**

| ディレクトリ | 役割 | 編集するか |
|---|---|---|
| `web/` | **Next.js (App Router) 製のwiki本体。** ここがメインの開発対象。 | ✅ ここを編集する |
| `web/src/app/` | ページ・ルーティング（`page.tsx`, `[slug]`, `ja/` など） | ✅ |
| `web/src/components/` | 共通UIコンポーネント（`Header`, `Footer`, `PageShell`） | ✅ |
| `web/src/lib/` | ロジック・データ取得（`wiki.ts` など） | ✅ |
| `wiki/` | iGEM 公式テンプレート (Flask + Frozen-Flask)。最終的な igem.org 提出形式の参考 | ⚠️ 原則さわらない |
| `wiki/pages_md/` | 各セクションの原稿 Markdown | ✅ 原稿更新時のみ |
| `static/` | iGEM テンプレ用の静的アセット | ⚠️ 原則さわらない |
| `LICENSE` | CC-BY-4.0（iGEM 必須） | 🚫 **変更禁止** |

> **なぜ2系統あるのか:** `wiki/` は iGEM が配布する公式テンプレ、`web/` はチームが Next.js で作り直した実装です。
> 開発・プレビューは `web/` を使います。最終提出フローは下記「5. デプロイ」を参照。

---

## 2. ブランチ運用

### 2.1 ブランチ命名規則

`<type>/<短い説明>` の形式。説明は英語の snake_case または kebab-case。

```
feature/add-team-page
fix/header-overflow
docs/development-guidelines
refactor/wiki-loader
chore/update-deps
```

| type | 用途 |
|---|---|
| `feature/` | 新機能・新ページ追加 |
| `fix/` | バグ修正 |
| `docs/` | ドキュメント・原稿のみの変更 |
| `refactor/` | 挙動を変えないリファクタリング |
| `style/` | 見た目・フォーマットのみ |
| `chore/` | 設定・依存・雑務 |

### 2.2 ブランチ運用ルール

- **`main` への直接 push は禁止。** 必ずブランチを切って PR 経由でマージする。
- ブランチは 1 つの目的に絞る（巨大な混在ブランチを避ける）。
- マージ済みブランチは削除する。

---

## 3. コミットメッセージ規約

**形式: `<prefix>: 〇〇するため／〇〇する[対象]を△△。`**（prefix は英語、説明は日本語）。
目的と対象（ファイル・機能）が分かるように書き、**末尾は必ず句点（。）で終える**。
[Conventional Commits](https://www.conventionalcommits.org/) 風の prefix を使います。

```
feat: チーム紹介を表示するため members ページを追加。
fix: モバイルでヘッダーが崩れる問題を修正。
docs: 開発ルールを明文化するため CONTRIBUTING を追加。
```

### 3.1 prefix 一覧

| prefix | 用途 |
|---|---|
| `feat` | 新機能の追加 |
| `add` | 新規ファイル・素材の追加 |
| `fix` | バグ修正 |
| `docs` | ドキュメント・原稿の変更 |
| `style` | フォーマット・スペースなど挙動に影響しない変更 |
| `refactor` | 挙動を変えないコード整理 |
| `test` | テストの追加・修正 |
| `chore` | 依存更新・設定・ビルド雑務 |
| `ci` | CI 設定の変更 |

### 3.2 書き方のルール

- **末尾は句点（。）で終える。**
- 1 コミット = 1 つの意図。「同じ意図に紐づく複数ファイルの変更」（例: 全体へ同じ規約を適用）は 1 コミットにまとめ、**無関係な新規ファイルの追加は基本的にファイルごとに分ける**。
- 説明は目的と対象が分かるように具体的に。`fix: 修正。` のような中身のないメッセージは避ける。
- 件名は長くなりすぎないように。詳細が必要なら 1 行空けて本文に書く。

---

## 4. Lint / Format

`web/` 配下に対して適用します。

### 4.1 ESLint（導入済み）

PR を出す前に必ず実行し、エラーを 0 にすること。

```bash
cd web
yarn lint
```

設定: `web/eslint.config.mjs`（`eslint-config-next` の core-web-vitals + typescript ルール）。

### 4.2 Prettier（フォーマット統一）

差分をきれいに保つため Prettier を使います。設定は `web/.prettierrc.json` / `web/.prettierignore`。

初回のみ依存を追加してください（未導入の場合）:

```bash
cd web
yarn add -D prettier eslint-config-prettier
```

整形コマンド:

```bash
cd web
yarn dlx prettier --write .   # 整形
yarn dlx prettier --check .   # チェックのみ
```

- 可能であればエディタの「保存時に自動整形」を有効にする。
- フォーマットだけの変更は `style:` prefix で、機能変更と混ぜずに別コミットにする。

---

## 5. デプロイ

| 環境 | 仕組み | トリガー |
|---|---|---|
| **本番 / プレビュー** | **Vercel** が `web/`(Next.js, `output: export`) をビルドして `out/` を配信 | `main` 更新時に自動。PR ごとにプレビューURLが発行される |
| iGEM 公式 (igem.org) | `wiki/`(Flask) を `.gitlab-ci.yml` でビルドし GitLab Pages へ | igem.org の GitLab へ反映する最終提出時 |

設定ファイル: `vercel.json`（`buildCommand: yarn build` / `outputDirectory: out`）, `web/next.config.mjs`。

> ⚠️ **重要:** iGEM の最終 wiki は **igem.org の GitLab にホストされる必要があります**。
> GitHub + Vercel は開発・プレビュー用です。最終提出フロー（GitHub → igem.org への反映手順）は
> チームで確定し、確定したらこの節を更新してください。

---

## 6. Pull Request / レビュー / マージ運用

### 6.1 基本フロー

1. ブランチを切る（§2）
2. 変更し、`yarn lint` とローカル動作確認（`yarn dev`）を通す
3. PR を作成（テンプレートが自動で挿入される）
4. **最低 1 名のレビュー承認**を受ける
5. マージ（§6.3）

### 6.2 PR のルール

- PR は小さく保つ。レビューしやすい単位に分割する。
- タイトルはコミット規約と同じ形式（`feat: ...` など）。
- 関連 Issue があれば `Closes #123` で紐付ける。
- WIP の段階では Draft PR にする。

### 6.3 マージ方法

- **Squash and merge** を基本とする（main の履歴を 1 PR = 1 コミットに保つ）。
- マージ後はブランチを削除する。
- コンフリクトは PR 作成者が解消する。

### 6.4 `main` ブランチ保護（リポジトリ設定 / 推奨）

GitHub のブランチ保護で以下を設定することを推奨します（管理者が設定）:

- `main` への直接 push を禁止
- マージ前に PR レビュー必須（1 名以上）
- マージ前に CI（lint）通過を必須

---

## 7. 静的アセット（iGEM 必須ルール）

iGEM の規定により、最終 wiki の静的アセットは外部に置く必要があります。

- **画像・写真・アイコン・フォント** → [`static.igem.wiki`](https://tools.igem.org) にアップロードして参照する。
- **動画** → [iGEM Video Universe](https://video.igem.org) に埋め込む。
- リポジトリに大きなバイナリを直接コミットしない。

---

## 8. チェックリスト（PR を出す前に）

- [ ] 適切なブランチ名で作業しているか（§2）
- [ ] コミットメッセージが規約どおりか（§3）
- [ ] `cd web && yarn lint` がエラー 0 か（§4）
- [ ] Prettier で整形済みか（§4.2）
- [ ] ローカルで `yarn dev` を起動して表示確認したか
- [ ] PR テンプレートを埋めたか（§6）
