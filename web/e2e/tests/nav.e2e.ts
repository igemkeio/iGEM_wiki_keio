import type { Page } from "@playwright/test";

import { expect, hrefOf, pathOf, test } from "../fixtures";
import {
  categoryLabelOf,
  firstPageOf,
  labels,
  locales,
  navConfig,
  pagesOfCategory,
  publishedPages,
} from "../pages";

const categoryLabels = navConfig.categories.map((c) => c.label);

for (const locale of locales) {
  const pages = publishedPages(locale);
  const articles = pages.filter((p) => p.slug !== "home");
  const start = locale === "en" ? "" : "ja/";
  const sidebar = (page: Page) =>
    page.getByRole("navigation", { name: labels[locale].nav });
  const header = (page: Page) =>
    page.getByRole("navigation", { name: labels[locale].category });

  test(`[${locale}] Homeのナビから、publishedな全ページに着く`, async ({
    page,
    baseURL,
  }) => {
    // 全ページを順に開くので、制限時間はページ数に比例させる(1ページ5秒の見積もり)。
    test.setTimeout(30_000 + 5000 * pages.length);
    expect(articles.length).toBeGreaterThan(1);
    for (const entry of articles) {
      await page.goto(start);
      const link = sidebar(page).locator(
        `a[href="${hrefOf(entry.path, baseURL)}"]`
      );
      await link.click();
      await expect(page).toHaveURL(
        (url) => pathOf(url.href, baseURL) === entry.path
      );
      await expect(page).toHaveTitle(`${entry.title} | iGEM Keio 2026`);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("h1")).toHaveText(entry.title);
    }
  });

  test(`[${locale}] Homeのナビは全分類を見出し付きで並べる`, async ({
    page,
  }) => {
    await page.goto(start);
    for (const label of categoryLabels) {
      await expect(
        sidebar(page).locator("p", { hasText: label })
      ).toBeVisible();
    }
  });

  test(`[${locale}] aria-currentが現在のページのリンクだけに付く`, async ({
    page,
    baseURL,
  }) => {
    for (const entry of articles) {
      await page.goto(entry.path.slice(1));
      const current = sidebar(page).locator('a[aria-current="page"]');
      await expect(current).toHaveCount(1);
      await expect(current).toHaveAttribute(
        "href",
        hrefOf(entry.path, baseURL)
      );
    }
    await page.goto(start);
    await expect(page.locator('header a[aria-current="page"]')).toHaveAttribute(
      "href",
      hrefOf(locale === "en" ? "/" : "/ja/", baseURL)
    );
  });

  test(`[${locale}] Sidebarには同じ分類のページだけが並ぶ`, async ({
    page,
    baseURL,
  }) => {
    for (const entry of articles) {
      await page.goto(entry.path.slice(1));
      const label = categoryLabelOf(entry.slug);
      // Project以外の分類のページが無いことと、同じ分類のページが揃うことを見る。
      // 分類に載らない確認用ページ(PRERENDER_ALLで出る)はProjectに並ぶので、数は固定しない。
      for (const p of articles) {
        await expect(
          sidebar(page).locator(`a[href="${hrefOf(p.path, baseURL)}"]`)
        ).toHaveCount(categoryLabelOf(p.slug) === label ? 1 : 0);
      }
    }
  });

  test(`[${locale}] Sidebarの並びは対応表の順になる`, async ({
    page,
    baseURL,
  }) => {
    const published = new Set(articles.map((p) => hrefOf(p.path, baseURL)));
    for (const label of categoryLabels) {
      const expected = pagesOfCategory(articles, label).map((p) =>
        hrefOf(p.path, baseURL)
      );
      await page.goto(expected[0].slice(hrefOf("/", baseURL).length));
      // 確認用ページ(PRERENDER_ALLで出る)はProjectの末尾に混ざるので、公開ページだけを比べる
      const hrefs = await sidebar(page)
        .getByRole("link")
        .evaluateAll((els) => els.map((el) => el.getAttribute("href") ?? ""));
      expect(hrefs.filter((h) => published.has(h))).toStrictEqual(expected);
    }
  });

  test(`[${locale}] ヘッダーの大腸菌は5匹で、いまの分類だけが現在地になる`, async ({
    page,
  }) => {
    for (const entry of pages) {
      await page.goto(entry.path.slice(1));
      const links = header(page).getByRole("link");
      await expect(links).toHaveText(categoryLabels);
      const label = categoryLabelOf(entry.slug);
      const current = header(page).locator("a[aria-current]");
      await (label
        ? expect(current).toHaveText(label)
        : expect(current).toHaveCount(0));
    }
  });

  test(`[${locale}] ヘッダーの大腸菌は分類の先頭のページに移り、キーボードで操作できる`, async ({
    page,
    baseURL,
  }) => {
    await page.goto(start);
    const links = header(page).getByRole("link");
    const first = links.first();
    const href = await first.getAttribute("href");
    const target = firstPageOf(articles, categoryLabels[0]);
    expect(href).toBe(hrefOf(target?.path ?? "", baseURL));
    await first.focus();
    await expect(first).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(links.nth(1)).toBeFocused();
    await first.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL((url) => url.pathname === href);
  });

  for (const width of [768, 900, 1000, 1100]) {
    test(`[${locale}] ${width}px幅でも、ヘッダーの5匹がサイドバーに隠れず押せる`, async ({
      page,
      baseURL,
    }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(start);
      const links = header(page).getByRole("link");
      await expect(links).toHaveCount(5);
      for (const link of await links.all()) {
        const box = await link.boundingBox();
        expect(box?.x ?? -1).toBeGreaterThanOrEqual(0);
        expect((box?.x ?? width) + (box?.width ?? width)).toBeLessThanOrEqual(
          width
        );
        // 中央の点がリンク自身で、固定サイドバーなどに覆われていない
        const covered = await link.evaluate((el) => {
          const r = el.getBoundingClientRect();
          const top = document.elementFromPoint(
            r.x + r.width / 2,
            r.y + r.height / 2
          );
          return !(top && el.contains(top));
        });
        expect(covered).toBe(false);
      }
      await links.last().click();
      const target = firstPageOf(articles, categoryLabels.at(-1) ?? "");
      expect(target).toBeDefined();
      await expect(page).toHaveURL(
        (url) => pathOf(url.href, baseURL) === target?.path
      );
    });
  }
}
