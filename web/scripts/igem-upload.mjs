// web/public/の画像、PDF、フォント、3Dモデルを、iGEMのstatic.igem.wikiへアップロードする。手元で人が流す。CIでは流さない。
// 認証情報は環境変数IGEM_USERNAMEとIGEM_PASSWORD。アップロード後に一覧を引いてURLをweb/upload-manifest.jsonに記録し、記録済みと、既にiGEM側にあるファイルは飛ばす。
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import {
  basename,
  dirname,
  extname,
  join,
  relative,
  resolve,
  sep,
} from "node:path";

import { matchUploadedNames } from "./lib/upload-match.mjs";

const API = "https://api.igem.org/v1";
const DIRECTORIES = [
  "notion-images",
  "notion-files",
  "fonts",
  "images",
  "models",
];
// iGEMは送られたMIMEで受け付けを決める(SVGがapplication/xmlと判定されて422になった)ので、拡張子から明示する。
const MIME_TYPES = {
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".png": "image/png",
  ".pdf": "application/pdf",
  ".woff2": "font/woff2",
  ".glb": "model/gltf-binary",
  ".avif": "image/avif",
  ".jpg": "image/jpeg",
};
// iGEMは10MiBを超えるファイルを途中で切って受け付け、中身が壊れる。超えるファイルは上げない。
const UPLOAD_LIMIT_BYTES = 10 * 1024 * 1024;
const root = resolve(import.meta.dirname, "..");
const publicDir = join(root, "public");
const manifestFile = join(root, "upload-manifest.json");

function fail(message) {
  console.error(message);
  process.exit(1);
}

// ネットワークに出る前に認証情報の有無を確かめる。
function readCredentials() {
  const identifier = process.env.IGEM_USERNAME;
  const password = process.env.IGEM_PASSWORD;
  if (!identifier || !password) {
    fail(
      [
        "IGEM_USERNAMEとIGEM_PASSWORDが設定されていません。",
        "iGEMのアカウントのユーザー名とパスワードを環境変数に入れて、もう一度流してください。",
        "  . ~/.config/secrets/igem.env && npm run igem:upload",
        "igem.envには export IGEM_USERNAME=... と export IGEM_PASSWORD=... を書き、権限600にしてください(コマンドラインに直接書くと履歴とpsに残ります)。",
        "認証情報をGitHubのSecretsやリポジトリには置かないでください。",
      ].join("\n")
    );
  }
  return { identifier, password };
}

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walk(path)));
    } else if (entry.isFile() && !entry.name.startsWith(".")) {
      out.push(path);
    }
  }
  return out;
}

// アップロード対象。pathはpublic/からの相対パス(例: images/sponsors/a.svg)、directoryはAPIに渡す親ディレクトリ、nameはファイル名。
async function listLocalFiles() {
  const files = [];
  for (const directory of DIRECTORIES) {
    let paths;
    try {
      paths = await walk(join(publicDir, directory));
    } catch {
      continue;
    }
    for (const abs of paths.toSorted()) {
      const path = relative(publicDir, abs).split(sep).join("/");
      const info = await stat(abs);
      files.push({
        abs,
        path,
        directory: dirname(path),
        name: basename(path),
        size: info.size,
      });
    }
  }
  return files;
}

async function readManifest() {
  try {
    return JSON.parse(await readFile(manifestFile, "utf-8"));
  } catch (error) {
    if (error.code === "ENOENT") {
      return {};
    }
    fail(`upload-manifest.jsonを読めません(${error.message})`);
  }
}

async function writeManifest(manifest) {
  await writeFile(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
}

async function request(url, init, label) {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `${label}に失敗しました(HTTP ${res.status}) ${body.slice(0, 300)}`
    );
  }
  return res;
}

async function signIn({ identifier, password }) {
  const res = await request(
    `${API}/auth/sign-in`,
    {
      method: "POST",
      body: new URLSearchParams({ identifier, password }),
    },
    "サインイン"
  );
  const cookie = res.headers
    .getSetCookie()
    .map((line) => line.split(";")[0])
    .join("; ");
  if (cookie === "") {
    throw new Error("サインインのレスポンスにセッションのCookieがありません");
  }
  return cookie;
}

async function fetchAccountUuid(cookie) {
  const res = await request(
    `${API}/auth/me`,
    { headers: { cookie } },
    "アカウントの取得"
  );
  const account = await res.json();
  const uuid = account?.uuid;
  if (typeof uuid !== "string") {
    throw new TypeError("アカウントの応答にuuidがありません");
  }
  return uuid;
}

// IGEM_TEAM_IDがあればそれを使う。無ければ所属チームを取り、1つだけのときにそれを使う。複数あれば一覧を出して止める。
async function fetchTeamId(cookie) {
  if (process.env.IGEM_TEAM_ID) {
    return process.env.IGEM_TEAM_ID;
  }
  const accountUuid = await fetchAccountUuid(cookie);
  const res = await request(
    `${API}/accounts/${accountUuid}/rosters`,
    { headers: { cookie } },
    "チームの取得"
  );
  const rosters = await res.json();
  if (!Array.isArray(rosters)) {
    throw new TypeError(
      `チームの取得の応答が想定の形(配列)ではありません: ${JSON.stringify(rosters).slice(0, 200)}`
    );
  }
  const ids = [
    ...new Set(
      rosters
        .map((item) => item?.team?.id)
        .filter((id) => id !== undefined && id !== null)
        .map(String)
    ),
  ];
  if (ids.length === 0) {
    throw new Error("チームのidを応答から読み取れませんでした");
  }
  if (ids.length > 1) {
    throw new Error(
      `所属チームが複数あります(${ids.join(", ")})。上げ先のidをIGEM_TEAM_IDに指定して、もう一度流してください`
    );
  }
  return ids[0];
}

