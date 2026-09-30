import type { ReactNode } from "react";
import type { WikiPage } from "../content";
import { buildToc } from "../lib/toc";
import type { Route } from "../routes";
import { Footer } from "./Footer";
import styles from "./PageShell.module.css";
import { Sidebar } from "./Sidebar";
import { Toc } from "./Toc";

export function PageShell({
  page,
  routes,
  children,
}: {
  page: WikiPage;
  routes: Route[];
  children?: ReactNode;
}) {
  const toc = buildToc(page.html);
  return (
    <>
      <Sidebar page={page} routes={routes} />
      <div className={styles.frame}>
        <div className={styles.inner}>
          <main className={styles.main}>
            <div className={styles.header}>
              <h1 className={styles.title}>{page.title}</h1>
              {page.subtitle && <p className={styles.subtitle}>{page.subtitle}</p>}
            </div>
            {page.lead && <p className={styles.lead} dangerouslySetInnerHTML={{ __html: page.lead }} />}
            <div className={styles.body} dangerouslySetInnerHTML={{ __html: page.html }} />
            {children}
          </main>
          <Toc items={toc} locale={page.locale} />
        </div>
        <Footer />
      </div>
    </>
  );
}
