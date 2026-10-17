// 開発用。vite build --watchでビルドし、完了ごとにprerenderを走らせ、vite previewで配信する。
import { build, preview } from "vite";

import { prerender } from "./prerender.mjs";

// 開発ではビルド後の差し替えを流さないので、アップロードの対応表は明示がなければ使わない。
process.env.WIKI_UPLOAD_MANIFEST ??= "";

let running = false;
let pending = false;

async function runPrerender() {
  if (running) {
    pending = true;
    return;
  }
  running = true;
  try {
    await prerender();
  } catch (error) {
    console.error(error);
  } finally {
    running = false;
    if (pending) {
      pending = false;
      await runPrerender();
    }
  }
}

const watcher = await build({ build: { watch: {} } });
watcher.on("event", (event) => {
  if (event.code === "END") {
    void runPrerender();
  }
  if (event.code === "ERROR") {
    console.error(event.error);
  }
});

const server = await preview();
server.printUrls();
