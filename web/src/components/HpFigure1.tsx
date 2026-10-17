import styles from "./HpFigure.module.css";

// 図1。誰に聞き、プロジェクトのどこが変わったか。広い画面用と狭い画面用の2枚を出し、CSSで切り替える。
export function HpFigure1() {
  return (
    <figure className={styles.figure} id="hp-fig1">
      <div className={`${styles.sheet} ${styles.wide}`}>
        <svg
          className={styles.fig}
          viewBox="0 0 1200 840"
          // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- 文字を含む図はimgにできない
          role="img"
          aria-label="図1 誰に聞き、プロジェクトのどこが変わったか"
        >
          <text x="16" y="26" className={styles.ftitle}>
            図1　誰に聞き、どこが変わったか
          </text>
          <text x="1184" y="26" className={styles.fnote} textAnchor="end">
            位置と色だけで関係を示す。線で結ばない。
          </text>
          <text x="16" y="58" className={styles.sect}>
            1章　方向性を考える ─ 3つの用途すべてに効いた話
          </text>
          <rect
            x="16"
            y="68"
            width="1168"
            height="104"
            rx="10"
            fill="#e9ecf1"
          />
          <rect x="17" y="80" width="3" height="80" rx="1.5" fill="#5d646e" />
          <text
            x="32"
            y="98"
            className={styles.pname}
            style={{ fill: "#0d0f12" }}
          >
            堀田先生
          </text>
          <text x="32" y="114" className={styles.paff}>
            慶應
          </text>
          <text x="32" y="134" className={styles.ptake}>
            接着と極性が多細胞の形を決める
          </text>
          <rect
            x="250.6"
            y="80"
            width="3"
            height="80"
            rx="1.5"
            fill="#5d646e"
          />
          <text
            x="265.6"
            y="98"
            className={styles.pname}
            style={{ fill: "#0d0f12" }}
          >
            戸田先生
          </text>
          <text x="265.6" y="114" className={styles.paff}>
            阪大
          </text>
          <text x="265.6" y="134" className={styles.ptake}>
            空間制御は合成生物学の課題
          </text>
          <rect
            x="484.2"
            y="80"
            width="3"
            height="80"
            rx="1.5"
            fill="#5d646e"
          />
          <text
            x="499.2"
            y="98"
            className={styles.pname}
            style={{ fill: "#0d0f12" }}
          >
            Henrike先生
          </text>
          <text x="499.2" y="114" className={styles.paff}>
            TUM
          </text>
          <text x="499.2" y="134" className={styles.ptake}>
            接着のトポロジーを設計する価値
          </text>
          <rect
            x="717.8"
            y="80"
            width="3"
            height="80"
            rx="1.5"
            fill="#5d646e"
          />
          <text
            x="732.8"
            y="98"
            className={styles.pname}
            style={{ fill: "#0d0f12" }}
          >
            Ladoux先生（仮）
          </text>
          <text x="732.8" y="118" className={styles.ptake}>
            細胞の力と配向の関わり
          </text>
          <rect
            x="951.4"
            y="80"
            width="3"
            height="80"
            rx="1.5"
            fill="#5d646e"
          />
          <text
            x="966.4"
            y="98"
            className={styles.pname}
            style={{ fill: "#0d0f12" }}
          >
            竹内一将先生（仮）
          </text>
          <text x="966.4" y="118" className={styles.ptake}>
            細菌集団の秩序を物理で見る
          </text>
          <text x="16" y="208" className={styles.sect}>
            2章　3つの用途で、それぞれに聞く
          </text>
          <rect
            x="16"
            y="218"
            width="376"
            height="340"
            rx="10"
            fill="#ffffff"
            stroke="#d3381c"
            strokeOpacity=".25"
          />
          <rect x="16" y="218" width="376" height="54" rx="10" fill="#d3381c" />
          <rect x="16" y="254" width="376" height="18" rx="0" fill="#d3381c" />
          <text
            x="34"
            y="240"
            className={styles.ueyebrow}
            style={{ fill: "#fff" }}
          >
            2.1　創傷被覆・組織修復
          </text>
          <text
            x="34"
            y="262"
            className={styles.uname}
            style={{ fill: "#fff" }}
          >
            スマート包帯
          </text>
          <rect x="30" y="282" width="3" height="60" rx="1.5" fill="#d3381c" />
          <text
            x="44"
            y="300"
            className={styles.pname}
            style={{ fill: "#0d0f12" }}
          >
            田島先生
          </text>
          <text x="44" y="316" className={styles.paff}>
            北大
          </text>
          <text x="44" y="336" className={styles.take}>
            配向で強度は上がる。産生機構が壁
          </text>
          <rect x="30" y="356" width="3" height="60" rx="1.5" fill="#d3381c" />
          <text
            x="44"
            y="374"
            className={styles.pname}
            style={{ fill: "#0d0f12" }}
          >
            高山剛先生
          </text>
          <text x="44" y="390" className={styles.paff}>
            東大
          </text>
          <text x="44" y="410" className={styles.take}>
            酢酸菌へ展開するシード技術
          </text>
          <rect x="30" y="430" width="3" height="60" rx="1.5" fill="#d3381c" />
          <text
            x="44"
            y="448"
            className={styles.pname}
            style={{ fill: "#0d0f12" }}
          >
            磯貝明先生
          </text>
          <text x="44" y="464" className={styles.paff}>
            東大・2回（3/4、5/1）
          </text>
          <text x="44" y="484" className={styles.take}>
            コストが課題。固有の特性で勝負
          </text>
          <rect
            x="30"
            y="504"
            width="3"
            height="60"
            rx="1.5"
            fill="#d3381c"
            fillOpacity=".35"
          />
          <text
            x="44"
            y="522"
            className={styles.pname}
            style={{ fill: "#0d0f12" }}
          >
            富士フイルム 網中さん（予定）
          </text>
          <text x="44" y="538" className={styles.paff}>
            10月下旬に実施予定
          </text>
          <text x="44" y="558" className={styles.take}>
            未実施。量産と規格を聞く
          </text>
          <rect
            x="16"
            y="572"
            width="376"
            height="88"
            rx="10"
            fill="#d3381c"
            fillOpacity=".10"
          />
          <text
            x="34"
            y="596"
            className={styles.clabel}
            style={{ fill: "#d3381c" }}
          >
            聞いて変わったこと
          </text>
          <text x="34" y="620" className={styles.ctext}>
            大腸菌はモデル。本命は酢酸菌への展開
          </text>
          <rect
            x="412"
            y="218"
            width="376"
            height="340"
            rx="10"
            fill="#ffffff"
            stroke="#e0961e"
            strokeOpacity=".25"
          />
          <rect
            x="412"
            y="218"
            width="376"
            height="54"
            rx="10"
            fill="#e0961e"
          />
          <rect x="412" y="254" width="376" height="18" rx="0" fill="#e0961e" />
          <text
            x="430"
            y="240"
            className={styles.ueyebrow}
            style={{ fill: "#fff" }}
          >
            2.2　電気微生物の電子伝達
          </text>
          <text
            x="430"
            y="262"
            className={styles.uname}
            style={{ fill: "#fff" }}
          >
            バクテリアワイヤー
          </text>
          <rect x="426" y="282" width="3" height="60" rx="1.5" fill="#e0961e" />
          <text
            x="440"
            y="300"
            className={styles.pname}
            style={{ fill: "#0d0f12" }}
          >
            岡本章玄先生
          </text>
          <text x="440" y="316" className={styles.paff}>
            高分子・バイオ材料研究センター
          </text>
          <text x="440" y="336" className={styles.take}>
            電子の流れを空間で設計できる
          </text>
          <rect x="426" y="356" width="3" height="60" rx="1.5" fill="#e0961e" />
          <text
            x="440"
            y="374"
            className={styles.pname}
            style={{ fill: "#0d0f12" }}
          >
            Bentley先生（仮）
          </text>
          <text x="440" y="394" className={styles.take}>
            細胞間の電気化学的な通信
          </text>
          <rect
            x="412"
            y="572"
            width="376"
            height="88"
            rx="10"
            fill="#e0961e"
            fillOpacity=".10"
          />
          <text
            x="430"
            y="596"
            className={styles.clabel}
            style={{ fill: "#e0961e" }}
          >
            聞いて変わったこと
          </text>
          <text x="430" y="620" className={styles.ctext}>
            接着に加え、電子の向きも設計の対象に
          </text>
          <rect
            x="808"
            y="218"
            width="376"
            height="340"
            rx="10"
            fill="#ffffff"
            stroke="#1e50a2"
            strokeOpacity=".25"
          />
          <rect
            x="808"
            y="218"
            width="376"
            height="54"
            rx="10"
            fill="#1e50a2"
          />
          <rect x="808" y="254" width="376" height="18" rx="0" fill="#1e50a2" />
          <text
            x="826"
            y="240"
            className={styles.ueyebrow}
            style={{ fill: "#fff" }}
          >
            2.3　多段の代謝反応
          </text>
          <text
            x="826"
            y="262"
            className={styles.uname}
            style={{ fill: "#fff" }}
          >
            カスケード酵素流路
          </text>
          <rect x="822" y="282" width="3" height="60" rx="1.5" fill="#1e50a2" />
          <text
            x="836"
            y="300"
            className={styles.pname}
            style={{ fill: "#0d0f12" }}
          >
            加藤創一郎先生
          </text>
          <text x="836" y="316" className={styles.paff}>
            東大
          </text>
          <text x="836" y="336" className={styles.take}>
            並べるだけでは効かない。中身を問う
          </text>
          <rect x="822" y="356" width="3" height="60" rx="1.5" fill="#1e50a2" />
          <text
            x="836"
            y="374"
            className={styles.pname}
            style={{ fill: "#0d0f12" }}
          >
            本田孝祐先生
          </text>
          <text x="836" y="390" className={styles.paff}>
            阪大
          </text>
          <text x="836" y="410" className={styles.take}>
            拡散が律速なら近接が効く
          </text>
          <rect x="822" y="430" width="3" height="60" rx="1.5" fill="#1e50a2" />
          <text
            x="836"
            y="448"
            className={styles.pname}
            style={{ fill: "#0d0f12" }}
          >
            宮本先生
          </text>
          <text x="836" y="464" className={styles.paff}>
            慶應
          </text>
          <text x="836" y="484" className={styles.take}>
            シート状配置とフローで産業化
          </text>
          <rect
            x="808"
            y="572"
            width="376"
            height="88"
            rx="10"
            fill="#1e50a2"
            fillOpacity=".10"
          />
          <text
            x="826"
            y="596"
            className={styles.clabel}
            style={{ fill: "#1e50a2" }}
          >
            聞いて変わったこと
          </text>
          <text x="826" y="620" className={styles.ctext}>
            一列から、シート状を含む空間配置へ
          </text>
          <text x="16" y="700" className={styles.sect}>
            4章　限界と今後 ─ 3つの用途に共通してのしかかる
          </text>
          <rect
            x="16"
            y="710"
            width="1168"
            height="104"
            rx="10"
            fill="#1f1a6b"
          />
          <text
            x="36"
            y="740"
            className={styles.l4head}
            style={{ fill: "#fff" }}
          >
            4.1 技術の価値と限界
          </text>
          <text
            x="36"
            y="764"
            className={styles.l4body}
            style={{ fill: "#fff" }}
          >
            並べる難しさと、並べる価値は別物
          </text>
          <text
            x="328"
            y="740"
            className={styles.l4head}
            style={{ fill: "#fff" }}
          >
            4.2.A 強度（川上先生）
          </text>
          <text
            x="328"
            y="764"
            className={styles.l4body}
            style={{ fill: "#fff" }}
          >
            結合強度と可逆性も設計パラメータ
          </text>
          <text
            x="620"
            y="740"
            className={styles.l4head}
            style={{ fill: "#fff" }}
          >
            4.2.B 技術の展開（片岡先生）
          </text>
          <text
            x="620"
            y="764"
            className={styles.l4body}
            style={{ fill: "#fff" }}
          >
            応用分野への橋渡し（仮）
          </text>
          <text
            x="912"
            y="740"
            className={styles.l4head}
            style={{ fill: "#fff" }}
          >
            4.2.C 分裂
          </text>
          <text
            x="912"
            y="764"
            className={styles.l4body}
            style={{ fill: "#fff" }}
          >
            分裂で一直線の構造が崩れる（仮）
          </text>
        </svg>
      </div>
      <div className={`${styles.sheet} ${styles.narrow}`}>
        <svg
          className={styles.fig}
          viewBox="0 0 390 1438"
          // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- 文字を含む図はimgにできない
          role="img"
          aria-label="図1 誰に聞き、プロジェクトのどこが変わったか"
        >
          <text x="12" y="24" className={styles.ftitle}>
            図1　誰に聞き、どこが変わったか
          </text>
          <text x="12" y="40" className={styles.fnote}>
            位置と色だけで関係を示す
          </text>
          <text x="12" y="70" className={styles.sect}>
            1章　方向性を考える
          </text>
          <text x="12" y="85" className={styles.fnote}>
            3つの用途すべてに効いた話
          </text>
          <rect x="12" y="96" width="366" height="241" rx="10" fill="#e9ecf1" />
          <text
            x="26"
            y="116"
            className={styles.pname}
            style={{ fill: "#0d0f12" }}
          >
            堀田先生　慶應
          </text>
          <text x="26" y="133" className={styles.take}>
            接着と極性が多細胞の形を決める
          </text>
          <text
            x="26"
            y="161"
            className={styles.pname}
            style={{ fill: "#0d0f12" }}
          >
            戸田先生　阪大
          </text>
          <text x="26" y="178" className={styles.take}>
            空間制御は合成生物学の課題
          </text>
          <text
            x="26"
            y="206"
            className={styles.pname}
            style={{ fill: "#0d0f12" }}
          >
            Henrike先生　TUM
          </text>
          <text x="26" y="223" className={styles.take}>
            接着のトポロジーを設計する価値
          </text>
          <text
            x="26"
            y="251"
            className={styles.pname}
            style={{ fill: "#0d0f12" }}
          >
            Ladoux先生（仮）
          </text>
          <text x="26" y="268" className={styles.take}>
            細胞の力と配向の関わり
          </text>
          <text
            x="26"
            y="296"
            className={styles.pname}
            style={{ fill: "#0d0f12" }}
          >
            竹内一将先生（仮）
          </text>
          <text x="26" y="313" className={styles.take}>
            細菌集団の秩序を物理で見る
          </text>
          <text x="12" y="355" className={styles.sect}>
            2章　3つの用途で、それぞれに聞く
          </text>
          <rect x="12" y="367" width="366" height="48" rx="10" fill="#d3381c" />
          <rect x="12" y="399" width="366" height="16" rx="0" fill="#d3381c" />
          <text
            x="26"
            y="387"
            className={styles.ueyebrow}
            style={{ fill: "#fff" }}
          >
            2.1　創傷被覆・組織修復
          </text>
          <text
            x="26"
            y="408"
            className={styles.uname}
            style={{ fill: "#fff" }}
          >
            スマート包帯
          </text>
          <rect
            x="12"
            y="415"
            width="366"
            height="200"
            rx="0"
            fill="#fff"
            stroke="#d3381c"
            strokeOpacity=".25"
          />
          <text
            x="28"
            y="435"
            className={styles.pname}
            style={{ fill: "#0d0f12" }}
          >
            田島先生　北大
          </text>
          <text x="28" y="453" className={styles.take}>
            配向で強度は上がる。産生機構が壁
          </text>
          <rect x="19" y="424" width="3" height="28" rx="1.5" fill="#d3381c" />
          <text
            x="28"
            y="481"
            className={styles.pname}
            style={{ fill: "#0d0f12" }}
          >
            高山剛先生　東大
          </text>
          <text x="28" y="499" className={styles.take}>
            酢酸菌へ展開するシード技術
          </text>
          <rect x="19" y="470" width="3" height="28" rx="1.5" fill="#d3381c" />
          <text
            x="28"
            y="527"
            className={styles.pname}
            style={{ fill: "#0d0f12" }}
          >
            磯貝明先生　東大・2回（3/4、5/1）
          </text>
          <text x="28" y="545" className={styles.take}>
            コストが課題。固有の特性で勝負
          </text>
          <rect x="19" y="516" width="3" height="28" rx="1.5" fill="#d3381c" />
          <text
            x="28"
            y="573"
            className={styles.pname}
            style={{ fill: "#0d0f12" }}
          >
            富士フイルム 網中さん（予定）　10月下旬に実施予定
          </text>
          <text x="28" y="591" className={styles.take}>
            未実施。量産と規格を聞く
          </text>
          <rect
            x="19"
            y="562"
            width="3"
            height="28"
            rx="1.5"
            fill="#d3381c"
            fillOpacity=".35"
          />
          <rect
            x="12"
            y="621"
            width="366"
            height="47"
            rx="8"
            fill="#d3381c"
            fillOpacity=".10"
          />
          <text
            x="28"
            y="641"
            className={styles.clabel}
            style={{ fill: "#d3381c" }}
          >
            聞いて変わったこと
          </text>
          <text x="28" y="661" className={styles.ctext}>
            大腸菌はモデル。本命は酢酸菌への展開
          </text>
          <rect x="12" y="686" width="366" height="48" rx="10" fill="#e0961e" />
          <rect x="12" y="718" width="366" height="16" rx="0" fill="#e0961e" />
          <text
            x="26"
            y="706"
            className={styles.ueyebrow}
            style={{ fill: "#fff" }}
          >
            2.2　電気微生物の電子伝達
          </text>
          <text
            x="26"
            y="727"
            className={styles.uname}
            style={{ fill: "#fff" }}
          >
            バクテリアワイヤー
          </text>
          <rect
            x="12"
            y="734"
            width="366"
            height="108"
            rx="0"
            fill="#fff"
            stroke="#e0961e"
            strokeOpacity=".25"
          />
          <text
            x="28"
            y="754"
            className={styles.pname}
            style={{ fill: "#0d0f12" }}
          >
            岡本章玄先生　高分子・バイオ材料研究センター
          </text>
          <text x="28" y="772" className={styles.take}>
            電子の流れを空間で設計できる
          </text>
          <rect x="19" y="743" width="3" height="28" rx="1.5" fill="#e0961e" />
          <text
            x="28"
            y="800"
            className={styles.pname}
            style={{ fill: "#0d0f12" }}
          >
            Bentley先生（仮）
          </text>
          <text x="28" y="818" className={styles.take}>
            細胞間の電気化学的な通信
          </text>
          <rect x="19" y="789" width="3" height="28" rx="1.5" fill="#e0961e" />
          <rect
            x="12"
            y="848"
            width="366"
            height="47"
            rx="8"
            fill="#e0961e"
            fillOpacity=".10"
          />
          <text
            x="28"
            y="868"
            className={styles.clabel}
            style={{ fill: "#e0961e" }}
          >
            聞いて変わったこと
          </text>
          <text x="28" y="888" className={styles.ctext}>
            接着に加え、電子の向きも設計の対象に
          </text>
          <rect x="12" y="913" width="366" height="48" rx="10" fill="#1e50a2" />
          <rect x="12" y="945" width="366" height="16" rx="0" fill="#1e50a2" />
          <text
            x="26"
            y="933"
            className={styles.ueyebrow}
            style={{ fill: "#fff" }}
          >
            2.3　多段の代謝反応
          </text>
          <text
            x="26"
            y="954"
            className={styles.uname}
            style={{ fill: "#fff" }}
          >
            カスケード酵素流路
          </text>
          <rect
            x="12"
            y="961"
            width="366"
            height="154"
            rx="0"
            fill="#fff"
            stroke="#1e50a2"
            strokeOpacity=".25"
          />
          <text
            x="28"
            y="981"
            className={styles.pname}
            style={{ fill: "#0d0f12" }}
          >
            加藤創一郎先生　東大
          </text>
          <text x="28" y="999" className={styles.take}>
            並べるだけでは効かない。中身を問う
          </text>
          <rect x="19" y="970" width="3" height="28" rx="1.5" fill="#1e50a2" />
          <text
            x="28"
            y="1027"
            className={styles.pname}
            style={{ fill: "#0d0f12" }}
          >
            本田孝祐先生　阪大
          </text>
          <text x="28" y="1045" className={styles.take}>
            拡散が律速なら近接が効く
          </text>
          <rect x="19" y="1016" width="3" height="28" rx="1.5" fill="#1e50a2" />
          <text
            x="28"
            y="1073"
            className={styles.pname}
            style={{ fill: "#0d0f12" }}
          >
            宮本先生　慶應
          </text>
          <text x="28" y="1091" className={styles.take}>
            シート状配置とフローで産業化
          </text>
          <rect x="19" y="1062" width="3" height="28" rx="1.5" fill="#1e50a2" />
          <rect
            x="12"
            y="1121"
            width="366"
            height="47"
            rx="8"
            fill="#1e50a2"
            fillOpacity=".10"
          />
          <text
            x="28"
            y="1141"
            className={styles.clabel}
            style={{ fill: "#1e50a2" }}
          >
            聞いて変わったこと
          </text>
          <text x="28" y="1161" className={styles.ctext}>
            一列から、シート状を含む空間配置へ
          </text>
          <text x="12" y="1200" className={styles.sect}>
            4章　限界と今後
          </text>
          <text x="12" y="1215" className={styles.fnote}>
            3つの用途に共通してのしかかる
          </text>
          <rect
            x="12"
            y="1224"
            width="366"
            height="200"
            rx="10"
            fill="#1f1a6b"
          />
          <text
            x="28"
            y="1246"
            className={styles.l4head}
            style={{ fill: "#fff" }}
          >
            4.1 技術の価値と限界
          </text>
          <text
            x="28"
            y="1264"
            className={styles.l4body}
            style={{ fill: "#fff" }}
          >
            並べる難しさと、並べる価値は別物
          </text>
          <text
            x="28"
            y="1292"
            className={styles.l4head}
            style={{ fill: "#fff" }}
          >
            4.2.A 強度（川上先生）
          </text>
          <text
            x="28"
            y="1310"
            className={styles.l4body}
            style={{ fill: "#fff" }}
          >
            結合強度と可逆性も設計パラメータ
          </text>
          <text
            x="28"
            y="1338"
            className={styles.l4head}
            style={{ fill: "#fff" }}
          >
            4.2.B 技術の展開（片岡先生）
          </text>
          <text
            x="28"
            y="1356"
            className={styles.l4body}
            style={{ fill: "#fff" }}
          >
            応用分野への橋渡し（仮）
          </text>
          <text
            x="28"
            y="1384"
            className={styles.l4head}
            style={{ fill: "#fff" }}
          >
            4.2.C 分裂
          </text>
          <text
            x="28"
            y="1402"
            className={styles.l4body}
            style={{ fill: "#fff" }}
          >
            分裂で一直線の構造が崩れる（仮）
          </text>
        </svg>
      </div>
    </figure>
  );
}
