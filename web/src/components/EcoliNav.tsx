import { withBase } from "../base";
import type { Locale, WikiPage } from "../content";
import { categoryIdOf, groupRoutes } from "../lib/navGroups";
import type { Route } from "../routes";

import styles from "./EcoliNav.module.css";

const otherLocale = (locale: Locale): Locale => (locale === "en" ? "ja" : "en");

const homePath = (locale: Locale, routes: Route[]): string | undefined =>
  routes.find((r) => r.page.locale === locale && r.page.slug === "home")?.path;

// 相手の言語に同じslugがあればそのページ、なければ相手の言語のhomeのURLパスを返す。homeも無ければundefined。
export function alternatePath(
  page: Pick<WikiPage, "locale" | "slug">,
  routes: Route[]
): string | undefined {
  const locale = otherLocale(page.locale);
  const same = routes.find(
    (r) => r.page.locale === locale && r.page.slug === page.slug
  );
  return same ? same.path : homePath(locale, routes);
}

const labels = {
  en: { category: "Category", pages: "Pages", lang: "Language" },
  ja: { category: "カテゴリ", pages: "ページ", lang: "言語" },
} as const;

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

// リンク先がいまのページ自身なら"page"、同じ分類の別ページなら"true"。
function currentValue(inCategory: boolean, isPage: boolean) {
  if (!inCategory) {
    return;
  }
  return isPage ? "page" : "true";
}

// 1段目にロゴ、大腸菌の連なり、言語の切り替えを並べるヘッダー。1匹が1分類で、いまのページの分類の1匹を強調する。
// 大腸菌にホバーかフォーカスが入るとその分類のページ一覧が下に開き、ホバーできない端末では一覧を2段目に出す。JSは使わない。
export function EcoliNav({
  page,
  routes,
}: {
  page: WikiPage;
  routes: Route[];
}) {
  const locale: Locale = page.locale;
  const label = labels[locale];
  const current = categoryIdOf(page.slug);
  const alternate = otherLocale(locale);
  const alternateHref = alternatePath(page, routes);
  const groups = groupRoutes(locale, routes).filter((g) => g.routes.length > 0);
  const currentGroup = groups.find((g) => g.category.id === current);
  return (
    <header className={styles.root}>
      <div className={styles.bar}>
        <a
          className={styles.logo}
          href={withBase(homePath(locale, routes) ?? "/")}
          aria-current={page.slug === "home" ? "page" : undefined}
        >
          <span>iGEM</span>
          <span className={styles.logoSub}>Keio 2026</span>
        </a>
        <nav className={styles.category} aria-label={label.category}>
          <ol className={styles.chain}>
            <li className={styles.tail} aria-hidden="true">
              <Flagella />
            </li>
            {groups.map(({ category, routes: items }) => (
              <li key={category.id} className={styles.item}>
                <a
                  className={styles.cell}
                  href={withBase(items[0].path)}
                  aria-current={currentValue(
                    category.id === current,
                    items[0].page.slug === page.slug
                  )}
                >
                  <Arrow />
                  <span className={styles.label}>{category.label}</span>
                </a>
                <div className={styles.panel}>
                  <ul className={styles.panelList}>
                    {items.map(({ page: p, path }) => (
                      <li key={path}>
                        <a
                          className={styles.link}
                          href={withBase(path)}
                          aria-current={
                            p.slug === page.slug ? "page" : undefined
                          }
                        >
                          {p.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
            <li className={styles.head} aria-hidden="true" />
          </ol>
        </nav>
        {alternateHref && (
          // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- fieldsetにすると既定の枠線とレイアウトが付く
          <div className={styles.lang} role="group" aria-label={label.lang}>
            <span className={styles.langCurrent} lang={locale}>
              {locale.toUpperCase()}
            </span>
            <a
              className={styles.langLink}
              href={withBase(alternateHref)}
              hrefLang={alternate}
              lang={alternate}
            >
              {alternate.toUpperCase()}
            </a>
          </div>
        )}
      </div>
      {currentGroup && (
        <nav className={styles.sub} aria-label={label.pages}>
          <ul className={styles.subList}>
            {currentGroup.routes.map(({ page: p, path }) => (
              <li key={path}>
                <a
                  className={styles.link}
                  href={withBase(path)}
                  aria-current={p.slug === page.slug ? "page" : undefined}
                >
                  {p.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
