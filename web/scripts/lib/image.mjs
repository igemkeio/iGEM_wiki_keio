import crypto from "node:crypto";

import heicConvert from "heic-convert";
import sharp from "sharp";

// 長い辺の上限。本文の幅約800pxを2倍の解像度の画面で見る想定。
export const MAX_EDGE = 1600;
export const WEBP_QUALITY = 80;
export const WEBP_EFFORT = 6;
// アニメーションWebPがこれを超えたら警告する(動画にしてVideo Universeへ移す候補)。
export const ANIMATION_WARN_BYTES = 2 * 1024 * 1024;

// 保存名は元画像のバイト列のsha256先頭16桁。拡張子は常に webp。
export function imageFileName(buf) {
  const hash = crypto
    .createHash("sha256")
    .update(buf)
    .digest("hex")
    .slice(0, 16);
  return `${hash}.webp`;
}

// 元画像を縮小してWebPにする。
// EXIFの向きを画素に反映し、sRGBへ変換し、EXIF・GPSは残さない(sharpは既定でメタデータを出力しない)。
// HEICはCIのLinuxでsharpが読めない場合があるため、先にJPEGへ変換して渡す。
// 戻り値は { data, animated }。
export async function convertToWebp(buf, srcExt) {
  const isHeic = srcExt === "heic" || srcExt === "heif";
  const input = isHeic
    ? Buffer.from(
        await heicConvert({ buffer: buf, format: "JPEG", quality: 0.9 })
      )
    : buf;
  const image = sharp(input, { animated: true });
  const { pages } = await image.metadata();
  const data = await image
    .rotate()
    .toColorspace("srgb")
    .resize({
      width: MAX_EDGE,
      height: MAX_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: WEBP_QUALITY, effort: WEBP_EFFORT })
    .toBuffer();
  return { data, animated: (pages ?? 1) > 1 };
}
