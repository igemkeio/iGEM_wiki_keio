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

  for (const size of [
    { width: 375, height: 812 },
    { width: 812, height: 375 },
  ]) {
    test(`[${locale}] ${size.width}x${size.height}では、スクロールするとヘッダーが画面の外へ流れ、移った見出しが上端に隠れない`, async ({
      page,
    }) => {
      await page.setViewportSize(size);
      await page.goto(`${start}description/`);
      expect(
        await page.evaluate(() => matchMedia("(hover: none)").matches)
      ).toBe(true);
      await expect(page.locator("header")).toHaveCSS("position", "relative");
      await page.evaluate(() => window.scrollTo(0, 900));
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(900);
      // 2段目を含むヘッダー全体が画面の上へ出ている
      const bottom = await page
        .locator("header")
        .evaluate((el) => el.getBoundingClientRect().bottom);
      expect(bottom).toBeLessThanOrEqual(0);
      // 見出しへのリンクで移っても、画面の上端に隠れない
      const id = await page
        .locator("main h2[id]")
        .nth(2)
        .evaluate((el) => el.id);
      await page.goto(`${start}description/#${id}`);
      const box = await page.locator(`[id="${id}"]`).boundingBox();
      expect(box?.y ?? -1).toBeGreaterThanOrEqual(0);
      await expect(page.locator(`[id="${id}"]`)).toBeInViewport();
    });
  }

  test(`[${locale}] hover: noneで幅を動かしても、scroll-padding-topが2段目を含むヘッダーの高さ以上(スクロールバー分の遅れも見込む)になる`, async ({
    page,
  }) => {
    await page.goto(`${start}description/`);
    // 幅wのscroll-padding-topが、幅wと幅w-20(スクロールバーで折り返しが遅れる分)のヘッダーの高さ以上か
    const sizes = new Map<number, { padding: number; header: number }>();
    for (let width = 768; width <= 1500; width += 10) {
      await page.setViewportSize({ width, height: 812 });
      sizes.set(
        width,
        await page.evaluate(() => ({
          padding: Number(
            getComputedStyle(document.documentElement).scrollPaddingTop.replace(
              "px",
              ""
            )
          ),
          header:
            document.querySelector("header")?.getBoundingClientRect().height ??
            0,
        }))
      );
    }
    const short: { width: number; padding: number; header: number }[] = [];
    for (const [width, size] of sizes) {
      // 1280pxで1段になる切り替えはmedia queryで決まり、スクロールバーで遅れない
      const lagged =
        width >= 1280 && width < 1300 ? undefined : sizes.get(width - 20);
      const tallest = Math.max(size.header, lagged?.header ?? 0);
      if (size.padding < tallest) {
        short.push({ width, padding: size.padding, header: tallest });
      }
    }
    expect(short).toStrictEqual([]);
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
