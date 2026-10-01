import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, hrefOf, pathOf, test } from "../fixtures";

type Entry = { slug: string; title: string; published?: boolean };

// content/en/のpublishedなページ。E2E用の未公開ページはPRERENDER_ALLで出るが、ここでは数えない。
const dir = join(import.meta.dirname, "../../../content/en");
const pages: Entry[] = readdirSync(dir)
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")) as Entry)
  .filter((p) => p.published !== false);

const pathFor = (slug: string) => (slug === "home" ? "/" : `/${slug}/`);

test("ヘッダーのナビから、publishedな全ページに着く", async ({ page, baseURL }) => {
  expect(pages.length).toBeGreaterThan(1);
  for (const entry of pages) {
    await page.goto("");
    const link = page.getByRole("navigation", { name: "Main" }).locator(`a[href="${hrefOf(pathFor(entry.slug), baseURL)}"]`);
    await link.click();
    await expect(page).toHaveURL((url) => pathOf(url.href, baseURL) === pathFor(entry.slug));
    await expect(page).toHaveTitle(`${entry.title} | iGEM Keio 2026`);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveText(entry.title);
  }
});

test("aria-currentが現在のページのリンクだけに付く", async ({ page, baseURL }) => {
  for (const entry of pages) {
    await page.goto(pathFor(entry.slug).slice(1));
    const current = page.getByRole("navigation", { name: "Main" }).locator('a[aria-current="page"]');
    await expect(current).toHaveCount(1);
    await expect(current).toHaveAttribute("href", hrefOf(pathFor(entry.slug), baseURL));
  }
});
