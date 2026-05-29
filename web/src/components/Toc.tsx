import type { TocEntry } from "@/lib/toc";

// 左サイドバーに表示する目次ナビ。h2を一覧し、配下のh3をインデント表示する。
export default function Toc({ entries }: { entries: TocEntry[] }) {
  return (
    <nav className="wiki-toc" aria-label="On this page">
      <p className="wiki-toc__title">On this page</p>
      <ul className="wiki-toc__list">
        {entries.map((e) => (
          <li key={e.id} className="wiki-toc__item">
            <a className="wiki-toc__link" href={`#${e.id}`}>
              {e.text}
            </a>
            {e.children.length > 0 && (
              <ul className="wiki-toc__sublist">
                {e.children.map((c) => (
                  <li key={c.id} className="wiki-toc__subitem">
                    <a className="wiki-toc__link wiki-toc__link--sub" href={`#${c.id}`}>
                      {c.text}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
