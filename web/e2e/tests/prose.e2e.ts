import { expect, test } from "../fixtures";

test("prose-sampleで、FigureカードとNoteとKaTeXが描画される", async ({
  page,
}) => {
  await page.goto("prose-sample/");
  await expect(page.locator(".figure-card")).toBeVisible();
  await expect(page.locator(".note")).toBeVisible();
  await expect(page.locator(".katex").first()).toBeVisible();
  const fontLoaded = await page.evaluate(async () => {
    await document.fonts.ready;
    return [...document.fonts].some(
      (font) => font.family.startsWith("KaTeX") && font.status === "loaded"
    );
  });
  expect(fontLoaded).toBe(true);
});
