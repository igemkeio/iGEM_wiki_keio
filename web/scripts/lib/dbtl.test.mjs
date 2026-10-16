import assert from "node:assert/strict";
import { test } from "node:test";

import { readDbtl } from "./dbtl.mjs";

const iterationTable = (n) =>
  `<table>
<thead>
<tr>
<th><strong>DESIGN</strong></th>
<th><strong>BUILD</strong></th>
<th><strong>TEST</strong></th>
<th><strong>LEARN</strong></th>
</tr>
</thead>
<tbody><tr>
<td>設計${n}の<strong>太字</strong></td>
<td>構築${n}</td>
<td>試験${n} [1]</td>
<td>学び${n}</td>
</tr>
</tbody></table>`;

const hypothesisTable = `<table>
<thead>
<tr>
<th><strong>仮説</strong></th>
<th>鋳型が残っている。</th>
</tr>
</thead>
<tbody><tr>
<td><strong>成功基準</strong></td>
<td>陽性コロニーが得られる。</td>
</tr>
</tbody></table>`;

const iteration = (n, title = `題${n}`) =>
  `<p><strong>反復${n} — ${title}</strong></p>\n${iterationTable(n)}`;

const cycleHeading = (layer, mark, title, tagline) =>
  `<h2 id="c-${mark}">〔${layer}〕${mark} ${title} — ${tagline}</h2>`;

const baseCycle = `${cycleHeading("基盤", "①", "クローニング技術", "鋳型をいかに取り除くか")}
<h3 id="why">なぜこの仮説に至ったか</h3>
<p>iVEC3 法 [1] を使う。</p>
${hypothesisTable}
${iteration(1, "msfGFP のみが出る：疑う")}
<p>本文中の反復1 に触れる段落。</p>
<p><em>〔図〕 キャプション</em></p>
<p>設計の根拠と実行 — 理由。</p>
${iteration(2)}
<p><strong>このサイクルで確立したこと</strong></p>
<ul>
<li>DpnI が効く。</li>
</ul>
<p><strong>↳ 次のサイクルへ</strong>　<em>次へ渡す。→ ② 観察系</em></p>`;

const designCycle = `${cycleHeading("設計", "②", "接着モジュール", "相手を選ぶ")}
<p><strong>✓ エンジニアリングの達成</strong>　示せた。</p>
<h3 id="why-2">なぜこの仮説に至ったか</h3>
<p>理由。</p>
${hypothesisTable}
${iteration(1)}
<p><strong>このサイクルの現状</strong></p>
<ul>
<li>観察した。</li>
</ul>
<p><strong>↳ 次のサイクルへ</strong>　<em>展望へ。→ 展望</em></p>`;

const page = (...cycles) => {
  const [base, design] = cycles;
  return `<h2 id="e">Engineering</h2>
<p>前置き。</p>
<h2 id="p1">第 I 部　道具をつくる（基盤サイクル）</h2>
<p>基盤の説明。</p>
${base}
<h2 id="p2">第 II 部　道具で設計を試す（設計サイクル）</h2>
<p>設計の説明。</p>
${design}
<h2 id="o">展望 — 先</h2>
<p>展望の本文。</p>
<h2 id="r">参考文献</h2>
<ol>
<li>文献</li>
</ol>`;
};

test("サイクル、層、反復を読み取る", () => {
  const { dbtl, warning } = readDbtl(page(baseCycle, designCycle));
  assert.equal(warning, undefined);
  assert.equal(dbtl.parts.length, 2);
  assert.deepEqual(
    dbtl.parts.map((part) => [part.label, part.title]),
    [
      ["第 I 部", "道具をつくる（基盤サイクル）"],
      ["第 II 部", "道具で設計を試す（設計サイクル）"],
    ]
  );
  assert.equal(dbtl.parts[0].introHtml, "<p>基盤の説明。</p>");

  const [first] = dbtl.parts[0].cycles;
  const [second] = dbtl.parts[1].cycles;
  assert.deepEqual(
    [first.no, first.layer, first.title, first.tagline],
    [1, "base", "クローニング技術", "鋳型をいかに取り除くか"]
  );
  assert.deepEqual(
    [second.no, second.layer, second.title, second.tagline],
    [2, "design", "接着モジュール", "相手を選ぶ"]
  );
  assert.equal(first.whyHtml, "<p>iVEC3 法 [1] を使う。</p>");
  assert.equal(first.hypothesis, "鋳型が残っている。");
  assert.equal(first.criteria, "陽性コロニーが得られる。");
  assert.equal(first.outcomesHtml, "<ul>\n<li>DpnI が効く。</li>\n</ul>");
  assert.equal(first.handoffHtml, "<em>次へ渡す。→ ② 観察系</em>");
  assert.equal(second.outcomesHtml, "<ul>\n<li>観察した。</li>\n</ul>");
  assert.equal(
    second.leadHtml,
    "<p><strong>✓ エンジニアリングの達成</strong>　示せた。</p>"
  );
  assert.equal("leadHtml" in first, false);
});

test("反復は太字の段落にだけアンカーし、表のセルはHTMLのまま持つ", () => {
  const { dbtl } = readDbtl(page(baseCycle, designCycle));
  const [first] = dbtl.parts[0].cycles;
  assert.equal(first.iterations.length, 2);
  assert.deepEqual(first.iterations[0], {
    no: 1,
    title: "msfGFP のみが出る：疑う",
    design: "設計1の<strong>太字</strong>",
    build: "構築1",
    test: "試験1 [1]",
    learn: "学び1",
    notesHtml:
      "<p>本文中の反復1 に触れる段落。</p>\n<p><em>〔図〕 キャプション</em></p>\n<p>設計の根拠と実行 — 理由。</p>",
  });
  assert.equal(first.iterations[1].notesHtml, "");
});

