import type { Locale } from "../content";
import footer from "../data/footer.json";
import sponsors from "../data/sponsors.json";

import styles from "./Footer.module.css";

// ビルド時にvite.config.tsのプラグインが画像の配信元に置き換える。
const imageBase = "__WIKI_IMAGE_BASE__";

const labels = {
  en: {
    contact: "Contact",
    social: "Social media",
    sponsors: "Sponsors",
    prev: "Previous",
    next: "Next",
    license: "Licensed under CC BY 4.0",
    repository: "Wiki repository",
  },
  ja: {
    contact: "連絡先",
    social: "SNS",
    sponsors: "スポンサー",
    prev: "前へ",
    next: "次へ",
    license: "Licensed under CC BY 4.0",
    repository: "wikiのリポジトリ",
  },
} as const;

// ロゴ、連絡先、SNSの1段目、スポンサーの帯の2段目、ライセンスとリポジトリの3段目。
// 帯はJSが無くても横スクロールで見られ、送りのボタンはJS(public/footer-sponsors.js)が出す。
export function Footer({ locale }: { locale: Locale }) {
  const label = labels[locale];
  return (
    <footer className={styles.root}>
      <div className={styles.top}>
        <div className={styles.team}>
          <p className={styles.logo}>
            <span>iGEM</span>
            <span className={styles.logoSub}>Keio 2026</span>
          </p>
          <p className={styles.contact}>
            <span>{label.contact}</span>
            <a href={`mailto:${footer.email}`}>{footer.email}</a>
          </p>
        </div>
        <ul className={styles.social} aria-label={label.social}>
          {footer.social.map((item) => (
            <li key={item.label}>
              <a href={item.href}>{item.label}</a>
            </li>
          ))}
        </ul>
      </div>
      <section
        className={styles.sponsors}
        aria-label={label.sponsors}
        data-sponsors=""
      >
        <button
          type="button"
          className={styles.arrow}
          aria-label={label.prev}
          data-sponsors-prev=""
          hidden
        >
          <span aria-hidden="true">‹</span>
        </button>
        <ul className={styles.track} data-sponsors-track="">
          {sponsors.map((sponsor) => (
            <li key={sponsor.name} className={styles.slide}>
              <a href={sponsor.href}>
                <img
                  src={`${imageBase}/${sponsor.logo}`}
                  alt={sponsor.alt}
                  width={200}
                  height={80}
                  loading="lazy"
                />
              </a>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className={styles.arrow}
          aria-label={label.next}
          data-sponsors-next=""
          hidden
        >
          <span aria-hidden="true">›</span>
        </button>
      </section>
      <p className={styles.bottom}>
        <span>iGEM Keio 2026 · {label.license}</span>
        <a href={footer.repository}>{label.repository}</a>
      </p>
    </footer>
  );
}
