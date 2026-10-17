import styles from "./HpFigure.module.css";

// 図2。聞く・作る・決めるの時間軸。狭い画面では横にスクロールする。
export function HpFigure2() {
  return (
    <figure className={styles.figure} id="hp-fig2">
      <div className={`${styles.sheet} ${styles.scroller}`}>
        <svg
          className={styles.fig}
          viewBox="0 0 1360 842"
          // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- 文字を含む図はimgにできない
          role="img"
          aria-label="図2 聞く・作る・決めるの時間軸"
        >
          <text x="16" y="26" className={styles.ftitle}>
            図2　聞く・作る・決める
          </text>
          <text x="1344" y="26" className={styles.fnote} textAnchor="end">
            同じ横位置に並ぶものが同じ時期。線で結ばない。
          </text>
          <circle cx="22" cy="50" r="5.5" fill="#d3381c" />
          <text x="34" y="54" className={styles.lg}>
            スマート包帯
          </text>
          <circle cx="137" cy="50" r="5.5" fill="#e0961e" />
          <text x="149" y="54" className={styles.lg}>
            バクテリアワイヤー
          </text>
          <circle cx="289.5" cy="50" r="5.5" fill="#1e50a2" />
          <text x="301.5" y="54" className={styles.lg}>
            カスケード酵素流路
          </text>
          <circle cx="442" cy="50" r="5.5" fill="#5d646e" />
          <text x="454" y="54" className={styles.lg}>
            1章・方向性ほか
          </text>
          <circle cx="576" cy="50" r="5.5" fill="#1f1a6b" />
          <text x="588" y="54" className={styles.lg}>
            4章・限界
          </text>
          <circle cx="22" cy="74" r="5.5" fill="#5d646e" />
          <text x="34" y="78" className={styles.lg}>
            対面・Zoom
          </text>
          <circle
            cx="125.5"
            cy="74"
            r="5.5"
            fill="#fff"
            stroke="#5d646e"
            strokeWidth="2.2"
          />
          <text x="137.5" y="78" className={styles.lg}>
            メール回答
          </text>
          <rect
            x="223"
            y="69"
            width="10"
            height="10"
            fill="#fff"
            stroke="#5d646e"
            strokeWidth="2"
            strokeDasharray="3 2"
          />
          <text x="240" y="78" className={styles.lg}>
            実施予定
          </text>
          <line className={styles.grid} x1="56" y1="118" x2="56" y2="814" />
          <line
            className={styles.grid}
            x1="145.918"
            y1="118"
            x2="145.918"
            y2="814"
          />
          <line
            className={styles.grid}
            x1="238.833"
            y1="118"
            x2="238.833"
            y2="814"
          />
          <line
            className={styles.grid}
            x1="331.748"
            y1="118"
            x2="331.748"
            y2="814"
          />
          <line
            className={styles.grid}
            x1="415.671"
            y1="118"
            x2="415.671"
            y2="814"
          />
          <line
            className={styles.grid}
            x1="508.586"
            y1="118"
            x2="508.586"
            y2="814"
          />
          <line
            className={styles.grid}
            x1="598.504"
            y1="118"
            x2="598.504"
            y2="814"
          />
          <line
            className={styles.grid}
            x1="691.419"
            y1="118"
            x2="691.419"
            y2="814"
          />
          <line
            className={styles.grid}
            x1="781.337"
            y1="118"
            x2="781.337"
            y2="814"
          />
          <line
            className={styles.grid}
            x1="874.252"
            y1="118"
            x2="874.252"
            y2="814"
          />
          <line
            className={styles.grid}
            x1="967.167"
            y1="118"
            x2="967.167"
            y2="814"
          />
          <line
            className={styles.grid}
            x1="1057.08"
            y1="118"
            x2="1057.08"
            y2="814"
          />
          <line className={styles.grid} x1="1150" y1="118" x2="1150" y2="814" />
          <text x="100.959" y="112" className={styles.mon} textAnchor="middle">
            11月
          </text>
          <text x="192.375" y="112" className={styles.mon} textAnchor="middle">
            12月
          </text>
          <text x="285.29" y="112" className={styles.mon} textAnchor="middle">
            1月
          </text>
          <text x="373.71" y="112" className={styles.mon} textAnchor="middle">
            2月
          </text>
          <text x="462.129" y="112" className={styles.mon} textAnchor="middle">
            3月
          </text>
          <text x="553.545" y="112" className={styles.mon} textAnchor="middle">
            4月
          </text>
          <text x="644.962" y="112" className={styles.mon} textAnchor="middle">
            5月
          </text>
          <text x="736.378" y="112" className={styles.mon} textAnchor="middle">
            6月
          </text>
          <text x="827.795" y="112" className={styles.mon} textAnchor="middle">
            7月
          </text>
          <text x="920.71" y="112" className={styles.mon} textAnchor="middle">
            8月
          </text>
          <text x="1012.13" y="112" className={styles.mon} textAnchor="middle">
            9月
          </text>
          <text x="1103.54" y="112" className={styles.mon} textAnchor="middle">
            10月
          </text>
          <text x="60" y="96" className={styles.yr}>
            2025年
          </text>
          <text x="242.833" y="96" className={styles.yr}>
            2026年
          </text>
          <line className={styles.lane} x1="16" y1="142" x2="1150" y2="142" />
          <text x="16" y="134" className={styles.lane}>
            聞く
          </text>
          <text x="94" y="134" className={styles.fnote}>
            面談。色が用途、形が聞き方
          </text>
          <circle cx="214.855" cy="166" r="5.5" fill="#5d646e" />
          <text x="226.855" y="170" className={styles.dot}>
            12/24 日本製鉄
          </text>
          <circle cx="421.666" cy="166" r="5.5" fill="#d3381c" />
          <text x="433.666" y="170" className={styles.dot}>
            3/3 田島
          </text>
          <circle cx="424.663" cy="188" r="5.5" fill="#d3381c" />
          <text x="436.663" y="192" className={styles.dot}>
            3/4 磯貝①
          </text>
          <circle cx="511.584" cy="166" r="5.5" fill="#5d646e" />
          <text x="523.584" y="170" className={styles.dot}>
            4/2 見上
          </text>
          <circle cx="598.504" cy="166" r="5.5" fill="#d3381c" />
          <text x="610.504" y="170" className={styles.dot}>
            5/1 磯貝②
          </text>
          <circle cx="655.452" cy="188" r="5.5" fill="#5d646e" />
          <text x="667.452" y="192" className={styles.dot}>
            5/20 細田
          </text>
          <circle cx="721.392" cy="166" r="5.5" fill="#5d646e" />
          <text x="733.392" y="170" className={styles.dot}>
            6/11 山本
          </text>
          <circle cx="865.26" cy="166" r="5.5" fill="#5d646e" />
          <text x="877.26" y="170" className={styles.dot}>
            7/29 Dirk
          </text>
          <circle cx="871.255" cy="188" r="5.5" fill="#d3381c" />
          <text x="883.255" y="192" className={styles.dot}>
            7/31 高山
          </text>
          <circle cx="895.233" cy="210" r="5.5" fill="#1e50a2" />
          <text x="907.233" y="214" className={styles.dot}>
            8/8 山形
          </text>
          <circle cx="925.205" cy="232" r="5.5" fill="#5d646e" />
          <text x="937.205" y="236" className={styles.dot}>
            8/18 見上
          </text>
          <circle cx="1009.13" cy="166" r="5.5" fill="#5d646e" />
          <text x="1021.13" y="170" className={styles.dot}>
            9/15 堀田
          </text>
          <circle cx="1018.12" cy="188" r="5.5" fill="#5d646e" />
          <text x="1030.12" y="192" className={styles.dot}>
            9/18 戸田
          </text>
          <circle cx="1018.12" cy="210" r="5.5" fill="#e0961e" />
          <text x="1030.12" y="214" className={styles.dot}>
            9/18 岡本
          </text>
          <circle
            cx="1051.09"
            cy="232"
            r="5.5"
            fill="#fff"
            stroke="#1e50a2"
            strokeWidth="2.2"
          />
          <text x="1063.09" y="236" className={styles.dot}>
            9/29 本田
          </text>
          <circle
            cx="1051.09"
            cy="254"
            r="5.5"
            fill="#fff"
            stroke="#e0961e"
            strokeWidth="2.2"
          />
          <text x="1063.09" y="258" className={styles.dot}>
            9/29 Bentley
          </text>
          <circle cx="1060.08" cy="276" r="5.5" fill="#5d646e" />
          <text x="1072.08" y="280" className={styles.dot}>
            10/2 見上
          </text>
          <circle cx="1072.07" cy="298" r="5.5" fill="#1e50a2" />
          <text x="1084.07" y="302" className={styles.dot}>
            10/6 宮本
          </text>
          <circle cx="1075.07" cy="320" r="5.5" fill="#1f1a6b" />
          <text x="1087.07" y="324" className={styles.dot}>
            10/7 川上
          </text>
          <circle
            cx="1081.06"
            cy="342"
            r="5.5"
            fill="#fff"
            stroke="#5d646e"
            strokeWidth="2.2"
          />
          <text x="1093.06" y="346" className={styles.dot}>
            10/9 Henrike
          </text>
          <circle
            cx="1081.06"
            cy="364"
            r="5.5"
            fill="#fff"
            stroke="#1e50a2"
            strokeWidth="2.2"
          />
          <text x="1093.06" y="368" className={styles.dot}>
            10/9 加藤
          </text>
          <circle cx="1093.05" cy="386" r="5.5" fill="#1f1a6b" />
          <text x="1105.05" y="390" className={styles.dot}>
            10/13 片岡
          </text>
          <circle cx="1099.05" cy="408" r="5.5" fill="#5d646e" />
          <text x="1111.05" y="412" className={styles.dot}>
            10/15 Ladoux
          </text>
          <circle cx="1099.05" cy="430" r="5.5" fill="#5d646e" />
          <text x="1111.05" y="434" className={styles.dot}>
            10/15 竹内
          </text>
          <rect
            x="1112.03"
            y="161"
            width="10"
            height="10"
            fill="#fff"
            stroke="#d3381c"
            strokeWidth="2"
            strokeDasharray="3 2"
          />
          <text x="1129.03" y="170" className={styles.dot}>
            10/21 富士フイルム（予定）
          </text>
          <line className={styles.lane} x1="16" y1="464" x2="1150" y2="464" />
          <text x="16" y="456" className={styles.lane}>
            作る
          </text>
          <text x="94" y="456" className={styles.fnote}>
            Engineeringの6サイクル
          </text>
          <rect
            x="589.512"
            y="479"
            width="374.658"
            height="18"
            rx="4"
            fill="#0d0f12"
            fillOpacity=".12"
          />
          <text x="598.512" y="492" className={styles.band}>
            ① クローニング技術
          </text>
          <rect
            x="880.247"
            y="505"
            width="74.9315"
            height="18"
            rx="4"
            fill="#0d0f12"
            fillOpacity=".12"
          />
          <text x="964.178" y="518" className={styles.band}>
            ② 極局在の観察系
          </text>
          <rect
            x="949.184"
            y="531"
            width="174.816"
            height="18"
            rx="4"
            fill="#0d0f12"
            fillOpacity=".12"
          />
          <line className={styles.open} x1="1124" y1="540" x2="1140" y2="540" />
          <polygon
            points="1140,535 1150,540 1140,545"
            fill="#0d0f12"
            fillOpacity=".45"
          />
          <text x="958.184" y="544" className={styles.band}>
            ③ 画像解析による定量
          </text>
          <rect
            x="871.255"
            y="557"
            width="224.795"
            height="18"
            rx="4"
            fill="#0d0f12"
            fillOpacity=".12"
          />
          <text x="880.255" y="570" className={styles.band}>
            ④ 第二の極の定義
          </text>
          <rect
            x="844.279"
            y="583"
            width="242.778"
            height="18"
            rx="4"
            fill="#0d0f12"
            fillOpacity=".12"
          />
          <text x="853.279" y="596" className={styles.band}>
            ⑤ 接着モジュール
          </text>
          <rect
            x="901.227"
            y="609"
            width="222.773"
            height="18"
            rx="4"
            fill="#0d0f12"
            fillOpacity=".12"
          />
          <line className={styles.open} x1="1124" y1="618" x2="1140" y2="618" />
          <polygon
            points="1140,613 1150,618 1140,623"
            fill="#0d0f12"
            fillOpacity=".45"
          />
          <text x="910.227" y="622" className={styles.band}>
            ⑥ 極での架橋
          </text>
          <line className={styles.lane} x1="16" y1="644" x2="1150" y2="644" />
          <text x="16" y="636" className={styles.lane}>
            決める
          </text>
          <text x="94" y="636" className={styles.fnote}>
            設計が変わった点
          </text>
          <path
            d="M97.9616,662 L105.962,670 L97.9616,678 L89.9616,670 Z"
            fill="#5d646e"
          />
          <text x="111.962" y="674" className={styles.dec}>
            旧案を捨て、細胞極性と直鎖連結へ
          </text>
          <path
            d="M214.855,688 L222.855,696 L214.855,704 L206.855,696 Z"
            fill="#5d646e"
          />
          <text x="228.855" y="700" className={styles.dec}>
            工業バイオ生産・排水処理の応用を取り下げ
          </text>
          <path
            d="M763.353,662 L771.353,670 L763.353,678 L755.353,670 Z"
            fill="#5d646e"
          />
          <text x="777.353" y="674" className={styles.dec}>
            プロジェクト名を One Direction に
          </text>
          <rect
            x="931.2"
            y="692"
            width="32.9699"
            height="8"
            rx="4"
            fill="#5d646e"
          />
          <text x="976.17" y="700" className={styles.dec}>
            基盤技術として位置づける（月まで）
          </text>
          <path
            d="M994.142,714 L1002.14,722 L994.142,730 L986.142,722 Z"
            fill="#e0961e"
          />
          <text x="1008.14" y="726" className={styles.dec}>
            電子の向きを設計対象に（採用日は不明）
          </text>
          <path
            d="M1000.14,740 L1008.14,748 L1000.14,756 L992.137,748 Z"
            fill="#d3381c"
          />
          <text x="1014.14" y="752" className={styles.dec}>
            酢酸菌への展開を本命に
          </text>
          <path
            d="M1009.13,766 L1017.13,774 L1009.13,782 L1001.13,774 Z"
            fill="#1e50a2"
          />
          <text x="1023.13" y="778" className={styles.dec}>
            共培養を捨て、カスケード酵素流路へ
          </text>
          <rect
            x="1024.12"
            y="666"
            width="29.9726"
            height="8"
            rx="4"
            fill="#5d646e"
          />
          <text x="1066.09" y="674" className={styles.dec}>
            大腸菌に限定しない方針へ（月まで）
          </text>
          <path
            d="M1072.07,792 L1080.07,800 L1072.07,808 L1064.07,800 Z"
            fill="#1e50a2"
          />
          <text x="1086.07" y="804" className={styles.dec}>
            一列から空間配置へ広げる
          </text>
          <text x="16" y="832" className={styles.fnote}>
            出典:
            Notionの議事録（日付プロパティ）とDiscordの投稿。サイクルの期間は投稿の分布からの推定で、開始・終了の宣言は記録に残っていない。
          </text>
        </svg>
      </div>
      <p className={styles.hint}>← 横にスクロールする →</p>
    </figure>
  );
}
