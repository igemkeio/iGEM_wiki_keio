import { expect, test } from "../fixtures";

const widths = [1280, 375];

// 3Dはauto-rotateで動くので撮らない。prose-sampleは#29がマージされるまで撮らない。
const pages: { name: string; path: string; skip?: string }[] = [
  { name: "home", path: "" },
  { name: "members", path: "members/" },
  { name: "prose-sample", path: "prose-sample/", skip: "#29(prose)が未マージ" },
];

for (const { name, path, skip } of pages) {
  for (const width of widths) {
    test(`${name} ${width}px`, async ({ page }) => {
      test.skip(!!skip, skip);
      await page.setViewportSize({ width, height: 800 });
      await page.goto(path);
      await page.evaluate(() => document.fonts.ready);
      await expect(page).toHaveScreenshot(`${name}-${width}.png`, { fullPage: true });
    });
  }
}
