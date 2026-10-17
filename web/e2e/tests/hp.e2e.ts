import { expect, test } from "../fixtures";

const PATH = "ja/e2e-hp/";

test.describe("Human Practicesの画面", () => {
  test("帯のリンクで用途の面に飛べる", async ({ page }) => {
    await page.goto(PATH);
    await page
      .locator('nav[aria-label="Human Practices"] a[href="#hp-2-2"]')
      .click();
    await expect(page).toHaveURL(/#hp-2-2$/u);
    // 飛び先のセクションの上端が、固定ヘッダーと貼り付く帯の下に来る
    await expect
      .poll(() =>
        page.evaluate(() => {
          const top =
            document.querySelector("#hp-2-2")?.getBoundingClientRect().top ?? 0;
          const bar =
            document
              .querySelector('nav[aria-label="Human Practices"]')
              ?.getBoundingClientRect().bottom ?? 0;
          return top - bar;
        })
      )
      .toBeGreaterThanOrEqual(0);
  });

  test("左の目次を出さず、横スクロールも出ない", async ({ page }) => {
    await page.goto(PATH);
    await expect(page.locator("aside")).toHaveCount(0);
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth
    );
    expect(overflow).toBe(0);
  });
});

test.describe("JSを切ったとき", () => {
  test.use({ javaScriptEnabled: false });

  test("面談と仮の節の全文が読める", async ({ page }) => {
    await page.goto(PATH);
    const main = page.locator("main");
    for (const text of [
      "目的2.1.A。",
      "持ち帰り1.1。",
      "原稿が未確定",
      "強度の本文。",
      "謝辞の本文。",
    ]) {
      await expect(main).toContainText(text);
    }
    await expect(main).not.toContainText("hpが読めたときは出ない本文");
  });
});
