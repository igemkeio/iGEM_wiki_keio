# 3Dシーン

Blenderのシーンをスクリプトで組み、wikiで使うglbとループ動画を書き出す。.blendは成果物ではなく、スクリプトが正。

## 必要なもの

- Blender 5系(`brew install --cask blender`で`blender`コマンドが入る)
- ffmpeg(動画化だけに使う)

## シーン

| スクリプト | 内容 |
| --- | --- |
| `dna_helix.py` | DNA二重らせん単体。glbと、無地背景で回るループ動画 |
| `popup_book.py` | 方眼紙の机に開いた本の上で、らせんが回るループ動画。ページの図版はnumpyで描いた仮のもの |

`popup_book.py`はらせんの部品を`dna_helix.py`から読み込む。

## 使い方

```sh
3d/render.sh                 # dnaシーン。3d/out/ にglb、ポスター、WebM、MP4を出す
3d/render.sh book            # bookシーン。3d/out/book/ にポスター、WebM、MP4を出す
3d/render.sh dna 3d/out 150  # フレーム数を変える(既定は300、30fpsで10秒ループ)
```

個別に出すときは`blender -b -P 3d/dna_helix.py -- --mode glb|poster|frames --out 3d/out`。`--save-blend`を付けるとBlenderで開ける.blendも残す。

## 出力

| ファイル | 用途 |
| --- | --- |
| `dna-helix.glb` | `model-viewer`島で表示する。原稿JSONの`models[].src` |
| `dna-helix-poster.png` | 島の読み込み前とWebGL非対応時の静止画。`models[].poster` |
| `dna-helix.webm`、`dna-helix.mp4` | heroの背景動画。先頭と末尾がつながるループ |
| `book/popup-book.webm`、`book/popup-book.mp4` | 本の上でらせんが回るheroの背景動画の候補 |

出力はリポジトリに入れない。glbと画像は`static.igem.wiki`、動画はiGEM Video Universeに置く。

## 直し方

色は`dna_helix.py`の`COLORS`で、`web/src/styles/tokens.css`の値を写している。形は`HELIX`。カメラとライトは`setup_camera`と`setup_world_and_lights`。

本のページの図版を本物に差し替えるときは、`popup_book.py`の`draw_page_image`の代わりに画像を`bpy.data.images.load`で読み、`make_paper_material`に渡す。ページは幅3、高さ4の比率。
