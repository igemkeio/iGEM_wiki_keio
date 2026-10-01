import type { Page } from "@playwright/test";
import { expect, test } from "../fixtures";

const chunk = /\/assets\/model-viewer-[\w-]+\.js/;
const glb = /\.glb(\?|$)/;

function track(page: Page) {
  const urls: string[] = [];
  page.on("request", (request) => urls.push(request.url()));
  return {
    chunks: () => urls.filter((url) => chunk.test(url)),
    glbs: () => urls.filter((url) => glb.test(url)),
  };
}

test.use({ viewport: { width: 1280, height: 400 } });

test("画面外のあいだは読み込まず、近づくとチャンクと.glbを1件ずつ取って表示する", async ({ page }) => {
  const requests = track(page);
  await page.goto("e2e-model/");
  const island = page.locator('[data-island="model-viewer"]');
  await expect(island).toHaveAttribute("data-island-mounted", "");
  await expect(island.locator("img")).toBeAttached();
  await page.waitForLoadState("networkidle");
  expect(requests.chunks()).toHaveLength(0);
  expect(requests.glbs()).toHaveLength(0);

  await island.scrollIntoViewIfNeeded();
  await expect.poll(() => requests.chunks().length, { timeout: 15_000 }).toBe(1);
  await expect.poll(() => requests.glbs().length, { timeout: 15_000 }).toBe(1);
  const viewer = page.locator("model-viewer");
  await expect(viewer).toBeAttached();
  await expect.poll(() => viewer.evaluate((el) => (el as HTMLElement & { loaded: boolean }).loaded), { timeout: 30_000 }).toBe(true);
});

test("WebGLが使えないときはposterを出し、チャンクも.glbも取らない", async ({ page }) => {
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = () => null;
  });
  const requests = track(page);
  await page.goto("e2e-model/");
  const island = page.locator('[data-island="model-viewer"]');
  await island.scrollIntoViewIfNeeded();
  await expect(island.locator("img")).toBeVisible();
  await page.waitForLoadState("networkidle");
  expect(requests.chunks()).toHaveLength(0);
  expect(requests.glbs()).toHaveLength(0);
  await expect(page.locator("model-viewer")).toHaveCount(0);
});
