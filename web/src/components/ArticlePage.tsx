import type { WikiPage } from "../content";
import { buildToc } from "../lib/toc";
import styles from "./ArticlePage.module.css";
import { Island } from "./Island";
import { Toc } from "./Toc";

// 島の名前ごとの差し込み位置。いまは本文の後だけで、将来の島はここに足す。
const afterBodyIslands = ["member-list"];

// h1、subtitle、lead、本文と、本文の右の目次を描く。
export function ArticlePage({ page }: { page: WikiPage }) {
  return (
    <>
      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>{page.title}</h1>
          {page.subtitle && <p className={styles.subtitle}>{page.subtitle}</p>}
        </div>
        {page.lead && <p className={styles.lead} dangerouslySetInnerHTML={{ __html: page.lead }} />}
        <div className={`${styles.body} prose`} dangerouslySetInnerHTML={{ __html: page.html }} />
        {afterBodyIslands
          .filter((name) => page.islands.includes(name))
          .map((name) => (
            <Island key={name} name={name} props={{ locale: page.locale }} />
          ))}
      </main>
      <Toc items={buildToc(page.html)} locale={page.locale} />
    </>
  );
}
