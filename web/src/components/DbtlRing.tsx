import { PHASES } from "../lib/dbtl";

import styles from "./DbtlRing.module.css";

const R = 150;
const C = 200;

const polar = (deg: number, r: number) => [
  C + r * Math.cos(((deg - 90) * Math.PI) / 180),
  C + r * Math.sin(((deg - 90) * Math.PI) / 180),
];

const arcPath = (from: number, to: number, r: number) => {
  const [x0, y0] = polar(from, r);
  const [x1, y1] = polar(to, r);
  return `M${x0},${y0} A${r},${r} 0 0 1 ${x1},${y1}`;
};

// DBTLの輪。弧は読み進めた分だけ点き、今いるフェーズだけ太い。
export function DbtlRing({
  caption,
  phase,
  upto,
  iteration,
  iterationNo,
  iterationCount,
  bumpKey,
  onPick,
}: {
  caption: string;
  // 今いるフェーズの番号。フェーズの外なら-1
  phase: number;
  // 点けるフェーズの上限。どれも点けないなら-1
  upto: number;
  // 今の反復の位置(0から)
  iteration: number;
  iterationNo: number;
  iterationCount: number;
  // 変わったときだけ番号を弾ませるための値
  bumpKey?: number;
  onPick?: (phase: number) => void;
}) {
  const dots = Array.from({ length: iterationCount }, (_, k) => k);
  return (
    <svg className={styles.ring} viewBox="0 0 400 400" aria-hidden="true">
      {PHASES.map((key, i) => {
        const [lx, ly] = polar(i * 90 + 45, R);
        const [ax, ay] = polar((i + 1) * 90, R);
        const classes = [
          styles.arc,
          i <= upto ? styles.lit : "",
          i === phase ? styles.on : "",
        ]
          .filter(Boolean)
          .join(" ");
        return (
          <g key={key}>
            <path
              className={classes}
              d={arcPath(i * 90 + 4, (i + 1) * 90 - 4, R)}
              stroke={`var(--color-dbtl-${key})`}
              onClick={onPick && (() => onPick(i))}
            />
            <text className={styles.label} x={lx} y={ly}>
              {key.toUpperCase()}
            </text>
            <polygon
              className={styles.arrow}
              points="0,-7 10,0 0,7"
              transform={`translate(${ax},${ay}) rotate(${(i + 1) * 90})`}
            />
          </g>
        );
      })}
      <text className={styles.caption} x="200" y="160">
        {caption}
      </text>
      <text
        key={bumpKey}
        className={bumpKey ? `${styles.number} ${styles.bump}` : styles.number}
        x="200"
        y="212"
      >
        {iterationNo}
      </text>
      {dots.map((k) => (
        <circle
          key={k}
          className={[
            styles.dot,
            k <= iteration ? styles.done : "",
            k === iteration ? styles.current : "",
          ]
            .filter(Boolean)
            .join(" ")}
          cx={200 + (k - (iterationCount - 1) / 2) * 24}
          cy="274"
        />
      ))}
    </svg>
  );
}
