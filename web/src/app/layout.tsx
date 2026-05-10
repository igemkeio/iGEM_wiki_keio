import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "iGEM Keio",
  description: "iGEM Keio team wiki",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="shortcut icon"
          href="https://static.igem.wiki/common/icons/favicons/igem-2022.svg"
        />
        <link rel="stylesheet" href="/static/bootstrap.min.css" />
        <link rel="stylesheet" href="/static/style.css" />
      </head>
      <body>
        {children}
        <script src="/static/bootstrap.bundle.min.js" defer />
      </body>
    </html>
  );
}
