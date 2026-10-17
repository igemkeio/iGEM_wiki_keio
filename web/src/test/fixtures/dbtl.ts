import type { Dbtl, DbtlCycle, DbtlIteration } from "../../content";

// 2層6サイクル、反復数4/4/4/5/5/1。原稿の構造だけを写し、本文は短く書き直したもの。
// content/ja/e2e-dbtl.jsonのdbtlと同じ中身にする。
const TITLES: [string, string][] = [
  ["クローニング", "鋳型を取り除く"],
  ["観察系", "見えなければ主張できない"],
  ["画像解析", "目でなく数で判定する"],
  ["第二の極", "極を2つに分ける"],
  ["接着モジュール", "相手を選んで接着する"],
  ["極での架橋", "極でつなぐ"],
];
const COUNTS = [4, 4, 4, 5, 5, 1];

const iteration = (cycle: number, no: number): DbtlIteration => ({
  no,
  title: `サイクル${cycle}の反復${no}`,
  design: `反復${no}のDesign。`,
  build: `反復${no}のBuild。`,
  test: `反復${no}のTest。`,
  learn: `反復${no}のLearn。`,
  notesHtml:
    cycle === 2 && no === 1
      ? '<p>図1 観察の例。<strong>太字</strong>と<a href="https://static.igem.wiki/">リンク</a>を含む。</p>'
      : "",
});

const cycle = (no: number): DbtlCycle => ({
  no,
  layer: no <= 3 ? "base" : "design",
  title: TITLES[no - 1][0],
  tagline: TITLES[no - 1][1],
  whyHtml: `<p>サイクル${no}の導入。</p>`,
  hypothesis: `サイクル${no}の仮説。`,
  criteria: `サイクル${no}の成功基準。`,
  iterations: Array.from({ length: COUNTS[no - 1] }, (_, i) =>
    iteration(no, i + 1)
  ),
  outcomesHtml: `<ul><li>サイクル${no}で確立したこと。</li></ul>`,
  handoffHtml: `<em>サイクル${no}から次へ。</em>`,
  ...(no === 5
    ? {
        leadHtml:
          "<p><strong>✓ エンジニアリングの達成</strong>　設計したパーツが期待どおり機能した。</p>",
      }
    : {}),
});

export const dbtlFixture: Dbtl = {
  intro: '<h2 id="engineering">Engineering</h2>\n<p>このページの読み方。</p>',
  parts: [
    {
      label: "第 I 部",
      title: "道具をつくる",
      introHtml: "<p>基盤サイクルの導入。</p>",
      cycles: [1, 2, 3].map(cycle),
    },
    {
      label: "第 II 部",
      title: "道具で設計を試す",
      introHtml: "<p>設計サイクルの導入。</p>",
      cycles: [4, 5, 6].map(cycle),
    },
  ],
  outro: '<h2 id="outlook">展望</h2>\n<p>繰り返しの先に。</p>',
};
