import Header from "./Header";
import Footer from "./Footer";
import Toc from "./Toc";
import { buildToc } from "@/lib/toc";
import type { Locale } from "@/lib/wiki";

export default function PageShell({
  locale,
  slug,
  title,
  lead,
  contentHtml,
}: {
  locale: Locale;
  slug: string;
  title: string;
  lead: string;
  contentHtml: string;
}) {
  // 本文の見出しから目次を生成し、見出しにはアンカー用idを付与する。
  const { html, toc } = buildToc(contentHtml);
  const hasToc = toc.length > 0;

  return (
    <>
      <Header locale={locale} currentSlug={slug} />
      <header className="bg-hero py-5 mb-5">
        <div className="container h-100">
          <div className="row h-100 align-items-center">
            <div className="col-lg-12">
              <h1 className="display-4 text-white mt-5 mb-2">{title}</h1>
              <p className="lead mb-5 text-white-50" dangerouslySetInnerHTML={{ __html: lead }} />
            </div>
          </div>
        </div>
      </header>
      <div className="container">
        <div className="row">
          {hasToc && (
            <aside className="col-lg-3 d-none d-lg-block">
              <Toc entries={toc} />
            </aside>
          )}
          <div
            className={hasToc ? "col-lg-9" : "col-12"}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
      <Footer />
    </>
  );
}
