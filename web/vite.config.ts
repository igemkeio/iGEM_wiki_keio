import { readdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

import react from "@vitejs/plugin-react";
import type { Declaration, Plugin as PostcssPlugin } from "postcss";
import { defineConfig } from "vite";
import type { Plugin } from "vite";

const contentDir = resolve(import.meta.dirname, "../content");

// content/はブラウザ側のバンドルに入らないので、watchモードで再ビルドが走るよう監視対象に足す。
function watchContent(): Plugin {
  return {
    name: "watch-content",
    buildStart() {
      this.addWatchFile(contentDir);
      for (const locale of readdirSync(contentDir, { withFileTypes: true })) {
        if (!locale.isDirectory()) {
          continue;
        }
        const dir = resolve(contentDir, locale.name);
        this.addWatchFile(dir);
        for (const file of readdirSync(dir)) {
          this.addWatchFile(resolve(dir, file));
        }
      }
    },
  };
}

// 目印を本番の配信元に置き換える。global.cssの@font-faceにある__WIKI_FONT_BASE__は環境変数WIKI_FONT_BASE(未指定ならbaseを付けた/fonts)に、
// ソース中の__WIKI_IMAGE_BASE__は環境変数WIKI_IMAGE_BASE(未指定ならbaseを付けた/images)にする。末尾のスラッシュは落とす。
// __WIKI_NOTION_BASE__は環境変数WIKI_NOTION_BASE(notion-imagesとnotion-filesの親のURL)に置き換え、未指定なら空にする(空のときはsrc/lib/applyBase.tsがbaseを付ける)。
function assetBase(base: string): Plugin {
  const prefix = base.replace(/\/$/u, "");
  const markers = [
    {
      marker: "__WIKI_FONT_BASE__",
      dir: process.env.WIKI_FONT_BASE || `${prefix}/fonts`,
      ext: /\.css$/u,
    },
    {
      marker: "__WIKI_IMAGE_BASE__",
      dir: process.env.WIKI_IMAGE_BASE || `${prefix}/images`,
      ext: /\.[jt]sx?$/u,
    },
    {
      marker: "__WIKI_NOTION_BASE__",
      dir: process.env.WIKI_NOTION_BASE || "",
      ext: /\.[jt]sx?$/u,
    },
  ];
  return {
    name: "asset-base",
    enforce: "pre",
    transform(code, id) {
      const [file] = id.split("?");
      let out = code;
      for (const { marker, dir, ext } of markers) {
        if (ext.test(file) && out.includes(marker)) {
          out = out.replaceAll(marker, dir.replace(/\/+$/u, ""));
        }
      }
      if (out !== code) {
        return { code: out, map: null };
      }
    },
  };
}

// 配信元を環境変数で外へ向けたディレクトリは、web/public/の暫定の置き場から出力へ入れない。
// footer-sponsors.jsなど、これらのディレクトリ以外のpublic/の中身は常にdistへ入る。
function dropExternalPublicDirs(): Plugin {
  const external = [
    ["WIKI_NOTION_BASE", ["notion-images", "notion-files"]],
    ["WIKI_FONT_BASE", ["fonts"]],
    ["WIKI_IMAGE_BASE", ["images"]],
  ] as const;
  const dirs = external.flatMap(([name, list]) =>
    process.env[name] ? list : []
  );
  return {
    name: "drop-external-public-dirs",
    apply: "build",
    writeBundle(options) {
      if (!options.dir) {
        return;
      }
      for (const dir of dirs) {
        rmSync(resolve(options.dir, dir), { recursive: true, force: true });
      }
    },
  };
}

// KaTeXのCSSはwoff2、woff、ttfの3形式を並べる。woff2より後ろの形式を落として、woff2だけを出力に残す。
const katexWoff2Only: PostcssPlugin = {
  postcssPlugin: "katex-woff2-only",
  Declaration: {
    src(decl: Declaration) {
      const isKatex = decl.parent?.some(
        (node) =>
          node.type === "decl" &&
          node.prop === "font-family" &&
          node.value.includes("KaTeX_")
      );
      if (!isKatex) {
        return;
      }
      decl.value = decl.value.replaceAll(
        /,\s*url\([^)]+\)\s*format\("(?:woff|truetype)"\)/gu,
        ""
      );
    },
  },
};

// 上のCSSから参照されなくなったKaTeXのwoffとttfは、アセットとしては先に出力されるので、バンドルから外す。
function dropKatexLegacyFonts(): Plugin {
  return {
    name: "drop-katex-legacy-fonts",
    apply: "build",
    generateBundle(_, bundle) {
      for (const name of Object.keys(bundle)) {
        if (/KaTeX_[^/]+\.(?:woff|ttf)$/u.test(name)) {
          // oxlint-disable-next-line typescript/no-dynamic-delete -- Rollupのバンドルからアセットを外す手段がdeleteしかない
          delete bundle[name];
        }
      }
    },
  };
}

// 部品のCSSはSSRでしか参照されないので、tree-shakeで捨てられないようにしてクライアントのCSSに束ねる。
function keepCssModules(): Plugin {
  return {
    name: "keep-css-modules",
    enforce: "post",
    transform(code, id) {
      if (/\.module\.css($|\?)/u.test(id)) {
        return { code, map: null, moduleSideEffects: "no-treeshake" };
      }
    },
  };
}

const base = process.env.WIKI_BASE ?? "/";

export default defineConfig({
  base,
  define: {
    "import.meta.env.WIKI_PALETTE_SWITCHER": JSON.stringify(
      process.env.WIKI_PALETTE_SWITCHER ?? ""
    ),
  },
  plugins: [
    react(),
    watchContent(),
    assetBase(base),
    dropKatexLegacyFonts(),
    dropExternalPublicDirs(),
    keepCssModules(),
  ],
  css: { postcss: { plugins: [katexWoff2Only] } },
  build: {
    manifest: true,
  },
});
