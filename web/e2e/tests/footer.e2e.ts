import type { Locator, Page } from "@playwright/test";

import { expect, test } from "../fixtures";
import { locales, publishedPages } from "../pages";

const footer = (page: Page) => page.locator("footer");
const track = (page: Page) => page.locator("[data-sponsors-track]");

// 各ロゴの左端と、いまのスクロール位置。1枚ずつ送れていることを位置で確かめる。
const offsets = (locator: Locator) =>
  locator.evaluate((el) =>
    [...el.children].map((child) => (child as HTMLElement).offsetLeft)
  );
const maxScroll = (locator: Locator) =>
  locator.evaluate((el) => el.scrollWidth - el.clientWidth);
const scrollLeft = (locator: Locator) =>
  locator.evaluate((el) => Math.round(el.scrollLeft));

const settledAt = (locator: Locator, expected: number) =>
  expect.poll(() => scrollLeft(locator)).toBe(expected);

test.describe("フッターの3段", () => {
  for (const locale of locales) {
    for (const entry of publishedPages(locale)) {
      test(`${entry.path} に3段が出る`, async ({ page }) => {
        await page.goto(entry.path.replace(/^\//u, ""));
        const f = footer(page);
        await expect(f.locator('a[href^="mailto:"]')).toHaveCount(1);
        await expect(
          f.getByRole("list", { name: /Social|SNS/u })
        ).toBeVisible();
        await expect(f.locator("[data-sponsors-track] img")).toHaveCount(6);
        await expect(f.getByText("CC BY 4.0")).toBeVisible();
        await expect(
          f.locator('a[href="https://gitlab.igem.org/2026/keio"]')
        ).toBeVisible();
      });
    }
  }
});

test.describe("スポンサーの帯", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.clock.install();
    await page.goto("e2e-plain/");
    await track(page).scrollIntoViewIfNeeded();
    await expect(page.locator("[data-sponsors-prev]")).toBeVisible();
  });

  test("3秒ごとに1枚ずつ左へ送られ、最後から先頭へ戻る", async ({ page }) => {
    const t = track(page);
    const [, second] = await offsets(t);
    const end = await maxScroll(t);
    expect(end).toBeGreaterThan(second);
    await page.clock.runFor(2900);
    expect(await scrollLeft(t)).toBe(0);
    await page.clock.runFor(100);
    await settledAt(t, second);
    await page.clock.runFor(3000);
    await settledAt(t, end);
    await page.clock.runFor(3000);
    await settledAt(t, 0);
  });

  test("ボタンで1枚ずつ前後に送れ、キーボードでも押せる", async ({ page }) => {
    const t = track(page);
    const [, second] = await offsets(t);
    const next = page.getByRole("button", { name: "Next" });
    const prev = page.getByRole("button", { name: "Previous" });
    await next.click();
    await settledAt(t, second);
    await prev.click();
    await settledAt(t, 0);
    await next.focus();
    await page.keyboard.press("Enter");
    await settledAt(t, second);
    await page.keyboard.press("Space");
    const all = await offsets(t);
    const third = all.at(2) ?? 0;
    await settledAt(t, Math.min(third, await maxScroll(t)));
  });

  test("ホバー中は自動で送られず、外れると再開する", async ({ page }) => {
    const t = track(page);
    const [, second] = await offsets(t);
    const box = await t.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.move((box?.x ?? 0) + 20, (box?.y ?? 0) + 20);
    await page.clock.runFor(9000);
    expect(await scrollLeft(t)).toBe(0);
    await page.mouse.move(2, 2);
    await page.clock.runFor(3000);
    await settledAt(t, second);
  });

  test("帯の中にフォーカスがある間は自動で送られない", async ({ page }) => {
    const t = track(page);
    await page.getByRole("button", { name: "Next" }).focus();
    await page.clock.runFor(9000);
    expect(await scrollLeft(t)).toBe(0);
    await page.getByRole("button", { name: "Next" }).blur();
    await page.clock.runFor(3000);
    await expect.poll(() => scrollLeft(t)).toBeGreaterThan(0);
  });
});

test.describe("prefers-reduced-motion", () => {
  test("自動では送られないが、ボタンでは送れる", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.clock.install();
    await page.goto("e2e-plain/");
    const t = track(page);
    const [, second] = await offsets(t);
    await page.clock.runFor(12_000);
    expect(await scrollLeft(t)).toBe(0);
    await page.getByRole("button", { name: "Next" }).click();
    await settledAt(t, second);
  });
});

test.describe("JSを切ったとき", () => {
  test.use({ javaScriptEnabled: false });

  test("ボタンは出ず、横スクロールでロゴを全部見られる", async ({ page }) => {
    await page.goto("e2e-plain/");
    await expect(page.locator("[data-sponsors-prev]")).toBeHidden();
    await expect(page.locator("[data-sponsors-next]")).toBeHidden();
    const t = track(page);
    const scrollable = await t.evaluate((el) => ({
      overflow: getComputedStyle(el).overflowX,
      wider: el.scrollWidth > el.clientWidth,
    }));
    expect(scrollable).toStrictEqual({ overflow: "auto", wider: true });
    const pageOverflows = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(pageOverflows).toBe(false);
    await t.scrollIntoViewIfNeeded();
    const last = t.locator("li").last();
    await t.evaluate((el) => {
      el.scrollLeft = el.scrollWidth;
    });
    await expect(last).toBeInViewport({ ratio: 1 });
  });
});

test("増えるJSはフッター用の1ファイルだけで、Reactのチャンクは読まれない", async ({
  page,
}) => {
  const scripts: string[] = [];
  page.on("request", (request) => {
    if (
      request.resourceType() === "script" ||
      /\.m?js(\?|$)/u.test(request.url())
    ) {
      scripts.push(new URL(request.url()).pathname);
    }
  });
  await page.goto("e2e-plain/");
  await page.waitForLoadState("networkidle");
  expect(scripts).toHaveLength(1);
  expect(scripts[0]).toMatch(/\/footer-sponsors\.js$/u);
  await expect(page.locator("script")).toHaveCount(1);
});
