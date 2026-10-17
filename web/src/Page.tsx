import { withBase } from "./base";
import { ArticlePage } from "./components/ArticlePage";
import { DescriptionPage } from "./components/DescriptionPage";
import { HomePage } from "./components/HomePage";
import { PageShell } from "./components/PageShell";
import type { WikiPage } from "./content";
import { ISLANDS } from "./islands";
import paletteSwitcher from "./palette-switcher.ts?raw";
import type { Route } from "./routes";

export interface Assets {
  css: string[];
  // 島を使うページに読み込むブラウザ側のJS。
  js: string;
}

function Body({ page, routes }: { page: WikiPage; routes: Route[] }) {
  if (page.slug === "home") {
    return <HomePage page={page} routes={routes} />;
  }
  if (page.slug === "description" && page.locale === "ja") {
    return <DescriptionPage page={page} />;
  }
  return <ArticlePage page={page} />;
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
        {import.meta.env.WIKI_PALETTE_SWITCHER === "1" && (
          <script
            data-palette-switcher=""
            dangerouslySetInnerHTML={{ __html: paletteSwitcher }}
          />
        )}
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{`${page.title} | iGEM Keio 2026`}</title>
        {assets.css.map((file) => (
          <link key={file} rel="stylesheet" href={withBase(`/${file}`)} />
        ))}
      </head>
      <body>
        <PageShell page={page} routes={routes}>
          <Body page={page} routes={routes} />
        </PageShell>
        <script src={withBase("/footer-sponsors.js")} defer />
        {page.islands.some((name) => name in ISLANDS) && (
          <script type="module" src={withBase(`/${assets.js}`)} />
        )}
      </body>
    </html>
  );
}
