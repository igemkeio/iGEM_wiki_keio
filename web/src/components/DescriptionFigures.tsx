import styles from "./DescriptionPage.module.css";

// 分解図の素。見出しは持たず、描画だけを置く。ほかの図が<use>で引く。
export function DescriptionDefs() {
  return (
    <svg width="0" height="0" aria-hidden="true" className={styles.defs}>
      <defs>
        <g id="desc-cross">
          <rect
            className={styles.om}
            x="200"
            y="210"
            width="480"
            height="220"
            rx="110"
          />
          <rect
            className={styles.im}
            x="222"
            y="232"
            width="436"
            height="176"
            rx="88"
          />
          <g className={styles.popz}>
            <circle cx="300" cy="320" r="11" />
            <circle cx="320" cy="306" r="10" />
            <circle cx="280" cy="303" r="10" />
            <circle cx="305" cy="290" r="8" />
            <circle cx="276" cy="333" r="10" />
            <circle cx="322" cy="338" r="10" />
            <circle cx="292" cy="348" r="8" />
            <circle cx="310" cy="356" r="7" />
            <circle cx="262" cy="318" r="8" />
            <circle cx="290" cy="276" r="7" />
            <circle cx="336" cy="322" r="7" />
            <circle cx="265" cy="345" r="6" />
            <circle cx="315" cy="320" r="9" />
          </g>
          <g className={styles.diviva} strokeWidth="8">
            <path d="M597.4,244.8 A80,80 0 0 1 597.4,395.2" />
            <path d="M609.4,269.6 A64,64 0 0 1 609.4,370.4" />
            <path d="M610.7,294.6 A48,48 0 0 1 610.7,345.4" />
          </g>
          <g transform="translate(310,320) rotate(150)">
            <line
              className={styles.coilE}
              x1="88"
              y1="-6"
              x2="110"
              y2="-6"
              strokeWidth="5"
            />
            <line
              className={styles.coilR}
              x1="88"
              y1="6"
              x2="110"
              y2="6"
              strokeWidth="5"
            />
            <path className={styles.stalkL} d="M110,6 L122,2 L158,0" />
            <circle className={styles.ag} cx="172" cy="0" r="13" />
          </g>
          <g transform="translate(310,320) rotate(210)">
            <line
              className={styles.coilE}
              x1="88"
              y1="-6"
              x2="110"
              y2="-6"
              strokeWidth="5"
            />
            <line
              className={styles.coilR}
              x1="88"
              y1="6"
              x2="110"
              y2="6"
              strokeWidth="5"
            />
            <path className={styles.stalkL} d="M110,6 L122,2 L158,0" />
            <circle className={styles.ag} cx="172" cy="0" r="13" />
          </g>
          <g transform="translate(570,320) rotate(-15)">
            <path className={styles.stalkR} d="M100,0 L152,0" />
            <path
              className={styles.nb}
              d="M182.2,14.56 A19,19 0 1 1 182.2,-14.56"
            />
          </g>
          <g transform="translate(570,320) rotate(15)">
            <path className={styles.stalkR} d="M100,0 L152,0" />
            <path
              className={styles.nb}
              d="M182.2,14.56 A19,19 0 1 1 182.2,-14.56"
            />
          </g>
        </g>

        <g id="desc-unit">
          <rect
            className={styles.body2}
            x="0"
            y="86"
            width="250"
            height="110"
            rx="55"
          />
          <circle className={styles.popz} cx="52" cy="141" r="22" />
          <circle
            className={styles.diviva}
            cx="198"
            cy="141"
            r="22"
            strokeWidth="8"
          />
          <path className={styles.stalkL} d="M0,141 L-40,141" />
          <line
            className={styles.coilE}
            x1="-12"
            y1="131"
            x2="18"
            y2="131"
            strokeWidth="5"
          />
          <line
            className={styles.coilR}
            x1="-12"
            y1="151"
            x2="18"
            y2="151"
            strokeWidth="5"
          />
          <circle className={styles.ag} cx="-54" cy="141" r="10" />
          <path className={styles.stalkR} d="M250,141 L294,141" />
          <path
            className={styles.nb}
            d="M322.2,155.6 A19,19 0 1 1 322.2,126.4"
          />
        </g>
        <g id="desc-chain">
          <use href="#desc-unit" x="70" />
          <use href="#desc-unit" x="436" />
          <use href="#desc-unit" x="802" />
        </g>
      </defs>
    </svg>
  );
}

