import { withBase } from "../base";
import type { Locale, WikiPage } from "../content";
import { applyBase } from "../lib/applyBase";
import type { Route } from "../routes";

import styles from "./HomePage.module.css";

// ビルド時にvite.config.tsのプラグインが画像の配信元に置き換える。
const imageBase = "__WIKI_IMAGE_BASE__";

const contentsSubtitle: Record<Locale, string> = {
  en: "コンテンツ",
  ja: "Contents",
};

// カード全体がリンクなので、leadのaは外す。入れ子のaはHTMLとして不正になる。
const stripLinks = (html: string) => html.replaceAll(/<\/?a(\s[^>]*)?>/giu, "");

function compareSlug(a: string, b: string): number {
  if (a < b) {
    return -1;
  }
  return a > b ? 1 : 0;
}

// 現在のlocaleのhome以外のページをorder順(同値はslug順)に並べる。
function contentsRoutes(page: WikiPage, routes: Route[]): Route[] {
  return routes
    .filter(
      (r) =>
        r.page.locale === page.locale &&
        r.page.slug !== "home" &&
        r.page.published
    )
    .toSorted(
      (a, b) =>
        a.page.order - b.page.order || compareSlug(a.page.slug, b.page.slug)
    );
}

// ヒーローとContentsのカードを持つHome専用の本文。
export function HomePage({
  page,
  routes,
}: {
  page: WikiPage;
  routes: Route[];
}) {
  return (
    <main className={styles.main}>
      <h1 className={styles.visuallyHidden}>{page.title}</h1>
      <section className={styles.hero}>
        <picture className={styles.art}>
          <source
            media="(max-width: 1600px)"
            srcSet={`${imageBase}/hero-ukiyoe-1600.webp`}
          />
          <img
            src={`${imageBase}/hero-ukiyoe.webp`}
            alt=""
            width={2623}
            height={1415}
            loading="eager"
            fetchPriority="high"
          />
        </picture>
        <img
          className={styles.logo}
          src={`${imageBase}/one-direction.png`}
          alt="One Direction"
          width={632}
          height={228}
        />
        {page.lead && (
          <p
            className={styles.catch}
            dangerouslySetInnerHTML={{
              __html: applyBase(page.lead, import.meta.env.BASE_URL),
            }}
          />
        )}
        <div className={styles.about}>
          <p className={styles.name}>iGEM Keio 2026</p>
          {page.subtitle && <p className={styles.tagline}>{page.subtitle}</p>}
          {page.html && (
            <div
              data-testid="home-description"
              className={styles.description}
              dangerouslySetInnerHTML={{
                __html: applyBase(page.html, import.meta.env.BASE_URL),
              }}
            />
          )}
        </div>
      </section>
      <section className={styles.contents}>
        <h2 className={styles.contentsTitle}>Contents</h2>
        <p className={styles.contentsSubtitle}>
          {contentsSubtitle[page.locale]}
        </p>
        <ul className={styles.cards}>
          {contentsRoutes(page, routes).map(({ page: item, path }) => (
            <li key={path}>
              <a className={styles.card} href={withBase(path)}>
                <span className={styles.cardTitle}>{item.title}</span>
                {item.subtitle && (
                  <span className={styles.cardSubtitle}>{item.subtitle}</span>
                )}
                <span
                  className={styles.cardLead}
                  dangerouslySetInnerHTML={{
                    __html: applyBase(
                      stripLinks(item.lead),
                      import.meta.env.BASE_URL
                    ),
                  }}
                />
              </a>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
