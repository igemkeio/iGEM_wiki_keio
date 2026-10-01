import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

const contentDir = resolve(import.meta.dirname, "../content");

// content/はブラウザ側のバンドルに入らないので、watchモードで再ビルドが走るよう監視対象に足す。
function watchContent(): Plugin {
  return {
    name: "watch-content",
    buildStart() {
      this.addWatchFile(contentDir);
      for (const locale of readdirSync(contentDir, { withFileTypes: true })) {
        if (!locale.isDirectory()) continue;
        const dir = resolve(contentDir, locale.name);
        this.addWatchFile(dir);
        for (const file of readdirSync(dir)) this.addWatchFile(resolve(dir, file));
      }
    },
  };
}

// 目印を本番の配信元に置き換える。global.cssの@font-faceにある__WIKI_FONT_BASE__は環境変数WIKI_FONT_BASE(未指定ならbaseを付けた/fonts)に、
// ソース中の__WIKI_IMAGE_BASE__は環境変数WIKI_IMAGE_BASE(未指定ならbaseを付けた/images)にする。末尾のスラッシュは落とす。
function assetBase(base: string): Plugin {
  const prefix = base.replace(/\/$/, "");
  const markers = [
    { marker: "__WIKI_FONT_BASE__", dir: process.env.WIKI_FONT_BASE || `${prefix}/fonts`, ext: /\.css$/ },
    { marker: "__WIKI_IMAGE_BASE__", dir: process.env.WIKI_IMAGE_BASE || `${prefix}/images`, ext: /\.[jt]sx?$/ },
  ];
  return {
    name: "asset-base",
    enforce: "pre",
    transform(code, id) {
      const file = id.split("?")[0];
      let out = code;
      for (const { marker, dir, ext } of markers) {
        if (ext.test(file) && out.includes(marker)) out = out.replaceAll(marker, dir.replace(/\/+$/, ""));
      }
      if (out !== code) return { code: out, map: null };
    },
  };
}

// 部品のCSSはSSRでしか参照されないので、tree-shakeで捨てられないようにしてクライアントのCSSに束ねる。
function keepCssModules(): Plugin {
  return {
    name: "keep-css-modules",
    enforce: "post",
    transform(code, id) {
      if (/\.module\.css($|\?)/.test(id)) return { code, map: null, moduleSideEffects: "no-treeshake" };
    },
  };
}

const base = process.env.WIKI_BASE ?? "/";

export default defineConfig({
  base,
  plugins: [react(), watchContent(), assetBase(base), keepCssModules()],
  build: {
    manifest: true,
  },
});
