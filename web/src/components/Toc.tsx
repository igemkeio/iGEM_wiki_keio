import type { Locale } from "../content";
import type { TocItem } from "../lib/toc";
import styles from "./Toc.module.css";

const titles: Record<Locale, string> = { en: "On this page", ja: "目次" };

export function Toc({ items, locale }: { items: TocItem[]; locale: Locale }) {
  if (items.length === 0) return null;
  return (
    <aside className={styles.root}>
      <nav aria-label={titles[locale]}>
        <p className={styles.title}>{titles[locale]}</p>
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.id}>
              <a href={`#${item.id}`}>{item.text}</a>
              {item.children.length > 0 && (
                <ul className={styles.sub}>
                  {item.children.map((child) => (
                    <li key={child.id}>
                      <a href={`#${child.id}`}>{child.text}</a>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
