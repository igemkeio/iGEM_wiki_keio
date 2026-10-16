import assert from "node:assert/strict";
import { test } from "node:test";

import { readHp } from "./hp.mjs";

const interview = (heading, { sections = true } = {}) =>
  sections
    ? `<h2 id="x">${heading}</h2>
<p>導入。</p>
<h3>目的</h3>
<p>目的の本文。</p>
<h3>Take home</h3>
<p>学び。</p>
<details>
<summary>click here!</summary><h3>サブパート１　題</h3>
<p>詳細。</p>
</details>`
    : `<h2 id="x">${heading}</h2>
<p>本文だけ。</p>`;

const ch1 = [
  interview(
    "**1.1　進化の観点から見る多細胞化と細胞極性　（**<strong>堀田先生</strong>　<strong>慶應義塾大学）</strong>"
  ),
  interview(
    "1.2　合成生物学の観点から見る多細胞システム　戸田先生（大阪大学）"
  ),
  interview("1.3　空間的秩序を合成生物学の新たな設計要素へ（Henrike先生 TUM）"),
  interview(
    "1.4　細胞間相互作用の空間制御から集団の秩序を設計する（Benoît Ladoux先生）"
  ),
  interview("1.5　XXX（竹内一将先生）"),
].join("\n");

const ch2 = `<h2 id="u1"><u><strong>2.1　スマート包帯（創傷被覆・組織修復用）</strong></u></h2>
<p>用途1の導入。</p>
${interview("**2.1.A　配向制御によるBCの高機能化の可能性（**田島XXX先生・北海道大学）")}
${interview("2.1.B　展開（高山剛先生・東京大学）")}
${interview("2.1.C　社会実装（磯貝明先生・東京大学）")}
${interview("2.1.D　富士フィルム（網中さん）")}
<h2 id="c1">結論</h2>
<p>結論1。</p>
<h2 id="u2"><u><strong>2.2　バクテリアワイヤー</strong></u></h2>
${interview("2.2.A　電子の流れ（岡本章玄先生　高分子・バイオ材料研究センター）")}
${interview("2.2.B　XXX（Bentley先生）", { sections: false })}
<h2 id="c2">結論</h2>
<p>結論2。</p>
<h2 id="u3"><u>2.3</u>　<u><strong>カスケード酵素流路</strong></u></h2>
${interview("2.3.A　<strong>輸送</strong>（加藤 創一郎先生　東京大学 大学院農学生命科学研究科）")}
${interview("2.3.B　空間配置（本田孝祐先生　大阪大学 生物工学国際交流センター）")}
${interview("2.3.C　産業化（宮本先生　慶応義塾大学）")}
<h2 id="c3">結論</h2>
<p>結論3。</p>`;

const ch4 = `<h2 id="c4">４章　<strong>Limitations, Future Directions, and Conclusion</strong></h2>
<p>4章の導入。</p>
<h2 id="c41">4.1　技術の価値と限界</h2>
<p>価値。</p>
<h2 id="c42">4.2　プロジェクトの課題</h2>
<h3 id="c42a">4.2.A　強度</h3>
<p>強度。</p>`;

const page = ({
  chapter1 = ch1,
  chapter2 = ch2,
  chapter4 = ch4,
} = {}) => `<h3>銀メダル基準 #2</h3>
<p>基準。</p>
<h2 id="o">概要</h2>
<p>概要の本文。</p>
<h2 id="s"><strong>Human Practice ストーリー構成</strong></h2>
<h2 id="c0"><strong>0章</strong>　<strong>私たちのプロジェクトに辿り着くまでの道のり</strong></h2>
<p>0章の本文。</p>
<h2 id="c1"><strong>1章　方向性を考える</strong></h2>
<p>1章の導入。</p>
${chapter1}
<h2 id="c2"><strong>2章　社会的な側面</strong></h2>
<p>2章の導入。</p>
${chapter2}
${chapter4}`;