// wikiのリポジトリのuuid。ファイルの一覧とアップロードのURLに要る。
async function fetchRepoUuid(cookie, teamId) {
  const res = await request(
    `${API}/teams/${teamId}/wiki`,
    { headers: { cookie } },
    "wikiのリポジトリの取得"
  );
  const wiki = await res.json();
  const uuid = wiki?.uuid;
  if (typeof uuid !== "string") {
    throw new TypeError("wikiのリポジトリの応答にuuidがありません");
  }
  return uuid;
}

function filesUrl(teamId, repoUuid, directory) {
  const url = new URL(`${API}/teams/${teamId}/repositories/${repoUuid}/files`);
  if (directory) {
    url.searchParams.set("directory", directory);
  }
  return url;
}

// ディレクトリ直下のファイル名とURLの対応。存在しないディレクトリは空で返る。
async function listRemote(repo, directory) {
  const res = await request(
    filesUrl(repo.teamId, repo.uuid, directory),
    { headers: { cookie: repo.cookie } },
    `${directory}の一覧取得`
  );
  const data = await res.json();
  if (!Array.isArray(data?.files)) {
    throw new TypeError(
      `${directory}の一覧の応答にfilesの配列がありません: ${JSON.stringify(data).slice(0, 200)}`
    );
  }
  return new Map(
    data.files
      .filter((entry) => typeof entry?.name === "string")
      .map((entry) => [entry.name, entry.url])
  );
}

// 成功は201で本文は空。URLは返らないので、呼び出し側が後から一覧で引く。
async function upload(repo, file) {
  const form = new FormData();
  const type = MIME_TYPES[extname(file.name).toLowerCase()] ?? "";
  form.append(
    "file",
    new Blob([await readFile(file.abs)], { type }),
    file.name
  );
  await request(
    filesUrl(repo.teamId, repo.uuid, file.directory),
    { method: "POST", headers: { cookie: repo.cookie }, body: form },
    `${file.path}のアップロード`
  );
}

async function main() {
  const credentials = readCredentials();
  const files = await listLocalFiles();
  const manifest = await readManifest();

  const cookie = await signIn(credentials);
  const teamId = await fetchTeamId(cookie);
  const uuid = await fetchRepoUuid(cookie, teamId);
  const repo = { cookie, teamId, uuid };
  console.log(`team_id: ${teamId}`);
  console.log(`repository: ${uuid}`);

  const directories = [...new Set(files.map((file) => file.directory))];
  const remote = new Map();
  for (const directory of directories) {
    remote.set(directory, await listRemote(repo, directory));
  }

  const failed = [];
  const oversized = [];
  const uploadedDirectories = new Set();
  const pending = [];
  let skipped = 0;
  for (const file of files) {
    if (manifest[file.path]) {
      skipped += 1;
      continue;
    }
    const existing = remote.get(file.directory)?.get(file.name);
    if (existing) {
      skipped += 1;
      manifest[file.path] = { url: existing };
      continue;
    }
    if (file.size > UPLOAD_LIMIT_BYTES) {
      oversized.push(file);
      continue;
    }
    try {
      await upload(repo, file);
      uploadedDirectories.add(file.directory);
      pending.push(file);
      console.log(`上げました: ${file.path}`);
    } catch (error) {
      failed.push(`${file.path}: ${error.message}`);
    }
  }
  await writeManifest(manifest);

  // アップロードの応答にURLが無いので、上げたディレクトリの一覧を1回ずつ引き直し、元のパスと実際のURLを対応させる。
  // iGEMが名前を作り変えることがあるので、同じ名前が無いときは、上げる前の一覧との差分(新しく現れた名前)から引き当てる。
  for (const directory of uploadedDirectories) {
    const before = [...(remote.get(directory)?.keys() ?? [])];
    let after;
    try {
      after = await listRemote(repo, directory);
    } catch (error) {
      failed.push(`${directory}: ${error.message}`);
      continue;
    }
    remote.set(directory, after);
    const inDirectory = pending.filter((file) => file.directory === directory);
    const { matched } = matchUploadedNames(
      inDirectory.map((file) => file.name),
      before,
      [...after.keys()]
    );
    for (const file of inDirectory) {
      const name = matched.get(file.name);
      if (typeof after.get(name) !== "string") {
        failed.push(`${file.path}: アップロード後の一覧にURLが見つかりません`);
        continue;
      }
      manifest[file.path] = { url: after.get(name) };
      if (name !== file.name) {
        console.log(`名前が変わりました: ${file.path} → ${name}`);
      }
    }
  }
  await writeManifest(manifest);

  console.log(
    `igem-upload: 対象${files.length}件、アップロード${pending.length}件、スキップ${skipped}件、失敗${failed.length}件、上限超え${oversized.length}件`
  );
  if (oversized.length > 0) {
    console.error(
      "10MiBを超えるため上げなかったファイル(小さくしてから流してください):"
    );
    for (const file of oversized) {
      console.error(
        `  ${file.path} (${(file.size / 1024 / 1024).toFixed(2)}MiB)`
      );
    }
    process.exitCode = 1;
  }
  if (failed.length > 0) {
    console.error("失敗したファイル:");
    for (const line of failed) {
      console.error(`  ${line}`);
    }
    process.exitCode = 1;
  }
}

try {
  await main();
} catch (error) {
  fail(`igem-upload: ${error.message}`);
}
