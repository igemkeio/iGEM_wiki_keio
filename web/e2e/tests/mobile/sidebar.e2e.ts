import type { Page } from "@playwright/test";

import { expect, hrefOf, test } from "../../fixtures";
import { labels, locales, publishedPages } from "../../pages";

for (const locale of locales) {
  const start = locale === "en" ? "" : "ja/";
  const nav = (page: Page) =>
    page.getByRole("navigation", { name: labels[locale].nav });

  test(`[${locale}] 375pxでは上部バーのトグルでナビが開閉する`, async ({
    page,
  }) => {
    await page.goto(start);
    const toggle = page.getByLabel(labels[locale].menu, { exact: true });
    await expect(toggle).toBeVisible();
    await expect(nav(page)).toBeHidden();
    await toggle.click();
    await expect(nav(page)).toBeVisible();
    await toggle.click();
    await expect(nav(page)).toBeHidden();
  });

  test(`[${locale}] 開いたHomeのナビに、home以外のpublishedな全ページへのリンクがある`, async ({
    page,
    baseURL,
  }) => {
    await page.goto(start);
    await page.getByLabel(labels[locale].menu, { exact: true }).click();
    for (const entry of publishedPages(locale).filter(
      (p) => p.slug !== "home"
    )) {
      await expect(
        nav(page).locator(`a[href="${hrefOf(entry.path, baseURL)}"]`)
      ).toBeVisible();
    }
  });

  test(`[${locale}] ヘッダーの5分類すべてが375pxの幅に収まり、末尾にも届く`, async ({
    page,
  }) => {
    await page.goto(start);
    const links = page
      .getByRole("navigation", { name: labels[locale].category })
      .getByRole("link");
    await expect(links).toHaveCount(5);
    const width = page.viewportSize()?.width ?? 375;
    for (const link of await links.all()) {
      const box = await link.boundingBox();
      expect(box?.x ?? -1).toBeGreaterThanOrEqual(0);
      expect((box?.x ?? width) + (box?.width ?? width)).toBeLessThanOrEqual(
        width
      );
    }
    await links.last().click();
    await expect(page).toHaveURL(/attributions\/$/u);
  });
}
