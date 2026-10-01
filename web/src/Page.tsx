import { withBase } from "./base";
import { ArticlePage } from "./components/ArticlePage";
import { HomePage } from "./components/HomePage";
import { PageShell } from "./components/PageShell";
import type { WikiPage } from "./content";
import { ISLANDS } from "./islands";
import type { Route } from "./routes";

export interface Assets {
  css: string[];
  // 島を使うページに読み込むブラウザ側のJS。
  js: string;
}

export function Page({
  page,
  routes,
  assets,
}: {
  page: WikiPage;
  // ナビと言語切り替えに使うページ一覧。
  routes: Route[];
  assets: Assets;
}) {
  return (
    <html lang={page.locale}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{`${page.title} | iGEM Keio 2026`}</title>
        {assets.css.map((file) => (
          <link key={file} rel="stylesheet" href={withBase(`/${file}`)} />
        ))}
      </head>
      <body>
        <PageShell page={page} routes={routes}>
          {page.slug === "home" ? (
            <HomePage page={page} routes={routes} />
          ) : (
            <ArticlePage page={page} />
          )}
        </PageShell>
        {page.islands.some((name) => name in ISLANDS) && (
          <script type="module" src={withBase(`/${assets.js}`)} />
        )}
      </body>
    </html>
  );
}
