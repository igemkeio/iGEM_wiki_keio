import type { Page } from "@playwright/test";

import { expect, test } from "../fixtures";

function trackScripts(page: Page) {
  const urls: string[] = [];
  page.on("request", (request) => {
    if (
      request.resourceType() === "script" ||
      /\.m?js(\?|$)/u.test(request.url())
    ) {
      urls.push(request.url());
    }
  });
  return urls;
}

for (const path of ["", "e2e-plain/"]) {
  test(`島のないページ(/${path})では、フッター用のJSの他にscriptタグもJSのリクエストも無い`, async ({
    page,
  }) => {
    const scripts = trackScripts(page);
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("script")).toHaveCount(1);
    await expect(page.locator("script")).toHaveAttribute(
      "src",
      /\/footer-sponsors\.js$/u
    );
    expect(scripts).toHaveLength(1);
    expect(scripts[0]).toMatch(/\/footer-sponsors\.js$/u);
  });
}

test.describe("/members/ のモーダル", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("members/");
    await expect(page.locator('[data-island="member-list"]')).toHaveAttribute(
      "data-island-mounted",
      ""
    );
    await page.locator('[data-island="member-list"] ul button').first().click();
    await expect(page.locator("dialog")).toBeVisible();
  });

  test("Escで閉じる", async ({ page }) => {
    await page.keyboard.press("Escape");
    await expect(page.locator("dialog")).toBeHidden();
  });

  test("オーバーレイのクリックで閉じる", async ({ page }) => {
    await page.mouse.click(4, 4);
    await expect(page.locator("dialog")).toBeHidden();
  });

  test("閉じるボタンで閉じる", async ({ page }) => {
    await page.locator("dialog button").first().click();
    await expect(page.locator("dialog")).toBeHidden();
  });
});

test("/members/ のリクエストにmodel-viewerのチャンクもModelViewerの部品も無い", async ({
  page,
}) => {
  const scripts = trackScripts(page);
  await page.goto("members/");
  await expect(
    page.locator('[data-island="member-list"] ul button').first()
  ).toBeVisible();
  await page.waitForLoadState("networkidle");
  expect(scripts.length).toBeGreaterThan(0);
  expect(
    scripts.filter((url) => /model-?viewer-[\w-]+\.js/iu.test(url))
  ).toEqual([]);
});
