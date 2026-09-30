import { withBase } from "../base";
import type { Locale, WikiPage } from "../content";
import { pagePath, type Route } from "../routes";
import styles from "./Sidebar.module.css";

const otherLocale = (locale: Locale): Locale => (locale === "en" ? "ja" : "en");

// 相手の言語に同じslugがあればそのページ、なければ相手の言語のhomeのURLパスを返す。
export function alternatePath(page: Pick<WikiPage, "locale" | "slug">, routes: Route[]): string {
  const locale = otherLocale(page.locale);
  const same = routes.find((r) => r.page.locale === locale && r.page.slug === page.slug);
  return same ? same.path : pagePath({ locale, slug: "home" });
}

const labels = {
  en: { menu: "Open menu", nav: "Main", lang: "Language" },
  ja: { menu: "メニューを開く", nav: "メインメニュー", lang: "言語" },
} as const;

export function Sidebar({ page, routes }: { page: WikiPage; routes: Route[] }) {
  const label = labels[page.locale];
  const items = routes.filter((r) => r.page.locale === page.locale);
  const alternate = otherLocale(page.locale);
  const locales: Locale[] = ["en", "ja"];
  return (
    <header className={styles.root}>
      <a className={styles.logo} href={withBase(pagePath({ locale: page.locale, slug: "home" }))}>
        <span>iGEM</span>
        <span className={styles.logoSub}>Keio 2026</span>
      </a>
      <details className={styles.menu}>
        <summary className={styles.toggle} aria-label={label.menu}>
          <span className={styles.bars} />
        </summary>
        <div className={styles.panel}>
          <nav className={styles.nav} aria-label={label.nav}>
            {items.map(({ page: p, path }) => (
              <a
                key={path}
                className={styles.link}
                href={withBase(path)}
                aria-current={p.slug === page.slug ? "page" : undefined}
              >
                {p.title}
              </a>
            ))}
          </nav>
          <div className={styles.lang} role="group" aria-label={label.lang}>
            {locales.map((l) =>
              l === page.locale ? (
                <span key={l} className={styles.langCurrent} lang={l}>
                  {l.toUpperCase()}
                </span>
              ) : (
                <a
                  key={l}
                  className={styles.link}
                  href={withBase(alternatePath(page, routes))}
                  hrefLang={alternate}
                  lang={l}
                >
                  {l.toUpperCase()}
                </a>
              ),
            )}
          </div>
        </div>
      </details>
    </header>
  );
}
