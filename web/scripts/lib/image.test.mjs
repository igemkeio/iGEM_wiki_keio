import assert from "node:assert/strict";
import test from "node:test";

import sharp from "sharp";

import {
  ANIMATION_WEBP_EFFORT,
  convertToWebp,
  imageFileName,
  MAX_EDGE,
  WEBP_EFFORT,
  WEBP_QUALITY,
} from "./image.mjs";

const solid = (width, height, channels = 3, background = "#336699") =>
  sharp({ create: { width, height, channels, background } });

test("imageFileName: 元のバイト列のハッシュに .webp を付ける", () => {
  const name = imageFileName(Buffer.from("abc"));
  assert.match(name, /^[0-9a-f]{16}\.webp$/u);
  assert.equal(name, imageFileName(Buffer.from("abc")));
  assert.notEqual(name, imageFileName(Buffer.from("abd")));
});

test("convertToWebp: 同じ入力から同じバイト列が出る", async () => {
  const src = await solid(300, 200).png().toBuffer();
  const a = await convertToWebp(src, "png");
  const b = await convertToWebp(src, "png");
  assert.ok(a.data.equals(b.data));
  assert.equal(imageFileName(src), imageFileName(src));
});

test("convertToWebp: 長い辺を1600pxまでに縮め、縦横比を保つ", async () => {
  const src = await solid(3200, 1600).png().toBuffer();
  const { data } = await convertToWebp(src, "png");
  const meta = await sharp(data).metadata();
  assert.equal(meta.format, "webp");
  assert.equal(meta.width, MAX_EDGE);
  assert.equal(meta.height, 800);
});

test("convertToWebp: 小さい画像は拡大しない", async () => {
  const src = await solid(120, 80).jpeg().toBuffer();
  const { data } = await convertToWebp(src, "jpg");
  const meta = await sharp(data).metadata();
  assert.equal(meta.width, 120);
  assert.equal(meta.height, 80);
});

test("convertToWebp: EXIFの向きを画素に反映する", async () => {
  // 横200x縦100で向き6(時計回りに90度)。表示上は縦長の100x200になる。
  const src = await solid(200, 100)
    .jpeg()
    .withMetadata({ orientation: 6 })
    .toBuffer();
  const input = await sharp(src).metadata();
  assert.equal(input.orientation, 6);
  const { data } = await convertToWebp(src, "jpg");
  const meta = await sharp(data).metadata();
  assert.equal(meta.width, 100);
  assert.equal(meta.height, 200);
  assert.ok(!meta.orientation || meta.orientation === 1);
});

test("convertToWebp: EXIFとGPSを残さない", async () => {
  const src = await solid(100, 100)
    .jpeg()
    .withExif({
      IFD0: { Make: "TestCamera" },
      IFD3: { GPSLatitudeRef: "N", GPSLatitude: "35/1 40/1 0/1" },
    })
    .toBuffer();
  const before = await sharp(src).metadata();
  assert.ok(before.exif, "入力にはEXIFがある");
  assert.ok(before.exif.includes(Buffer.from("TestCamera")));
  const { data } = await convertToWebp(src, "jpg");
  const after = await sharp(data).metadata();
  assert.equal(after.exif, undefined);
  assert.ok(!data.includes(Buffer.from("TestCamera")));
  assert.ok(!data.includes(Buffer.from("GPS")));
});

test("convertToWebp: Display P3の色をsRGBへ変換する", async () => {
  // sRGBの(230,60,40)をP3で符号化した画像。プロファイルを無視して読むと値が大きくずれる。
  const src = await solid(8, 8, 3, { r: 230, g: 60, b: 40 })
    .withIccProfile("p3")
    .png()
    .toBuffer();
  const stored = await sharp(src).keepIccProfile().raw().toBuffer();
  assert.ok(Math.abs(stored[0] - 230) > 10, "入力の画素値はP3の符号化");
  const { data } = await convertToWebp(src, "png");
  const meta = await sharp(data).metadata();
  assert.equal(meta.space, "srgb");
  assert.equal(meta.hasProfile, false);
  const px = await sharp(data).raw().toBuffer();
  assert.ok(Math.abs(px[0] - 230) <= 6);
  assert.ok(Math.abs(px[1] - 60) <= 6);
  assert.ok(Math.abs(px[2] - 40) <= 6);
});

test("convertToWebp: アルファチャンネルを保つ", async () => {
  const src = await solid(16, 16, 4, { r: 255, g: 0, b: 0, alpha: 0 })
    .png()
    .toBuffer();
  const { data } = await convertToWebp(src, "png");
  const meta = await sharp(data).metadata();
  assert.equal(meta.hasAlpha, true);
  const { data: px, info } = await sharp(data)
    .raw()
    .toBuffer({ resolveWithObject: true });
  assert.equal(info.channels, 4);
  assert.equal(px[3], 0);
});

