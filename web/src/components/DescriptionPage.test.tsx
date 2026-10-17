import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { readPage } from "../content";
import { toText } from "../lib/toc";
import { Page } from "../Page";
import { pagePath } from "../routes";

const assets = { css: ["assets/index-abc.css"], js: "assets/index-abc.js" };
const manuscript = JSON.parse(
  readFileSync(
    resolve(import.meta.dirname, "../../../content/ja/description.json"),
    "utf-8"
  )
);

// 空白の入り方(strongとその後ろ、カードの見出しと説明)の違いを無視して比べる。
const squash = (text: string) => text.replaceAll(/\s+/gu, "");
// 見出しや段落のタグを外して文字だけにする。
const textOf = (html: string) => squash(toText(html));

// 下書き以降は本編の文を再掲しているので、本編の照合には使わない。
const draftMarker = 'id="下書き1"';
const mainOf = (html: string) => {
  const at = html.indexOf(draftMarker);
  expect(at).toBeGreaterThan(-1);
  return html.slice(0, at);
};

const render = (html: string) => {
  const page = readPage({ ...manuscript, html });
  return renderToStaticMarkup(
    <Page
      page={page}
      routes={[{ page, path: pagePath(page) }]}
      assets={assets}
    />
  );
};

// 帯の色クラス(bandWireなど)から、次の帯の手前までを切り出す。
const bandBlock = (html: string, name: string) => {
  const from = html.indexOf(`_band${name}_`);
  expect(from).toBeGreaterThan(-1);
  const next = html.indexOf("_band_", from);
  return html.slice(from, next === -1 ? undefined : next);
};

describe("日本語版Description", () => {
  const html = render(manuscript.html);

  it("専用の部品で出している", () => {
    expect(html).toContain("ONE DIRECTION");
    expect(html).toContain('<span id="project-description"');
  });

  it("原稿の本編のp、liの文が画面の本編から落ちていない", () => {
    const shown = textOf(mainOf(html));
    // note__labelはMessageの枠の見出しで、画面には持ち込まない。
    const source = [
      ...mainOf(manuscript.html).matchAll(
        /<(p|li)\b([^>]*)>([\s\S]*?)<\/\1>/gu
      ),
    ].filter((m) => !m[2].includes("note__label"));
    expect(source.length).toBeGreaterThan(30);
    const missing = source
      .map((m) => textOf(m[3].replace(/^\s*\[\d+\]\s*/u, "")))
      .filter((text) => text !== "" && !shown.includes(text));
    expect(missing).toStrictEqual([]);
  });

  it("原稿のApplicationsの並びを入れ替えても、帯の色と中身が節のidに付いてくる", () => {
    const src: string = manuscript.html;
    const at = (id: string) => src.indexOf(`<h3 id="${id}`);
    const wires = at("bacterial-wires");
    const bandages = at("smart-bandages");
    const cascade = at("cascade-enzyme-pathways");
    expect(wires).toBeLessThan(bandages);
    expect(bandages).toBeLessThan(cascade);
    const swapped =
      src.slice(0, wires) +
      src.slice(bandages, cascade) +
      src.slice(wires, bandages) +
      src.slice(cascade);
    const out = render(swapped);

    const bandage = bandBlock(out, "Bandage");
    expect(bandage).toContain('id="smart-bandages');
    expect(bandage).toContain("必要なものを、決まった向きに届ける。");
    const wire = bandBlock(out, "Wire");
    expect(wire).toContain('id="bacterial-wires');
    expect(wire).toContain("信号を一方向に伝える、生きた配線。");
    expect(out.indexOf("_bandBandage_")).toBeLessThan(
      out.indexOf("_bandWire_")
    );
  });
});
