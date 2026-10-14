import type { Locale } from "../content";
import footer from "../data/footer.json";
import sponsors from "../data/sponsors.json";
import { socialIconPath } from "../lib/socialIcons";

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
    pause: "Pause",
    play: "Play",
    license: "Licensed under CC BY 4.0",
    repository: "Wiki repository",
  },
  ja: {
    contact: "連絡先",
    social: "SNS",
    sponsors: "スポンサー",
    prev: "前へ",
    next: "次へ",
    pause: "一時停止",
    play: "再生",
    license: "Licensed under CC BY 4.0",
    repository: "wikiのリポジトリ",
  },
} as const;

interface SocialItem {
  label: string;
  href: string;
}

// SNSのリンク。リンク先に対応するアイコンがあればアイコンで、無ければ文字で出す。
export function SocialLinks({
  items,
  label,
}: {
  items: SocialItem[];
  label: string;
}) {
  return (
    <ul className={styles.social} aria-label={label}>
      {items.map((item) => {
        const path = socialIconPath(item.href);
        return (
          <li key={item.label}>
            {path ? (
              <a
                className={styles.socialIcon}
                href={item.href}
                aria-label={item.label}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d={path} fill="currentColor" />
                </svg>
              </a>
            ) : (
              <a href={item.href}>{item.label}</a>
            )}
          </li>
        );
      })}
    </ul>
  );
}

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
        <SocialLinks items={footer.social} label={label.social} />
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
        <button
          type="button"
          className={styles.arrow}
          aria-label={label.pause}
          data-sponsors-toggle=""
          data-label-pause={label.pause}
          data-label-play={label.play}
          hidden
        >
          <svg
            className={styles.iconPause}
            viewBox="0 0 24 24"
            width="16"
            height="16"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M6 4h4v16H6zM14 4h4v16h-4z" fill="currentColor" />
          </svg>
          <svg
            className={styles.iconPlay}
            viewBox="0 0 24 24"
            width="16"
            height="16"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M7 4l13 8-13 8z" fill="currentColor" />
          </svg>
        </button>
      </section>
      <p className={styles.bottom}>
        <span>iGEM Keio 2026 · {label.license}</span>
        <a href={footer.repository}>{label.repository}</a>
      </p>
    </footer>
  );
}
