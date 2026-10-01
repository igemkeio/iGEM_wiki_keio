# 実装指示書: #33 3D ビューアの島

Issue: https://github.com/igemkeio/iGEM_wiki_keio/issues/33
設計メモ: docs/architecture.md(「3Dモデル」「島」)
前提: #31(島)の上に積む。`origin/feat/31-islands` から `feat/33-model-viewer` を切り、PR は `feature/vite-mpa` に向ける

## 目的

Blender で作った glTF(.glb)を wiki で表示する島を作る。表示は `<model-viewer>`(Google の Web Component)を使い、画面に入ってから読み込む。

## 最初に確認すること

- `tools.igem.org` が .glb を受け付けるかは人の作業(アップロードにはチームのアカウントが要る)。この Issue では確認せず、サンプルの .glb は `web/public/models/sample.glb` に置く(暫定。README に書く)。サンプルは Khronos の glTF-Sample-Assets から小さいもの(たとえば Duck、約100KB)を取り、ライセンス(CC BY 4.0)を README に書く。1MB を超えるものは入れない

## 変更範囲

触るファイル

- `web/package.json`: dependencies に `@google/model-viewer` を足す。それ以外の行は触らない(#35、#36 と同時進行のため)
- `web/src/components/ModelViewer.tsx` と `.module.css`(新規): 島の中身。props は `src`(.glb の URL)、`poster`(静止画の URL)、`alt`。`<model-viewer>` を `loading="lazy"` `reveal="auto"` `camera-controls` `auto-rotate` で置く。WebGL が使えない(`!window.WebGLRenderingContext` または `canvas.getContext("webgl")` が null)ときは `<img src={poster} alt={alt}>` を出す。`@google/model-viewer` の import は、WebGL が使えると分かってから動的 import する(使えない環境に 200KB を配らない)
- `web/src/islands.ts`: `model-viewer` を足す。`place` は `afterBody` のまま。`props(page)` は、原稿の JSON に無い値(src、poster)をどこから取るかが問題になる。この Issue では、`content/README.md` に `models` フィールド(任意、`{ src, poster, alt }[]`)を足し、`props(page)` は `page.models?.[0]` を渡す。`web/src/content.ts` の `RawWikiPage` に `models?: Model[]` を足し、`readPage` の既定値は `[]`。Notion 同期側(#27)がこのフィールドを出す対応は別 Issue にする(README にその旨を書く)
- `web/src/components/ArticlePage.tsx`: 変更不要のはず(`islands.ts` の表で動く)。必要なら最小限
- `web/src/client/islands.tsx`: ローダーに `model-viewer` を足す
- `content/en/model-sample.json`(新規、`published: false`): `islands: ["model-viewer"]`、`models: [{ src: "/models/sample.glb", poster: "/models/sample.png", alt: "Sample duck" }]`。確認とテストに使う。poster は .glb を Chrome で開いてスクリーンショットを撮ったものを `web/public/models/sample.png` に置く(小さく、100KB 以下)
- `web/public/models/`: sample.glb、sample.png
- テスト: `ModelViewer.test.tsx`(WebGL が無いときに img が出る、あるときに `model-viewer` 要素が出て動的 import が呼ばれる。happy-dom に WebGL は無いので、`getContext` をモックする)、`islands` の表に `model-viewer` があるテスト
- `web/README.md`: 3D モデルの節(.glb の作り方の目安、Draco 圧縮、サイズ、`static.igem.wiki` に置くこと、`models` フィールド)
- `content/README.md`: `models` フィールドの節

触らないファイル

- `web/scripts/`、`Sidebar`、`Footer`、`PageShell`、`prose.css`、`MemberList`

## 受け入れ条件

- `content/en/model-sample.json` を一時的に `published: true` にしてビルドし、`/model-sample/` を Chrome で開くと .glb が表示されて回せる(スクリーンショットを添える。確認後に戻す)
- ページを開いた直後(ビューアが画面外のとき)は .glb のリクエストが発生せず、スクロールして画面に入ると発生する(ヘッドレス Chrome の CDP でネットワークを見るか、`model-viewer` の `loading="lazy"` の仕様とスクロール前後の `performance.getEntriesByType("resource")` で確認)
- WebGL を無効にした環境(Chrome の `--disable-gpu --disable-software-rasterizer` か、`getContext` を潰したページ)で poster の img が出る
- `npm run check` が通る(`/models/sample.glb` は内部リンクなので通るはず)。`npm test`、`npm run typecheck`、`npm run build` が通る(Vitest は必要なら `--no-save` で一時導入)
- 島のないページの HTML に `<script>` が無く、`/members/` のバンドルに model-viewer が入っていない(別チャンクであることを `dist/assets/` のファイル一覧で確認)

## 規約

- コミットは `<prefix>: 日本語一行。`。1コミット1論理単位(models フィールド、ModelViewer、islands の登録、サンプルと README、テスト)
- コメントと README は日本語。太字とカギ括弧を使わず、英単語や数字の両端に半角スペースを入れない
- Claude の痕跡を付けない
- PR は作らず、push して本文の案を報告する
