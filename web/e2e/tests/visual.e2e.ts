import { expect, test } from "../fixtures";

const widths = [1280, 375];

// 3Dはauto-rotateで動くので撮らない。
const pages: { name: string; path: string }[] = [
  { name: "home", path: "" },
  { name: "members", path: "members/" },
  { name: "prose-sample", path: "prose-sample/" },
];

for (const { name, path } of pages) {
  for (const width of widths) {
    test(`${name} ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(path);
      await page.evaluate(() => document.fonts.ready);
      await expect(page).toHaveScreenshot(`${name}-${width}.png`, { fullPage: true });
    });
  }
}
