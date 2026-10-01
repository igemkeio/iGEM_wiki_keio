import { withBase } from "../base";
import type { Locale, WikiPage } from "../content";
import type { Route } from "../routes";
import styles from "./HomePage.module.css";

// ビルド時にvite.config.tsのプラグインが画像の配信元に置き換える。
const imageBase = "__WIKI_IMAGE_BASE__";

const curveProps = { pathLength: 1, className: styles.curve, fill: "none", strokeWidth: 1 } as const;

// ヒーローの装飾。曲線は描かれ、オレンジの円は上下に揺れる。
function Decoration() {
  return (
    <svg className={styles.decoration} viewBox="0 0 1260 993" aria-hidden="true" focusable="false">
      <path {...curveProps} d="M347 356 C800 330 1000 330 1260 120" />
      <path {...curveProps} d="M347 557 C700 490 1050 420 1260 217" />
      <circle className={styles.ring} cx="964" cy="271" r="15" />
      <circle className={styles.orb} cx="882" cy="330" r="32" />
    </svg>
  );
}

const contentsSubtitle: Record<Locale, string> = { en: "コンテンツ", ja: "Contents" };

// カード全体がリンクなので、leadのaは外す。入れ子のaはHTMLとして不正になる。
const stripLinks = (html: string) => html.replace(/<\/?a(\s[^>]*)?>/gi, "");

// 現在のlocaleのhome以外のページをorder順(同値はslug順)に並べる。
function contentsRoutes(page: WikiPage, routes: Route[]): Route[] {
  return routes
    .filter((r) => r.page.locale === page.locale && r.page.slug !== "home" && r.page.published)
    .sort((a, b) => a.page.order - b.page.order || (a.page.slug < b.page.slug ? -1 : a.page.slug > b.page.slug ? 1 : 0));
}

// ヒーローとContentsのカードを持つHome専用の本文。
export function HomePage({ page, routes }: { page: WikiPage; routes: Route[] }) {
  return (
    <main className={styles.main}>
      <h1 className={styles.visuallyHidden}>{page.title}</h1>
      <section className={styles.hero}>
        <Decoration />
        <img
          className={styles.logo}
          src={`${imageBase}/one-direction.svg`}
          alt="One Direction"
          width={632}
          height={228}
        />
        {page.lead && <p className={styles.catch} dangerouslySetInnerHTML={{ __html: page.lead }} />}
        <div className={styles.about}>
          <p className={styles.name}>iGEM Keio 2026</p>
          {page.subtitle && <p className={styles.tagline}>{page.subtitle}</p>}
          {page.html && <div className={styles.description} dangerouslySetInnerHTML={{ __html: page.html }} />}
        </div>
      </section>
      <section className={styles.contents}>
        <h2 className={styles.contentsTitle}>Contents</h2>
        <p className={styles.contentsSubtitle}>{contentsSubtitle[page.locale]}</p>
        <ul className={styles.cards}>
          {contentsRoutes(page, routes).map(({ page: item, path }) => (
            <li key={path}>
              <a className={styles.card} href={withBase(path)}>
                <span className={styles.cardTitle}>{item.title}</span>
                {item.subtitle && <span className={styles.cardSubtitle}>{item.subtitle}</span>}
                <span className={styles.cardLead} dangerouslySetInnerHTML={{ __html: stripLinks(item.lead) }} />
              </a>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
