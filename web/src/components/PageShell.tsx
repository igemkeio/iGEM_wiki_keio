import type { ReactNode } from "react";
import type { WikiPage } from "../content";
import type { Route } from "../routes";
import { Footer } from "./Footer";
import styles from "./PageShell.module.css";
import { Sidebar } from "./Sidebar";

// 全ページ共通の枠。中身は children に任せる。
export function PageShell({
  page,
  routes,
  children,
}: {
  page: WikiPage;
  routes: Route[];
  children?: ReactNode;
}) {
  return (
    <>
      <Sidebar page={page} routes={routes} />
      <div className={styles.frame}>
        <div className={styles.inner}>{children}</div>
        <Footer />
      </div>
    </>
  );
}
