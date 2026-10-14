#!/usr/bin/env bash
# シーンを書き出し、フレーム列をループ動画(WebMとMP4)にする。
# 使い方: 3d/render.sh [dna|book] [出力先] [フレーム数]
set -euo pipefail

cd "$(dirname "$0")/.."
SCENE="${1:-dna}"
FPS=30

case "$SCENE" in
  dna)  SCRIPT=3d/dna_helix.py;  NAME=dna-helix;  OUT="${2:-3d/out}" ;;
  book) SCRIPT=3d/popup_book.py; NAME=popup-book; OUT="${2:-3d/out/book}" ;;
  *) echo "unknown scene: $SCENE" >&2; exit 1 ;;
esac
FRAMES="${3:-300}"

blender -b -P "$SCRIPT" -- --mode all --frames "$FRAMES" --fps "$FPS" --out "$OUT"

# yuv420pでないとSafariとモバイルで再生できない。
ffmpeg -y -loglevel error -framerate "$FPS" -i "$OUT/frames/frame_%04d.png" \
  -c:v libvpx-vp9 -b:v 0 -crf 34 -pix_fmt yuv420p -an "$OUT/$NAME.webm"
ffmpeg -y -loglevel error -framerate "$FPS" -i "$OUT/frames/frame_%04d.png" \
  -c:v libx264 -crf 24 -preset slow -pix_fmt yuv420p -movflags +faststart -an "$OUT/$NAME.mp4"

ls -la "$OUT/$NAME".*