export function ChainFigure() {
  return (
    <svg
      viewBox="0 0 1160 320"
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- インラインSVGに対応する意味のあるタグが無い
      role="img"
      aria-label="記号化した細胞3つが一直線につながった状態"
    >
      <use href="#desc-chain" />
      <text className={styles.nm} x="382" y="56" textAnchor="middle">
        Ag ⇄ Nb
      </text>
      <path className={styles.ldr} d="M382,68 L382,114" />
      <path className={styles.ldr} d="M20,288 L1118,288" strokeWidth="1.6" />
      <polygon className={styles.ldot} points="1118,281 1138,288 1118,295" />
      <text className={styles.big} x="580" y="252" textAnchor="middle">
        ONE DIRECTION
      </text>
    </svg>
  );
}

export function IntroFigure() {
  return (
    <svg
      viewBox="0 0 880 320"
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- インラインSVGに対応する意味のあるタグが無い
      role="img"
      aria-label="向きのそろった回路と上皮、向きの乱れた状態の対比"
    >
      <text className={`${styles.nm} ${styles.g}`} x="0" y="20">
        向きがそろう
      </text>
      <text className={`${styles.nm} ${styles.g}`} x="460" y="20">
        向きが乱れる
      </text>
      <line
        x1="440"
        y1="34"
        x2="440"
        y2="310"
        stroke="rgba(13,15,18,.14)"
        strokeWidth="1.4"
      />
      <text className={styles.nm} x="0" y="66">
        電気回路
      </text>
      <g stroke="#0d0f12" strokeWidth="2.6" fill="none">
        <path d="M8,120 H90 M150,120 H250 M310,120 H400" />
      </g>
      <g fill="none" stroke="#1e50a2" strokeWidth="3">
        <polygon points="96,104 136,120 96,136" fill="#1e50a2" stroke="none" />
        <line x1="140" y1="102" x2="140" y2="138" />
        <polygon
          points="256,104 296,120 256,136"
          fill="#1e50a2"
          stroke="none"
        />
        <line x1="300" y1="102" x2="300" y2="138" />
      </g>
      <polygon className={styles.ldot} points="388,113 410,120 388,127" />
      <text className={`${styles.nm} ${styles.g}`} x="8" y="162">
        同じ向きのダイオード。電流は流れる
      </text>
      <text className={styles.nm} x="460" y="66">
        同じ部品、違う向き
      </text>
      <g stroke="#0d0f12" strokeWidth="2.6" fill="none">
        <path d="M468,120 H550 M610,120 H710 M770,120 H860" />
      </g>
      <g fill="none" stroke="#d3381c" strokeWidth="3">
        <polygon
          points="556,104 596,120 556,136"
          fill="#d3381c"
          stroke="none"
        />
        <line x1="600" y1="102" x2="600" y2="138" />
        <polygon
          points="756,104 716,120 756,136"
          fill="#d3381c"
          stroke="none"
        />
        <line x1="712" y1="102" x2="712" y2="138" />
      </g>
      <line
        x1="762"
        y1="104"
        x2="786"
        y2="136"
        stroke="#d3381c"
        strokeWidth="3"
      />
      <line
        x1="786"
        y1="104"
        x2="762"
        y2="136"
        stroke="#d3381c"
        strokeWidth="3"
      />
      <text className={`${styles.nm} ${styles.g}`} x="468" y="162">
        1つ逆を向くだけで、流れは止まる
      </text>
      <text className={styles.nm} x="0" y="208">
        上皮組織
      </text>
      <g fill="none" stroke="#0d0f12" strokeWidth="2.4">
        <rect x="8" y="228" width="46" height="54" rx="8" />
        <rect x="64" y="228" width="46" height="54" rx="8" />
        <rect x="120" y="228" width="46" height="54" rx="8" />
        <rect x="176" y="228" width="46" height="54" rx="8" />
        <rect x="232" y="228" width="46" height="54" rx="8" />
        <rect x="288" y="228" width="46" height="54" rx="8" />
      </g>
      <g fill="#1e50a2">
        <rect x="8" y="228" width="46" height="12" rx="6" />
        <rect x="64" y="228" width="46" height="12" rx="6" />
        <rect x="120" y="228" width="46" height="12" rx="6" />
        <rect x="176" y="228" width="46" height="12" rx="6" />
        <rect x="232" y="228" width="46" height="12" rx="6" />
        <rect x="288" y="228" width="46" height="12" rx="6" />
      </g>
      <text className={`${styles.nm} ${styles.g}`} x="8" y="308">
        管腔側がそろう
      </text>
      <g transform="translate(468,0)">
        <g fill="none" stroke="#0d0f12" strokeWidth="2.4">
          <rect
            x="0"
            y="230"
            width="46"
            height="50"
            rx="8"
            transform="rotate(-14 23 255)"
          />
          <rect
            x="58"
            y="226"
            width="46"
            height="50"
            rx="8"
            transform="rotate(22 81 251)"
          />
          <rect
            x="118"
            y="234"
            width="46"
            height="50"
            rx="8"
            transform="rotate(-32 141 259)"
          />
          <rect
            x="178"
            y="224"
            width="46"
            height="50"
            rx="8"
            transform="rotate(8 201 249)"
          />
          <rect
            x="238"
            y="236"
            width="46"
            height="50"
            rx="8"
            transform="rotate(-6 261 261)"
          />
        </g>
        <g fill="#d3381c">
          <rect
            x="0"
            y="230"
            width="46"
            height="11"
            rx="5.5"
            transform="rotate(-14 23 255)"
          />
          <rect
            x="58"
            y="226"
            width="46"
            height="11"
            rx="5.5"
            transform="rotate(22 81 251)"
          />
          <rect
            x="118"
            y="234"
            width="46"
            height="11"
            rx="5.5"
            transform="rotate(-32 141 259)"
          />
          <rect
            x="178"
            y="224"
            width="46"
            height="11"
            rx="5.5"
            transform="rotate(8 201 249)"
          />
          <rect
            x="238"
            y="236"
            width="46"
            height="11"
            rx="5.5"
            transform="rotate(-6 261 261)"
          />
        </g>
        <text className={`${styles.nm} ${styles.g}`} x="0" y="308">
          向きが崩れる
        </text>
      </g>
    </svg>
  );
}

