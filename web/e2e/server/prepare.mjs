// E2E用のビルド。WIKI_BASE=/keio/ の dist を e2e/.site/keio/ に退避してから、base なしの dist を作る。
// どちらも PRERENDER_ALL=1 で、published: false の E2E 用ページも書き出す。
import { execFileSync } from "node:child_process";
import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
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

build({ WIKI_BASE: "/keio/" });
await cp(join(root, "dist"), join(site, "keio"), { recursive: true });
await writeFile(join(site, "ready"), "");

build({ WIKI_BASE: "/" });
