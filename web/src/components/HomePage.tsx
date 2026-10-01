import type { WikiPage } from "../content";
import type { Route } from "../routes";
import styles from "./HomePage.module.css";

// ヒーローとContentsのカードを持つHome専用の本文。
export function HomePage({ page }: { page: WikiPage; routes: Route[] }) {
  return (
    <main className={styles.main}>
      <h1 className={styles.visuallyHidden}>{page.title}</h1>
    </main>
  );
}
