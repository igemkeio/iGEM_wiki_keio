import { expect, test } from "../fixtures";

const PATH = "ja/e2e-dbtl/";
const island = '[data-island="dbtl-stage"]';
const top = `${island} header`;
const scrollTop = "#dbtl-box";

test.describe("DBTLの画面", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PATH);
    await expect(page.locator(island)).toHaveAttribute(
      "data-island-mounted",
      ""
    );
    await page.locator("#dbtl-stage").scrollIntoViewIfNeeded();
  });

  test("矢印キーで節を1つずつ移り、箱がスクロールする", async ({ page }) => {
    await expect(page.locator(top)).toContainText("クローニング");
    await expect(page.locator("#dbtl-box [data-dbtl-current]")).toHaveCount(1);
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await expect(page.locator(`${island} aside`)).toContainText("DESIGN");
    await expect
      .poll(() => page.locator(scrollTop).evaluate((el) => el.scrollTop))
      .toBeGreaterThan(0);
    const after = await page
      .locator(scrollTop)
      .evaluate((el) => el.scrollTop as number);
    await page.keyboard.press("ArrowUp");
    await expect
      .poll(() => page.locator(scrollTop).evaluate((el) => el.scrollTop))
      .toBeLessThan(after);
  });

  test("下の絵の3か所と基盤の3つを押すと、そのサイクルへ移る", async ({
    page,
  }) => {
    await page.locator('a[href="#dbtl-cycle-5"] circle').first().click();
    await expect(page.locator(top)).toContainText("接着モジュール");
    await expect(page.locator(`${island} aside`)).toContainText("USING");
    await page.locator(`${island} a[href="#dbtl-cycle-3"]`).click();
    await expect(page.locator(top)).toContainText("画像解析");
    await expect(page.locator(`${island} aside`)).toContainText("TOOLS GAINED");
  });

  test("ステージが画面から外れていれば、矢印キーは箱を動かさない", async ({
    page,
  }) => {
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeLessThan(100);
    const before = await page
      .locator(scrollTop)
      .evaluate((el) => el.scrollTop as number);
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await expect(page.locator(scrollTop)).toHaveJSProperty("scrollTop", before);
  });
});

test.describe("JSを切ったとき", () => {
  test.use({ javaScriptEnabled: false });

  test("6サイクル分の本文が全部読める", async ({ page }) => {
    await page.goto(PATH);
    const box = page.locator("#dbtl-box");
    for (const title of [
      "クローニング",
      "観察系",
      "画像解析",
      "第二の極",
      "接着モジュール",
      "極での架橋",
    ]) {
      await expect(box).toContainText(title);
    }
    await expect(box).toContainText("サイクル6で確立したこと。");
    await expect(page.locator("#dbtl-box [data-dbtl-stop]")).toHaveCount(156);
    // JSが無くても、絵のナビは箱の中のそのサイクルへのリンクとして働く
    await expect(page.locator('a[href="#dbtl-cycle-4"]')).toHaveCount(1);
  });
});
