import type { Page } from "@playwright/test";

import { expect, hrefOf, pathOf, test } from "../../fixtures";
import {
  categoryLabelOf,
  firstPageOf,
  labels,
  locales,
  navConfig,
  pagesOfCategory,
  publishedPages,
} from "../../pages";

for (const locale of locales) {
  const start = locale === "en" ? "" : "ja/";
  const pagesNav = (page: Page) =>
    page.getByRole("navigation", { name: labels[locale].pages });
  const categoryNav = (page: Page) =>
    page.getByRole("navigation", { name: labels[locale].category });

  test(`[${locale}] hover: noneでは、分類のページの2段目からすべてのページへ行ける`, async ({
    page,
    baseURL,
  }) => {
    expect(await page.evaluate(() => matchMedia("(hover: none)").matches)).toBe(
      true
    );
    const articles = publishedPages(locale).filter((p) => p.slug !== "home");
    for (const label of navConfig.categories.map((c) => c.label)) {
      const inCategory = pagesOfCategory(articles, label);
      const [first] = inCategory;
      await page.goto(first.path.slice(1));
      await expect(pagesNav(page)).toBeVisible();
      for (const entry of inCategory) {
        await expect(
          pagesNav(page).locator(`a[href="${hrefOf(entry.path, baseURL)}"]`)
        ).toBeVisible();
      }
      // パネルは使わない
      await expect(categoryNav(page).locator("ul a").first()).toBeHidden();
    }
    // 遷移は、ページ数が最多の分類(2段目が横にあふれる)の最後のページだけ確かめる
    const [largest] = navConfig.categories
      .map((c) => pagesOfCategory(articles, c.label))
      .toSorted((a, b) => b.length - a.length);
    const last = largest.at(-1);
    await page.goto((largest[0]?.path ?? "/").slice(1));
    await pagesNav(page)
      .locator(`a[href="${hrefOf(last?.path ?? "", baseURL)}"]`)
      .click();
    await expect(page).toHaveURL((url) =>
      url.pathname.endsWith(last?.path ?? "")
    );
  });

  test(`[${locale}] Homeでは2段目を出さない`, async ({ page }) => {
    await page.goto(start);
    await expect(pagesNav(page)).toHaveCount(0);
  });

  test(`[${locale}] 2段目は狭い幅で横スクロールになる`, async ({ page }) => {
    const entry = publishedPages(locale).find((p) => p.slug !== "home");
    await page.goto((entry?.path ?? "/").slice(1));
    await expect(pagesNav(page).locator("ul")).toHaveCSS("overflow-x", "auto");
  });

  test(`[${locale}] ロゴと言語の切り替えが375pxでも押せる`, async ({
    page,
    baseURL,
  }) => {
    await page.goto(start);
    const other = locale === "en" ? "ja" : "en";
    await expect(page.locator(`header a[hreflang=${other}]`)).toBeVisible();
    await page.locator(`header a[hreflang=${other}]`).click();
    await expect(page).toHaveURL(
      (url) => pathOf(url.href, baseURL) === (other === "en" ? "/" : "/ja/")
    );
    await page.locator("header a", { hasText: "iGEM" }).click();
    await expect(page).toHaveURL(
      (url) => pathOf(url.href, baseURL) === (other === "en" ? "/" : "/ja/")
    );
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
    const lastLabel = navConfig.categories.at(-1)?.label ?? "";
    const target = firstPageOf(
      publishedPages(locale).filter((p) => categoryLabelOf(p.slug)),
      lastLabel
    );
    expect(target).toBeDefined();
    await expect(page).toHaveURL((url) =>
      url.pathname.endsWith(target?.path ?? "")
    );
  });
}
