import { expect, test } from "../fixtures";

const widths = [1280, 375];

// 撮るのはリポジトリ側で原稿を固定している確認用ページだけ。homeとmembersはNotionの原稿で
// 見た目が変わるので撮らない(機能はnavとislandsで見る)。3Dはauto-rotateで動くので撮らない。
const pages: { name: string; path: string }[] = [
  { name: "prose-sample", path: "prose-sample/" },
  { name: "e2e-plain", path: "e2e-plain/" },
];

for (const { name, path } of pages) {
  for (const width of widths) {
    test(`${name} ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(path);
      await page.evaluate(() => document.fonts.ready);
      await expect(page).toHaveScreenshot(`${name}-${width}.png`, {
        fullPage: true,
      });
    });
  }
}
