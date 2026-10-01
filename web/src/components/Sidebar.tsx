import { withBase } from "../base";
import type { Locale, WikiPage } from "../content";
import type { Route } from "../routes";
import styles from "./Sidebar.module.css";

const otherLocale = (locale: Locale): Locale => (locale === "en" ? "ja" : "en");

const homePath = (locale: Locale, routes: Route[]): string | undefined =>
  routes.find((r) => r.page.locale === locale && r.page.slug === "home")?.path;

// 相手の言語に同じslugがあればそのページ、なければ相手の言語のhomeのURLパスを返す。homeも無ければundefined。
export function alternatePath(page: Pick<WikiPage, "locale" | "slug">, routes: Route[]): string | undefined {
  const locale = otherLocale(page.locale);
  const same = routes.find((r) => r.page.locale === locale && r.page.slug === page.slug);
  return same ? same.path : homePath(locale, routes);
}

const labels = {
  en: { menu: "Menu", nav: "Main", lang: "Language" },
  ja: { menu: "メニュー", nav: "メインメニュー", lang: "言語" },
} as const;

export function Sidebar({ page, routes }: { page: WikiPage; routes: Route[] }) {
  const label = labels[page.locale];
  const items = routes.filter((r) => r.page.locale === page.locale);
  const alternate = otherLocale(page.locale);
  const alternateHref = alternatePath(page, routes);
  return (
    <header className={styles.root}>
      <a className={styles.logo} href={withBase(homePath(page.locale, routes) ?? "/")}>
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
          {alternateHref && (
            <div className={styles.lang} role="group" aria-label={label.lang}>
              <span className={styles.langCurrent} lang={page.locale}>
                {page.locale.toUpperCase()}
              </span>
              <a className={styles.link} href={withBase(alternateHref)} hrefLang={alternate} lang={alternate}>
                {alternate.toUpperCase()}
              </a>
            </div>
          )}
        </div>
      </details>
    </header>
  );
}
