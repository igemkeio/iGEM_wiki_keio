// web/public/の画像、PDF、フォント、3Dモデルを、iGEMのstatic.igem.wikiへアップロードする。手元で人が流す。CIでは流さない。
// 認証情報は環境変数IGEM_USERNAMEとIGEM_PASSWORD。返ってきたURLをweb/upload-manifest.jsonに記録し、記録済みと、既にiGEM側にあるファイルは飛ばす。
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";

const API = "https://api.igem.org/v1";
const DIRECTORIES = [
  "notion-images",
  "notion-files",
  "fonts",
  "images",
  "models",
];
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

// アップロード対象。pathはpublic/からの相対パス(例: notion-images/a.webp)、directoryはAPIに渡すディレクトリ名、nameはファイル名。
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
      files.push({
        abs,
        path,
        directory,
        name: path.slice(directory.length + 1),
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

// 応答の形はAPIの文書が無いので、配列(またはdata、itemsの中の配列)を想定して、team_idらしいキーを浅く探す。
function toArray(data, label) {
  const items = Array.isArray(data) ? data : (data?.data ?? data?.items);
  if (!Array.isArray(items)) {
    throw new TypeError(
      `${label}の応答が想定の形(配列)ではありません: ${JSON.stringify(data).slice(0, 200)}`
    );
  }
  return items;
}

function teamIdOf(item) {
  const id = item?.team_id ?? item?.teamId ?? item?.team?.id;
  return id === undefined || id === null ? null : String(id);
}

// IGEM_TEAM_IDがあればそれを使う。無ければ所属チームを取り、1つだけのときにそれを使う。複数あれば一覧を出して止める。
async function fetchTeamId(cookie) {
  if (process.env.IGEM_TEAM_ID) {
    return process.env.IGEM_TEAM_ID;
  }
  const res = await request(
    `${API}/teams/memberships/mine?onlyAcceptedTeams=true`,
    { headers: { cookie } },
    "チームの取得"
  );
  const ids = [
    ...new Set(
      toArray(await res.json(), "チームの取得")
        .map(teamIdOf)
        .filter((id) => id !== null)
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

// 応答からURLまたはファイル名らしい値を取り出す。文字列、またはurl、name、pathなどを持つ要素を許す。
function entryUrl(entry) {
  if (typeof entry === "string") {
    return entry;
  }
  return entry?.url ?? entry?.href ?? entry?.path ?? entry?.name;
}

async function listRemote(cookie, teamId, directory) {
  const res = await request(
    `${API}/websites/teams/${teamId}?directory=${encodeURIComponent(directory)}`,
    { headers: { cookie } },
    `${directory}の一覧取得`
  );
  const data = await res.json();
  const items = Array.isArray(data) ? data : (data?.data ?? data?.files);
  if (!Array.isArray(items)) {
    throw new TypeError(
      `${directory}の一覧の応答が想定の形(配列)ではありません: ${JSON.stringify(data).slice(0, 200)}`
    );
  }
  return items.map(entryUrl).filter(Boolean);
}

async function upload(cookie, teamId, file) {
  const form = new FormData();
  form.append("file", new Blob([await readFile(file.abs)]), file.name);
  const res = await request(
    `${API}/websites/teams/${teamId}?directory=${encodeURIComponent(file.directory)}`,
    { method: "POST", headers: { cookie }, body: form },
    `${file.path}のアップロード`
  );
  const data = await res.json().catch(() => ({}));
  const url = entryUrl(data?.data ?? data);
  if (typeof url !== "string" || !url.startsWith("http")) {
    throw new Error(
      `${file.path}: 応答から最終URLを読み取れませんでした(${JSON.stringify(data).slice(0, 200)})`
    );
  }
  return url;
}

async function main() {
  const credentials = readCredentials();
  const files = await listLocalFiles();
  const manifest = await readManifest();

  const cookie = await signIn(credentials);
  const teamId = await fetchTeamId(cookie);
  console.log(`team_id: ${teamId}`);

  const remote = new Map();
  for (const directory of DIRECTORIES) {
    remote.set(directory, await listRemote(cookie, teamId, directory));
  }
  // 一覧の要素がURLならファイル名の末尾で、名前だけなら完全一致で、既に上がっているかを見る。
  const findRemote = (file) =>
    (remote.get(file.directory) ?? []).find(
      (item) => item === file.name || item.endsWith(`/${file.name}`)
    );

  const failed = [];
  let uploaded = 0;
  let skipped = 0;
  for (const file of files) {
    if (manifest[file.path]) {
      skipped += 1;
      continue;
    }
    const existing = findRemote(file);
    if (existing) {
      skipped += 1;
      // 一覧の要素がURLのときだけ、manifestに対応を残す。
      if (existing.startsWith("http")) {
        manifest[file.path] = { url: existing };
        await writeFile(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
      }
      continue;
    }
    try {
      const url = await upload(cookie, teamId, file);
      manifest[file.path] = { url };
      uploaded += 1;
      console.log(`上げました: ${file.path} -> ${url}`);
      await writeFile(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
    } catch (error) {
      failed.push(`${file.path}: ${error.message}`);
    }
  }

  console.log(
    `igem-upload: 対象${files.length}件、アップロード${uploaded}件、スキップ${skipped}件、失敗${failed.length}件`
  );
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