test("正常な原稿から章・用途・面談を読み取る", () => {
  const { hp, warning } = readHp(page());
  assert.equal(warning, undefined);
  assert.ok(hp.intro.includes("銀メダル基準"));
  assert.ok(hp.intro.includes("概要の本文"));
  assert.deepEqual(hp.chapter0, {
    title: "私たちのプロジェクトに辿り着くまでの道のり",
    html: "<p>0章の本文。</p>",
  });
  assert.equal(hp.chapter1.title, "方向性を考える");
  assert.equal(hp.chapter1.introHtml, "<p>1章の導入。</p>");
  assert.equal(hp.chapter1.interviews.length, 5);
  assert.equal(hp.chapter2.title, "社会的な側面");
  assert.equal(hp.chapter2.introHtml, "<p>2章の導入。</p>");
  assert.equal(hp.chapter2.uses.length, 3);
  assert.equal(
    hp.chapter2.uses.reduce((sum, use) => sum + use.interviews.length, 0),
    9
  );
  assert.equal(
    hp.chapter4.title,
    "Limitations, Future Directions, and Conclusion"
  );
  assert.ok(hp.chapter4.html.includes("4.1　技術の価値と限界"));
  assert.ok(hp.chapter4.html.includes("4.2.A　強度"));
});

test("面談の番号・題・人名・所属を取る(太字の残骸を除く)", () => {
  const { hp } = readHp(page());
  const [i11, i12, i13, i14, i15] = hp.chapter1.interviews;
  assert.deepEqual(
    [i11.no, i11.title, i11.person, i11.affiliation],
    ["1.1", "進化の観点から見る多細胞化と細胞極性", "堀田先生", "慶應義塾大学"]
  );
  assert.deepEqual(
    [i12.no, i12.person, i12.affiliation],
    ["1.2", "", "大阪大学"]
  );
  assert.deepEqual([i13.person, i13.affiliation], ["Henrike先生", "TUM"]);
  assert.deepEqual([i14.person, i14.affiliation], ["Benoît Ladoux先生", ""]);
  assert.deepEqual([i15.person, i15.affiliation], ["竹内一将先生", ""]);

  const [useA, useB, useC] = hp.chapter2.uses;
  const [a] = useA.interviews;
  assert.deepEqual(
    [a.no, a.title, a.person, a.affiliation],
    ["2.1.A", "配向制御によるBCの高機能化の可能性", "田島XXX先生", "北海道大学"]
  );
  assert.deepEqual(
    [useA.interviews[3].person, useA.interviews[3].affiliation],
    ["網中さん", ""]
  );
  const [wire] = useB.interviews;
  assert.deepEqual(
    [wire.person, wire.affiliation],
    ["岡本章玄先生", "高分子・バイオ材料研究センター"]
  );
  const [cascade] = useC.interviews;
  assert.equal(cascade.title, "輸送");
  assert.deepEqual(
    [cascade.person, cascade.affiliation],
    ["加藤 創一郎先生", "東京大学 大学院農学生命科学研究科"]
  );
});

test("用途の番号・題・副題・導入・結論を取る", () => {
  const { hp } = readHp(page());
  const [u1, u2, u3] = hp.chapter2.uses;
  assert.deepEqual(
    [u1.no, u1.title, u1.subtitle, u1.introHtml, u1.conclusionHtml],
    [
      "2.1",
      "スマート包帯",
      "創傷被覆・組織修復用",
      "<p>用途1の導入。</p>",
      "<p>結論1。</p>",
    ]
  );
  assert.deepEqual(
    [u2.no, u2.title, u2.subtitle],
    ["2.2", "バクテリアワイヤー", ""]
  );
  assert.equal(u2.conclusionHtml, "<p>結論2。</p>");
  assert.deepEqual([u3.no, u3.title], ["2.3", "カスケード酵素流路"]);
  assert.equal(u3.conclusionHtml, "<p>結論3。</p>");
  assert.ok(u1.interviews.every((i) => !i.title.includes("結論")));
});

test("題に XXX を含む面談だけ draft になる", () => {
  const { hp } = readHp(page());
  const all = [
    ...hp.chapter1.interviews,
    ...hp.chapter2.uses.flatMap((use) => use.interviews),
  ];
  assert.deepEqual(
    all.filter((i) => i.draft === true).map((i) => i.no),
    ["1.5", "2.1.A", "2.2.B"]
  );
  assert.ok(all.every((i) => i.draft === undefined || i.draft === true));
});

