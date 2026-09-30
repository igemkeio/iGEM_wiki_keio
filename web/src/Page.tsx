import { withBase } from "./base";
import { PageShell } from "./components/PageShell";
import type { WikiPage } from "./content";
import type { Route } from "./routes";

// vite.config.tsのdefineで埋まる。未指定のときは空文字で、配信パス配下の/fontsを使う。
declare const __WIKI_FONT_BASE__: string;
const fontBase = __WIKI_FONT_BASE__ || withBase("/fonts");

export type Assets = {
  css: string[];
  // 島を使うページに読み込むブラウザ側のJS。
  js: string;
};

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
        <link rel="stylesheet" href={`${fontBase}/fonts.css`} />
        {assets.css.map((file) => (
          <link key={file} rel="stylesheet" href={withBase(`/${file}`)} />
        ))}
      </head>
      <body>
        <PageShell page={page} routes={routes} />
        {page.islands.length > 0 && (
          <script type="module" src={withBase(`/${assets.js}`)} />
        )}
      </body>
    </html>
  );
}
