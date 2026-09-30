// 開発用。vite build --watch でビルドし、完了ごとに prerender を走らせ、vite preview で配信する。
import { build, preview } from "vite";
import { prerender } from "./prerender.mjs";

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
  if (event.code === "END") void runPrerender();
  if (event.code === "ERROR") console.error(event.error);
});

const server = await preview();
server.printUrls();
