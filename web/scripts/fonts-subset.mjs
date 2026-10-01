// 元フォントをサブセット化してpublic/fonts/にwoff2を書き出す。元のTTFはfonts-src/に置き、無ければgoogle/fontsからダウンロードする。
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import subsetFont from "subset-font";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = join(root, "fonts-src");
const outDir = join(root, "public", "fonts");
const contentDir = join(root, "..", "content");
const rawBase = "https://github.com/google/fonts/raw/main/ofl";

const sources = {
  "NotoSansJP.ttf": `${rawBase}/notosansjp/NotoSansJP%5Bwght%5D.ttf`,
  "Montserrat.ttf": `${rawBase}/montserrat/Montserrat%5Bwght%5D.ttf`,
};

async function ensureSources() {
  await mkdir(srcDir, { recursive: true });
  for (const [name, url] of Object.entries(sources)) {
    const file = join(srcDir, name);
    if (existsSync(file)) continue;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url} を取得できません(${res.status})`);
    await writeFile(file, Buffer.from(await res.arrayBuffer()));
  }
}

// JIS X 0208の区点をEUC-JP経由で文字にする。1から8区が記号、ひらがな、カタカナなど、16から47区が第1水準漢字。
function jisChars(rows) {
  const decoder = new TextDecoder("euc-jp");
  let out = "";
  for (const row of rows) {
    for (let cell = 1; cell <= 94; cell += 1) {
      const text = decoder.decode(Uint8Array.of(0xa0 + row, 0xa0 + cell));
      if (text.length === 1 && text !== "�") out += text;
    }
  }
  return out;
}

function range(from, to) {
  let out = "";
  for (let c = from; c <= to; c += 1) out += String.fromCodePoint(c);
  return out;
}

async function contentChars() {
  let out = "";
  for (const locale of await readdir(contentDir, { withFileTypes: true })) {
    if (!locale.isDirectory()) continue;
    for (const file of await readdir(join(contentDir, locale.name))) {
      if (file.endsWith(".json")) out += await readFile(join(contentDir, locale.name, file), "utf8");
    }
  }
  return out;
}

async function notoText() {
  const rows = [...Array(8).keys()].map((i) => i + 1).concat(range16to47());
  const text =
    jisChars(rows) +
    range(0x20, 0x7e) +
    range(0xa0, 0xff) +
    range(0x2010, 0x205e) +
    range(0x3000, 0x303f) +
    range(0xff00, 0xffef) +
    (await contentChars());
  return [...new Set(text)].join("");
}

function range16to47() {
  return [...Array(32).keys()].map((i) => i + 16);
}

async function write(name, buffer) {
  await writeFile(join(outDir, name), buffer);
  console.log(`${name}: ${(buffer.length / 1024).toFixed(0)}KB`);
}

async function main() {
  await ensureSources();
  await mkdir(outDir, { recursive: true });

  const noto = await readFile(join(srcDir, "NotoSansJP.ttf"));
  const text = await notoText();
  // global.cssがweight 400と700の静的2本を固定で読む。
  for (const weight of [400, 700]) {
    const fixed = await subsetFont(noto, text, {
      targetFormat: "woff2",
      variationAxes: { wght: weight },
    });
    await write(`noto-sans-jp-${weight}.woff2`, fixed);
  }

  const montserrat = await readFile(join(srcDir, "Montserrat.ttf"));
  const latin = range(0x20, 0x7e) + range(0xa0, 0xff) + range(0x2010, 0x205e);
  await write("montserrat.woff2", await subsetFont(montserrat, latin, { targetFormat: "woff2" }));
}

await main();
