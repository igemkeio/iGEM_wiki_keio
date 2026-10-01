import { expect, hrefOf, test } from "../../fixtures";
import { labels, locales, publishedPages } from "../../pages";

for (const locale of locales) {
  const start = locale === "en" ? "" : "ja/";
  const nav = (page: import("@playwright/test").Page) => page.getByRole("navigation", { name: labels[locale].nav });

  test(`[${locale}] 375pxでは上部バーのトグルでナビが開閉する`, async ({ page }) => {
    await page.goto(start);
    const toggle = page.getByLabel(labels[locale].menu, { exact: true });
    await expect(toggle).toBeVisible();
    await expect(nav(page)).toBeHidden();
    await toggle.click();
    await expect(nav(page)).toBeVisible();
    await toggle.click();
    await expect(nav(page)).toBeHidden();
  });

  test(`[${locale}] 開いたナビに、publishedな全ページへのリンクがある`, async ({ page, baseURL }) => {
    await page.goto(start);
    await page.getByLabel(labels[locale].menu, { exact: true }).click();
    for (const entry of publishedPages(locale)) {
      await expect(nav(page).locator(`a[href="${hrefOf(entry.path, baseURL)}"]`)).toBeVisible();
    }
  });
}