test("目的・Take home・詳細を分ける。h3 が無い面談は空で、警告しない", () => {
  const { hp, warning } = readHp(page());
  assert.equal(warning, undefined);
  const [first] = hp.chapter1.interviews;
  assert.equal(first.purposeHtml, "<p>目的の本文。</p>");
  assert.equal(first.takeHomeHtml, "<p>学び。</p>");
  assert.ok(first.detailHtml.includes("サブパート１"));
  const [, bare] = hp.chapter2.uses[1].interviews;
  assert.equal(bare.purposeHtml, "");
  assert.equal(bare.takeHomeHtml, "");
  assert.equal(bare.detailHtml, "<p>本文だけ。</p>");
});

test("半角スペース・全角の章番号でも読める", () => {
  const html = page()
    .replace("<strong>1章　方向性を考える</strong>", "１章 方向性を考える")
    .replace("1.2　合成", "１．２ 合成")
    .replace("2.1.B　展開", "2.1.B 展開");
  const { hp, warning } = readHp(html);
  assert.equal(warning, undefined);
  assert.equal(hp.chapter1.title, "方向性を考える");
  assert.equal(hp.chapter1.interviews[1].no, "1.2");
  assert.equal(hp.chapter2.uses[0].interviews[1].no, "2.1.B");
});

test("章のアンカーが欠けた原稿(テンプレート)は警告なしで hp を付けない", () => {
  const template = `<h2 id="a">Chapter 1: Considering Directionality</h2>
<h2 id="b">1.1 Multicellularity (Professor Kohji Hotta, Keio University)</h2>
<h3>Objective</h3>
<p>text</p>
<h3>Key Takeaways</h3>
<p>text</p>
<h2 id="c">1.2 Synthetic Multicellular Systems (Professor Toda, Osaka University)</h2>`;
  assert.deepEqual(readHp(template), { hp: null });
  assert.deepEqual(readHp(""), { hp: null });
});

test("章のアンカーが1つ欠けても警告なしで hp を付けない", () => {
  const withoutCh4 = page({ chapter4: "" }).replace(
    /<h2 id="c4">[\s\S]*$/u,
    ""
  );
  assert.deepEqual(readHp(withoutCh4), { hp: null });
});

test("4章まで揃っていて中が崩れた原稿は警告を出して hp を付けない", () => {
  const cases = {
    "1章の面談が無い": page({ chapter1: "" }),
    "1章の面談の見出しに番号が無い": page({
      chapter1: interview("方向性（堀田先生）"),
    }),
    用途に面談が無い: page({
      chapter2: `<h2>2.1　スマート包帯</h2>\n<p>本文。</p>\n<h2>結論</h2>\n<p>結論。</p>`,
    }),
    "2章に用途が無い": page({ chapter2: "<p>本文だけ。</p>" }),
    用途より前に面談が来る: page({
      chapter2: interview("2.1.A　題（田島先生・北海道大学）"),
    }),
    別の用途の面談が混ざる: page({
      chapter2: `<h2>2.1　スマート包帯</h2>\n${interview("2.2.A　題（田島先生・北海道大学）")}`,
    }),
    読み取れない見出しが2章にある: page({
      chapter2: `${ch2}\n<h2>おまけ</h2>`,
    }),
    "0章の本文が無い": page().replace("<p>0章の本文。</p>", ""),
    "4章の本文が無い": page({ chapter4: `<h2>４章　Conclusion</h2>` }),
  };
  for (const [name, html] of Object.entries(cases)) {
    const result = readHp(html);
    assert.equal(result.hp, null, name);
    assert.equal(typeof result.warning, "string", name);
  }
});

test("章の見出しの順序が崩れた原稿は警告を出す", () => {
  const html = `<h2>1章　a</h2><p>x</p><h2>0章　b</h2><p>x</p><h2>2章　c</h2><p>x</p><h2>4章　d</h2><p>x</p>`;
  const result = readHp(html);
  assert.equal(result.hp, null);
  assert.equal(typeof result.warning, "string");
});

test("タグが閉じていない原稿は警告を出す", () => {
  const result = readHp(`${page()}<div>`);
  assert.equal(result.hp, null);
  assert.equal(typeof result.warning, "string");
});
