import type { WikiPage } from "../content";
import { ISLANDS } from "../islands";
import { buildToc } from "../lib/toc";
import styles from "./ArticlePage.module.css";
import { Island } from "./Island";
import { Toc } from "./Toc";

// h1、subtitle、lead、本文と、本文の右の目次を描く。
export function ArticlePage({ page }: { page: WikiPage }) {
  for (const name of page.islands) {
    if (!(name in ISLANDS)) console.warn(`未登録の島です: ${name}(${page.locale}/${page.slug})`);
  }
  const islands = page.islands.filter((name) => ISLANDS[name]?.place === "afterBody");
  return (
    <>
      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>{page.title}</h1>
          {page.subtitle && <p className={styles.subtitle}>{page.subtitle}</p>}
        </div>
        {page.lead && <p className={styles.lead} dangerouslySetInnerHTML={{ __html: page.lead }} />}
        <div className={`${styles.body} prose`} dangerouslySetInnerHTML={{ __html: page.html }} />
        {islands.map((name) => (
          <Island key={name} name={name} props={ISLANDS[name].props(page)} />
        ))}
      </main>
      <Toc items={buildToc(page.html)} locale={page.locale} />
    </>
  );
}
