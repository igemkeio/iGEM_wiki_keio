import type { Page } from "@playwright/test";

import { expect, pathOf, test } from "../fixtures";

const stored = (page: Page) =>
  page.evaluate(() => localStorage.getItem("wiki:locale"));

test("JAに切り替えると、移る先の言語がlocalStorageに保存される", async ({
  page,
  baseURL,
}) => {
  await page.goto("members/");
  await expect(page.locator("[data-island-mounted]")).toHaveCount(1);
  expect(await stored(page)).toBeNull();
  await page.locator("a[hreflang=ja]").click();
  await expect(page).toHaveURL(
    (url) => pathOf(url.href, baseURL) === "/ja/members/"
  );
  expect(await stored(page)).toBe('"ja"');
  await page.goto("ja/");
  expect(await stored(page)).toBe('"ja"');
});

test("相手の言語に同じslugがあれば、そのページに切り替わる", async ({
  page,
  baseURL,
}) => {
  await page.goto("e2e-plain/");
  await expect(page.locator("a[hreflang=ja]")).toHaveAttribute(
    "href",
    /\/ja\/e2e-plain\/$/u
  );
  await page.locator("a[hreflang=ja]").click();
  await expect(page).toHaveURL(
    (url) => pathOf(url.href, baseURL) === "/ja/e2e-plain/"
  );
});

test("相手の言語に無いslugのページでは、切り替え先が相手の言語のhomeになる", async ({
  page,
  baseURL,
}) => {
  await page.goto("e2e-model/");
  const link = page.locator("a[hreflang=ja]");
  await expect(link).toHaveAttribute("href", /\/ja\/$/u);
  await link.click();
  await expect(page).toHaveURL((url) => pathOf(url.href, baseURL) === "/ja/");
});
