import type { WikiPage } from "../content";
import { applyBase } from "../lib/applyBase";

import styles from "./HomePage.module.css";

// ビルド時にvite.config.tsのプラグインが画像の配信元に置き換える。
const imageBase = "__WIKI_IMAGE_BASE__";

// ヒーローを持つHome専用の本文。
export function HomePage({ page }: { page: WikiPage }) {
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
    </main>
  );
}