test("最初の層より前をintro、最後のサイクルより後をoutroにする", () => {
  const { dbtl } = readDbtl(page(baseCycle, designCycle));
  assert.equal(dbtl.intro, '<h2 id="e">Engineering</h2>\n<p>前置き。</p>');
  assert.ok(dbtl.outro.startsWith('<h2 id="o">展望 — 先</h2>'));
  assert.ok(dbtl.outro.endsWith("</ol>"));
});

test("見出しがh1でも読み取れる", () => {
  const html = page(baseCycle, designCycle)
    .replace('<h2 id="p1">', '<h1 id="p1">')
    .replace("（基盤サイクル）</h2>", "（基盤サイクル）</h1>");
  assert.equal(readDbtl(html).dbtl.parts.length, 2);
});

test("構造が無いテンプレートのままの原稿は警告なしで読み取らない", () => {
  const template = `<h3 id="silver-medal-criterion-1">Silver Medal Criterion #1</h3>
<p>Demonstrate engineering success &amp; go through one iteration.</p>
<p>Visit the <a href="https://competition.igem.org/judging/medals">Medals page</a>.</p>
<h2 id="tips-for-success">Tips for Success</h2>
<p>Design → Build → Test → Learn</p>
<p>Visit the <a href="https://technology.igem.org/engineering">Engineering pages</a>.</p>`;
  assert.deepEqual(readDbtl(template), { dbtl: null });
  assert.deepEqual(readDbtl(""), { dbtl: null });
});

const expectWarning = (html, pattern) => {
  const result = readDbtl(html);
  assert.equal(result.dbtl, null);
  assert.match(result.warning, pattern);
};

test("反復の直後に4列の表が無いと警告して読み取らない", () => {
  const broken = baseCycle.replace(iterationTable(2), hypothesisTable);
  expectWarning(page(broken, designCycle), /サイクル1.*反復2/u);
});

test("仮説の表が無いと警告して読み取らない", () => {
  const broken = designCycle.replace(hypothesisTable, "");
  expectWarning(page(baseCycle, broken), /サイクル2.*仮説/u);
});

test("確立したことの見出しが無いと警告して読み取らない", () => {
  const broken = baseCycle.replace(
    "<p><strong>このサイクルで確立したこと</strong></p>",
    ""
  );
  expectWarning(page(broken, designCycle), /サイクル1/u);
});

test("サイクルの番号が飛ぶと警告して読み取らない", () => {
  const broken = designCycle.replaceAll("②", "③");
  expectWarning(page(baseCycle, broken), /サイクル3.*2/u);
});

test("1つでも崩れたサイクルがあれば、残りが正しくても何も出さない", () => {
  const broken = designCycle.replace(
    '<h3 id="why-2">なぜこの仮説に至ったか</h3>',
    ""
  );
  const result = readDbtl(page(baseCycle, broken));
  assert.equal(result.dbtl, null);
  assert.ok(result.warning);
});

test("層の見出しだけでサイクルが無いと警告する", () => {
  expectWarning(
    '<h2 id="p1">第 I 部　道具をつくる（基盤サイクル）</h2>\n<p>本文</p>',
    /サイクル/u
  );
});

test("反復の見出しが太字でなくなっても、最後の反復の表を黙って落とさない", () => {
  const broken = baseCycle.replace(
    "<p><strong>反復2 — 題2</strong></p>",
    "<p>反復2 — 題2</p>"
  );
  expectWarning(page(broken, designCycle), /サイクル1.*反復の見出し/u);
});

test("最後のサイクルの見出しが読めないと、outroに落とさず警告する", () => {
  const secondDesign = designCycle
    .replace("②", "③")
    .replace('id="c-③"', 'id="c-3"');
  const brokenLast = secondDesign.replace(
    "接着モジュール — 相手を選ぶ",
    "接着モジュール – 相手を選ぶ"
  );
  expectWarning(
    page(baseCycle, `${designCycle}\n${brokenLast}`),
    /最後のサイクルより後/u
  );
});

test("次のサイクルへの受け渡しが読めないと警告する", () => {
  const broken = designCycle.replace("↳ 次のサイクルへ", "→ 次へ");
  expectWarning(page(baseCycle, broken), /サイクル2.*受け渡し/u);
});

test("反復の表の形が崩れた警告にもサイクル番号が付く", () => {
  const broken = baseCycle.replace("<td>学び2</td>\n", "");
  expectWarning(page(broken, designCycle), /サイクル1: 反復の表/u);
});

test("pに属性が付いていても太字の段落を読める", () => {
  const html = page(baseCycle, designCycle).replaceAll(
    "<p><strong>",
    '<p class="x"><strong>'
  );
  assert.equal(readDbtl(html).dbtl.parts[0].cycles[0].iterations.length, 2);
});

test("&nbsp;が入っていても読み取れる", () => {
  const html = page(baseCycle, designCycle).replace(
    "<strong>DESIGN</strong>",
    "<strong>DESIGN&nbsp;</strong>"
  );
  const { dbtl, warning } = readDbtl(html);
  assert.equal(warning, undefined);
  assert.equal(dbtl.parts[0].cycles[0].iterations.length, 2);
});
