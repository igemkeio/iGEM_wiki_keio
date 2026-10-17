import type { Hp, HpInterview } from "../../content";

const interview = (
  no: string,
  extra: Partial<HpInterview> = {}
): HpInterview => ({
  no,
  title: `面談${no}の題`,
  person: `人物${no}先生`,
  affiliation: "所属大学",
  purposeHtml: `<p>目的${no}。</p>`,
  takeHomeHtml: `<p>持ち帰り${no}。</p>`,
  detailHtml: `<p>詳細${no}。</p>`,
  ...extra,
});

export const hpFixture: Hp = {
  intro: "<h2>概要</h2><p>導入の本文。</p>",
  chapter0: { title: "道のり", html: "<p>謝辞の本文。</p>" },
  chapter1: {
    title: "方向性を考える",
    introHtml: "<p>1章の導入。</p>",
    interviews: [
      interview("1.1"),
      interview("1.5", { title: "XXX", draft: true }),
    ],
  },
  chapter2: {
    title: "社会的な側面",
    introHtml: "<p>2章の導入。</p>",
    uses: [
      {
        no: "2.1",
        title: "スマート包帯",
        subtitle: "創傷被覆",
        introHtml: "<p>用途の導入。</p>",
        interviews: [interview("2.1.A"), interview("2.1.D")],
        conclusionHtml: "<p>結論の本文。</p>",
      },
      {
        no: "2.2",
        title: "バクテリアワイヤー",
        subtitle: "",
        introHtml: "<p>用途の導入。</p>",
        interviews: [
          interview("2.2.B", {
            title: "XXX",
            purposeHtml: "",
            takeHomeHtml: "",
            draft: true,
          }),
        ],
        conclusionHtml: "<p>XXX</p>",
      },
    ],
  },
  chapter4: {
    title: "限界と今後",
    html: '<h2 id="a">4.1　価値と限界</h2><p>4.1の本文。</p><h2 id="b">4.2　課題</h2><p>4.2の導入。</p><h3 id="c">4.2.A　強度</h3><p>強度の本文。</p><h3 id="d">4.2.B　展開（片岡先生）</h3>',
  },
};
