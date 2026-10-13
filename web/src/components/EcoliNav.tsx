import { withBase } from "../base";
import type { Locale, WikiPage } from "../content";
import { categoryIdOf, groupRoutes } from "../lib/navGroups";
import type { Route } from "../routes";

import styles from "./EcoliNav.module.css";

const labels = { en: "Category", ja: "カテゴリ" } as const;

// 進行方向を示す矢印。ecoli-line.svgのpathと同じ形。
function Arrow() {
  return (
    <svg className={styles.arrow} viewBox="-56 -22 116 44" aria-hidden="true">
      <path d="M-56,-9 H28 V-22 L60,0 L28,22 V9 H-56 Z" />
    </svg>
  );
}

function Flagella() {
  return (
    <svg className={styles.flagella} viewBox="0 0 130 56" aria-hidden="true">
      <path d="M128,28 C94,10 48,48 10,26 C48,54 96,18 132,40" opacity="0.85" />
      <path d="M130,44 C98,34 54,64 16,48" opacity="0.55" strokeWidth="2.5" />
    </svg>
  );
}

// 大腸菌の連なり。1匹が1分類で、いまのページの分類の1匹を強調する。JSは使わない。
export function EcoliNav({
  page,
  routes,
}: {
  page: WikiPage;
  routes: Route[];
}) {
  const locale: Locale = page.locale;
  const current = categoryIdOf(page.slug);
  return (
    <nav className={styles.root} aria-label={labels[locale]}>
      <ol className={styles.chain}>
        <li className={styles.tail} aria-hidden="true">
          <Flagella />
        </li>
        {groupRoutes(locale, routes)
          .filter((g) => g.routes.length > 0)
          .map(({ category, routes: items }) => (
            <li key={category.id} className={styles.item}>
              <a
                className={styles.cell}
                href={withBase(items[0].path)}
                aria-current={category.id === current ? "true" : undefined}
              >
                <Arrow />
                <span className={styles.label}>{category.label}</span>
              </a>
            </li>
          ))}
        <li className={styles.head} aria-hidden="true" />
      </ol>
    </nav>
  );
}
