import { withBase } from "./base";
import type { WikiPage } from "./content";

export type Assets = {
  css: string[];
  // 島を使うページに読み込むブラウザ側の JS。
  js: string;
};

export function Page({ page, assets }: { page: WikiPage; assets: Assets }) {
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
        <h1>{page.title}</h1>
        {page.subtitle && <p>{page.subtitle}</p>}
        {page.lead && <p dangerouslySetInnerHTML={{ __html: page.lead }} />}
        <div dangerouslySetInnerHTML={{ __html: page.html }} />
        {page.islands.length > 0 && (
          <script type="module" src={withBase(`/${assets.js}`)} />
        )}
      </body>
    </html>
  );
}
