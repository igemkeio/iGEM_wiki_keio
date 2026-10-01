import { expect, hrefOf, pathOf, test } from "../fixtures";
import { labels, locales, publishedPages } from "../pages";

for (const locale of locales) {
  const pages = publishedPages(locale);
  const start = locale === "en" ? "" : "ja/";

  test(`[${locale}] ヘッダーのナビから、publishedな全ページに着く`, async ({
    page,
    baseURL,
  }) => {
    expect(pages.length).toBeGreaterThan(1);
    for (const entry of pages) {
      await page.goto(start);
      const link = page
        .getByRole("navigation", { name: labels[locale].nav })
        .locator(`a[href="${hrefOf(entry.path, baseURL)}"]`);
      await link.click();
      await expect(page).toHaveURL(
        (url) => pathOf(url.href, baseURL) === entry.path
      );
      await expect(page).toHaveTitle(`${entry.title} | iGEM Keio 2026`);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("h1")).toHaveText(entry.title);
    }
  });

  test(`[${locale}] aria-currentが現在のページのリンクだけに付く`, async ({
    page,
    baseURL,
  }) => {
    for (const entry of pages) {
      await page.goto(entry.path.slice(1));
      const current = page
        .getByRole("navigation", { name: labels[locale].nav })
        .locator('a[aria-current="page"]');
      await expect(current).toHaveCount(1);
      await expect(current).toHaveAttribute(
        "href",
        hrefOf(entry.path, baseURL)
      );
    }
  });
}
