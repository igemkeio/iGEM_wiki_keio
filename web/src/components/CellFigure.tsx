import type { ReactNode } from "react";

import type { FigurePart } from "../lib/dbtl";

import styles from "./CellFigure.module.css";

export interface FigureTarget {
  part: FigurePart;
  // 押したときに移るサイクル
  no: number;
  label: string;
}

// 記号化した細胞1個。3か所が設計の3サイクルに対応する。
export function CellFigure({
  targets,
  lit,
  alt,
  onSelect,
  onHover,
  onLeave,
}: {
  targets: FigureTarget[];
  lit: FigurePart[];
  alt: string;
  onSelect?: (no: number) => void;
  onHover?: (no: number) => void;
  onLeave?: () => void;
}) {
  const wrap = (part: FigurePart, children: ReactNode) => {
    const target = targets.find((t) => t.part === part);
    if (!target) {
      return null;
    }
    const classes = [styles.part, lit.includes(part) ? styles.on : ""]
      .filter(Boolean)
      .join(" ");
    return (
      <a
        className={classes}
        href={`#dbtl-cycle-${target.no}`}
        aria-label={target.label}
        onClick={
          onSelect &&
          ((event) => {
            event.preventDefault();
            onSelect(target.no);
          })
        }
        onMouseEnter={onHover && (() => onHover(target.no))}
        onMouseLeave={onLeave}
        onFocus={onHover && (() => onHover(target.no))}
        onBlur={onLeave}
      >
        {children}
      </a>
    );
  };
  return (
    // role="img" を付けると中のリンクが支援技術から読まれなくなるので、titleだけで名前を付ける
    <svg className={styles.figure} viewBox="105 44 570 112">
      <title>{alt}</title>
      <rect
        className={styles.body}
        x="196"
        y="52"
        width="372"
        height="96"
        rx="48"
      />
      {wrap(
        "poles",
        <>
          <circle className={styles.popz} cx="266" cy="100" r="22" />
          <circle className={styles.diviva} cx="498" cy="100" r="22" />
        </>
      )}
      {wrap(
        "coil",
        <>
          <line className={styles.coilE} x1="182" y1="86" x2="224" y2="86" />
          <line className={styles.coilR} x1="182" y1="114" x2="224" y2="114" />
        </>
      )}
      {wrap(
        "adhesion",
        <>
          <path className={styles.stalk} d="M196,100 L150,100" />
          <circle className={styles.ag} cx="128" cy="100" r="15" />
          <text className={styles.name} x="128" y="150">
            Ag
          </text>
          <path className={styles.stalk} d="M568,100 L614,100" />
          <path className={styles.nb} d="M646,116 A20,20 0 1 1 646,84" />
          <text className={styles.name} x="634" y="150">
            Nb
          </text>
        </>
      )}
    </svg>
  );
}