test("convertToWebp: アニメーションGIFは全フレームのアニメーションWebPにする", async () => {
  const w = 20;
  const h = 10;
  const frame = (v) => Buffer.alloc(w * h * 3, v);
  const src = await sharp(Buffer.concat([frame(0), frame(128), frame(255)]), {
    raw: { width: w, height: h * 3, channels: 3, pageHeight: h },
  })
    .gif({ loop: 0, delay: [100, 100, 100] })
    .toBuffer();
  const { data, animated } = await convertToWebp(src, "gif");
  assert.equal(animated, true);
  const meta = await sharp(data, { animated: true }).metadata();
  assert.equal(meta.format, "webp");
  assert.equal(meta.pages, 3);
  assert.equal(meta.pageHeight, h);
});

test("convertToWebp: 静止画は animated が false", async () => {
  const src = await solid(10, 10).png().toBuffer();
  const { animated } = await convertToWebp(src, "png");
  assert.equal(animated, false);
});

test("convertToWebp: TIFFもWebPにする", async () => {
  const src = await solid(30, 20).tiff().toBuffer();
  const { data } = await convertToWebp(src, "tiff");
  const meta = await sharp(data).metadata();
  assert.equal(meta.format, "webp");
});

const animatedGif = (w, h, frames = 2) =>
  sharp(
    Buffer.concat(
      Array.from({ length: frames }, (_, i) =>
        Buffer.alloc(w * h * 3, (i * 255) / Math.max(frames - 1, 1))
      )
    ),
    { raw: { width: w, height: h * frames, channels: 3, pageHeight: h } }
  )
    .gif({ loop: 0, delay: Array.from({ length: frames }, () => 100) })
    .toBuffer();

test("convertToWebp: 拡張子がgifでなくても全フレームを保つ", async () => {
  const gif = await animatedGif(20, 10);
  const awebp = await sharp(gif, { animated: true }).webp().toBuffer();
  for (const [buf, ext] of [
    [gif, "png"],
    [awebp, "webp"],
  ]) {
    const { data, animated } = await convertToWebp(buf, ext);
    const meta = await sharp(data, { animated: true }).metadata();
    assert.equal(animated, true, ext);
    assert.equal(meta.pages, 2, ext);
  }
});

test("convertToWebp: 大きいアニメーションは各フレームを縮める", async () => {
  const src = await animatedGif(2000, 1000);
  const { data } = await convertToWebp(src, "gif");
  const meta = await sharp(data, { animated: true }).metadata();
  assert.equal(meta.pages, 2);
  assert.equal(meta.width, 1600);
  assert.equal(meta.pageHeight, 800);
});

test("imageFileName: SVGだけ .svg になり、ハッシュは元のバイト列から作る", () => {
  const buf = Buffer.from("<svg/>");
  const svg = imageFileName(buf, "svg");
  assert.match(svg, /^[0-9a-f]{16}\.svg$/u);
  assert.equal(
    svg.replace(".svg", ""),
    imageFileName(buf, "png").replace(".webp", "")
  );
  for (const ext of ["png", "jpg", "gif", "webp", "heic", "tiff", undefined]) {
    assert.match(imageFileName(buf, ext), /^[0-9a-f]{16}\.webp$/u, String(ext));
  }
});

test("convertToWebp: SVGは変換せずバイト列のまま返す", async () => {
  const svg = Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>'
  );
  const { data, animated } = await convertToWebp(svg, "svg");
  assert.ok(data.equals(svg));
  assert.equal(animated, false);
});

const options = (effort) => ({ quality: WEBP_QUALITY, effort });

// effortで出力が変わるよう、ノイズ画像のフレームを縦に連結した生データを作る。
const noisyFrames = async (w, h, frames) => {
  const parts = [];
  for (let i = 0; i < frames; i += 1) {
    parts.push(
      await sharp({
        create: {
          width: w,
          height: h,
          channels: 3,
          background: "#808080",
          noise: { type: "gaussian", mean: 128, sigma: 60 },
        },
      })
        .raw()
        .toBuffer()
    );
  }
  return Buffer.concat(parts);
};

test("convertToWebp: アニメーションはeffort 4、静止画はeffort 6で符号化する", async () => {
  const w = 96;
  const h = 96;
  const raw = (frames) => ({
    raw: { width: w, height: h * frames, channels: 3, pageHeight: h },
  });

  const gif = await sharp(await noisyFrames(w, h, 3), raw(3))
    .gif({ loop: 0, delay: [100, 100, 100] })
    .toBuffer();
  const animEncode = (effort) =>
    sharp(gif, { animated: true }).webp(options(effort)).toBuffer();
  const a4 = await animEncode(ANIMATION_WEBP_EFFORT);
  const a6 = await animEncode(WEBP_EFFORT);
  assert.ok(!a4.equals(a6), "effortで出力が変わる入力");
  const anim = await convertToWebp(gif, "gif");
  assert.ok(anim.data.equals(a4));
  const again = await convertToWebp(gif, "gif");
  assert.ok(again.data.equals(anim.data));

  const png = await sharp(await noisyFrames(w, h, 1), raw(1))
    .png()
    .toBuffer();
  const stillEncode = (effort) => sharp(png).webp(options(effort)).toBuffer();
  const s4 = await stillEncode(ANIMATION_WEBP_EFFORT);
  const s6 = await stillEncode(WEBP_EFFORT);
  assert.ok(!s4.equals(s6), "effortで出力が変わる入力");
  const still = await convertToWebp(png, "png");
  assert.ok(still.data.equals(s6));
});
