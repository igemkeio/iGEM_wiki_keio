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

// global.cssの@font-faceにある目印を、環境変数WIKI_FONT_BASE(未指定ならbaseを付けた/fonts)に置き換える。
function fontBase(base: string): Plugin {
  const marker = "__WIKI_FONT_BASE__";
  return {
    name: "font-base",
    enforce: "pre",
    transform(code, id) {
      if (!id.split("?")[0].endsWith(".css") || !code.includes(marker)) return;
      const dir = (process.env.WIKI_FONT_BASE ?? `${base.replace(/\/$/, "")}/fonts`).replace(/\/+$/, "");
      return { code: code.replaceAll(marker, dir), map: null };
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
  plugins: [react(), watchContent(), fontBase(base), keepCssModules()],
  build: {
    manifest: true,
  },
});
