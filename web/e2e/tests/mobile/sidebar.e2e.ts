import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, hrefOf, test } from "../../fixtures";

const dir = join(import.meta.dirname, "../../../../content/en");
const slugs: string[] = readdirSync(dir)
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")) as { slug: string; published?: boolean })
  .filter((p) => p.published !== false)
  .map((p) => p.slug);

test("375pxでは上部バーのトグルでナビが開閉する", async ({ page }) => {
  await page.goto("");
  const toggle = page.getByLabel("Menu");
  const nav = page.getByRole("navigation", { name: "Main" });
  await expect(toggle).toBeVisible();
  await expect(nav).toBeHidden();
  await toggle.click();
  await expect(nav).toBeVisible();
  await toggle.click();
  await expect(nav).toBeHidden();
});

test("開いたナビに、publishedな全ページへのリンクがある", async ({ page, baseURL }) => {
  await page.goto("");
  await page.getByLabel("Menu").click();
  const nav = page.getByRole("navigation", { name: "Main" });
  for (const slug of slugs) {
    await expect(nav.locator(`a[href="${hrefOf(slug === "home" ? "/" : `/${slug}/`, baseURL)}"]`)).toBeVisible();
  }
});
