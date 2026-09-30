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

export default defineConfig({
  base: process.env.WIKI_BASE ?? "/",
  plugins: [react(), watchContent()],
  build: {
    manifest: true,
  },
});
