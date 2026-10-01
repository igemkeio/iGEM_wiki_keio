import { defineConfig, devices } from "@playwright/test";

const ci = !!process.env.CI;
const previewPort = 4173;
const basePort = 4174;

// ヘッドレスでWebGLを使えるようにする。
const launchOptions = {
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
};

// base付き(/keio/)のprojectでも流す、配信パスに依存するテスト。
const baseSensitive = /(nav|locale|islands|model-viewer)\.e2e\.ts$/u;

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.e2e.ts",
  outputDir: "./test-results",
  // 基準画像はOSをファイル名に含めず、全環境で同じ画像と比べる。
  snapshotPathTemplate:
    "{testDir}/{testFilePath}-snapshots/{arg}-{projectName}{ext}",
  fullyParallel: true,
  forbidOnly: ci,
  retries: ci ? 1 : 0,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "./playwright-report" }],
  ],
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.02, animations: "disabled" },
  },
  use: {
    baseURL: `http://localhost:${previewPort}/`,
    trace: ci ? "on-first-retry" : "off",
    launchOptions,
  },
  projects: [
    {
      name: "chromium",
      testIgnore: "**/mobile/**",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: "mobile-chromium",
      testMatch: "**/mobile/*.e2e.ts",
      use: { ...devices["Pixel 5"], viewport: { width: 375, height: 812 } },
    },
    {
      name: "chromium-base",
      testMatch: baseSensitive,
      testIgnore: "**/mobile/**",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
        baseURL: `http://localhost:${basePort}/keio/`,
      },
    },
  ],
  webServer: [
    {
      command: `node e2e/server/prepare.mjs && npm run preview -- --port ${previewPort} --strictPort`,
      url: `http://localhost:${previewPort}/`,
      cwd: "..",
      reuseExistingServer: !ci,
      timeout: 300_000,
    },
    {
      command: "node e2e/server/serve-base.mjs",
      url: `http://localhost:${basePort}/keio/`,
      cwd: "..",
      reuseExistingServer: !ci,
      timeout: 300_000,
    },
  ],
});
