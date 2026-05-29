# CLAUDE.md

このリポジトリで作業する際のガイドです。**開発ルールの正は [`CONTRIBUTING.md`](CONTRIBUTING.md)** にあります。常にそれに従ってください。

## プロジェクト概要

iGEM Keio チームの wiki。**開発対象は `web/`（Next.js / App Router, TypeScript）**。
`wiki/`(Flask) と `static/` は iGEM 公式テンプレート由来で、原則さわらない。

## よく使うコマンド

```bash
cd web
yarn dev      # ローカル開発サーバ
yarn build    # 静的ビルド（output: export → out/）
yarn lint     # ESLint（PR 前に必須・エラー0）
```

## 守るべきルール（要約）

- **`main` への直接コミット禁止。** 必ずブランチ（`feature/`, `fix/`, `docs/` …）を切る。
- コミットは `<prefix>: 目的＋対象を含む日本語。`（**末尾は句点**。例: `feat: チーム紹介を表示するため members ページを追加。`）。prefix は `feat/add/fix/docs/style/refactor/test/chore/ci`。詳細は CONTRIBUTING §3。
- **commit / PR に Claude の Co-Authored-By や「Generated with Claude Code」を入れない。**
- 変更後は `cd web && yarn lint` を通す。フォーマットは Prettier（`web/.prettierrc.json`）。
- 画像・動画はリポジトリに直接コミットしない（iGEM 規定: `static.igem.wiki` / iGEM Video Universe）。
- `LICENSE`（CC-BY-4.0）は変更禁止。

## 編集場所の目安

- ページ・ルーティング: `web/src/app/`（`page.tsx`, `[slug]`, `ja/`）
- 共通UI: `web/src/components/`（`Header`, `Footer`, `PageShell`）
- ロジック/データ: `web/src/lib/`（`wiki.ts`）
- 原稿 Markdown: `wiki/pages_md/`
