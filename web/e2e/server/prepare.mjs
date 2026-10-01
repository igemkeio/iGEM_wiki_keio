// E2E用のビルド。WIKI_BASE=/keio/のdistをe2e/.site/keio/に退避してから、baseなしのdistを作る。
// どちらもPRERENDER_ALL=1で、published: falseのE2E用ページも書き出す。
import { execFileSync } from "node:child_process";
import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const site = join(root, "e2e", ".site");

function build(env) {
  execFileSync("npm", ["run", "build"], {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, PRERENDER_ALL: "1", ...env },
  });
}

await rm(site, { recursive: true, force: true });
await mkdir(site, { recursive: true });

let ok = false;
try {
  build({ WIKI_BASE: "/keio/" });
  await cp(join(root, "dist"), join(site, "keio"), { recursive: true });
  await writeFile(join(site, "ready"), "");
  build({ WIKI_BASE: "/" });
  ok = true;
} finally {
  // 失敗した中途半端な.siteを、配信側が読まないよう消す。
  if (!ok) {
    await rm(site, { recursive: true, force: true });
  }
}