export function AdhesionFigure() {
  return (
    <svg
      viewBox="0 0 880 250"
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- インラインSVGに対応する意味のあるタグが無い
      role="img"
      aria-label="既存技術では相手は選べるが向きは乱れる。One Direction では向きまでそろう"
    >
      <text className={styles.nm} x="0" y="26">
        既存の接着技術
      </text>
      <text className={`${styles.nm} ${styles.g}`} x="0" y="52">
        相手は選べる。向きは決まらない
      </text>
      <g fill="#fff" stroke="#0d0f12" strokeWidth="3">
        <rect
          x="10"
          y="96"
          width="120"
          height="46"
          rx="23"
          transform="rotate(-18 70 119)"
        />
        <rect
          x="140"
          y="128"
          width="120"
          height="46"
          rx="23"
          transform="rotate(26 200 151)"
        />
        <rect
          x="60"
          y="166"
          width="120"
          height="46"
          rx="23"
          transform="rotate(-8 120 189)"
        />
        <rect
          x="238"
          y="80"
          width="120"
          height="46"
          rx="23"
          transform="rotate(12 298 103)"
        />
      </g>
      <g fill="#1e50a2">
        <circle cx="28" cy="131" r="12" />
        <circle cx="152" cy="138" r="12" />
        <circle cx="76" cy="194" r="12" />
        <circle cx="251" cy="96" r="12" />
      </g>
      <line
        x1="440"
        y1="20"
        x2="440"
        y2="230"
        stroke="rgba(13,15,18,.14)"
        strokeWidth="1.4"
      />
      <text className={styles.nm} x="470" y="26">
        One Direction
      </text>
      <text className={`${styles.nm} ${styles.g}`} x="470" y="52">
        相手も、向きも決める
      </text>
      <g transform="translate(470,0)">
        <g fill="#fff" stroke="#0d0f12" strokeWidth="3">
          <rect x="0" y="118" width="120" height="46" rx="23" />
          <rect x="130" y="118" width="120" height="46" rx="23" />
          <rect x="260" y="118" width="120" height="46" rx="23" />
        </g>
        <g fill="#1e50a2">
          <circle cx="24" cy="141" r="12" />
          <circle cx="154" cy="141" r="12" />
          <circle cx="284" cy="141" r="12" />
        </g>
        <g className={styles.diviva} strokeWidth="7">
          <circle cx="96" cy="141" r="12" fill="none" />
          <circle cx="226" cy="141" r="12" fill="none" />
          <circle cx="356" cy="141" r="12" fill="none" />
        </g>
        <path className={styles.ldr} d="M0,200 H378" strokeWidth="1.6" />
        <polygon className={styles.ldot} points="378,193 398,200 378,207" />
      </g>
    </svg>
  );
}
