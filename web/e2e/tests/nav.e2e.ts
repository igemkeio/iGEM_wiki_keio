import type { Locator, Page, TestInfo } from "@playwright/test";

import { expect, hrefOf, pathOf, test } from "../fixtures";
import {
  categoryLabelOf,
  firstPageOf,
  labels,
  locales,
  navConfig,
  pagesOfCategory,
  publishedPages,
} from "../pages";

const categoryLabels = navConfig.categories.map((c) => c.label);

interface Point {
  x: number;
  y: number;
}

async function centerOf(locator: Locator): Promise<Point> {
  const box = await locator.boundingBox();
  if (!box) {
    throw new Error("boundingBoxを取れない");
  }
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

// fromからtoまで、まず縦、次に横へ、steps刻みで進む点列。
function path(from: Point, to: Point, steps: number): [number, number][] {
  const points: [number, number][] = [];
  for (let i = 0; i <= steps; i += 1) {
    points.push([from.x, from.y + ((to.y - from.y) * i) / steps]);
  }
  for (let i = 1; i <= steps; i += 1) {
    points.push([from.x + ((to.x - from.x) * i) / steps, to.y]);
  }
  return points;
}

const unescapeHtml = (text: string) =>
  text
    .replaceAll("&quot;", '"')
    .replaceAll("&#x27;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");

// 全ページをたどる重いテストはbase付きのprojectでは流さない。base付きはhrefに/keio/が付くことだけを見る。
const skipInBase = (testInfo: TestInfo) =>
  testInfo.skip(
    testInfo.project.name === "chromium-base",
    "base付きではhrefの接頭辞だけを見る"
  );

for (const locale of locales) {
  const pages = publishedPages(locale);
  const articles = pages.filter((p) => p.slug !== "home");
  const start = locale === "en" ? "" : "ja/";
  const header = (page: Page) =>
    page.getByRole("navigation", { name: labels[locale].category });
  // 大腸菌のリンク(パネルの中のリンクは含まない)
  const cell = (page: Page, label: string) =>
    header(page).getByRole("link", { name: label, exact: true });
  const cells = (page: Page) => header(page).locator("ol > li > a");
  // 分類ごとの先頭のページ(分類にページが無ければ除く)。全ページの代わりに代表として開く。
  const representatives = categoryLabels.flatMap((label) => {
    const first = firstPageOf(articles, label);
    return first ? [first] : [];
  });
  // 大腸菌のうちパネルを持つ1匹の<li>
  const item = (page: Page, label: string) =>
    header(page).locator("li", {
      has: page.getByRole("link", { name: label, exact: true }),
    });

  test(`[${locale}] Homeのパネルに、publishedな全ページへのリンクが対応表の順で並び、どれも開ける`, async ({
    page,
    baseURL,
  }, testInfo) => {
    skipInBase(testInfo);
    expect(articles.length).toBeGreaterThan(1);
    await page.goto(start);
    // 遷移せずに、全分類のパネルのhrefを1回で集める
    const all = await header(page)
      .locator("ul a")
      .evaluateAll((els) => els.map((el) => el.getAttribute("href") ?? ""));
    // 分類順に、対応表の順でページを連ねたもの。順序、漏れ、重複を1回で見る。
    // 確認用ページ(PRERENDER_ALLで出る)はProjectの末尾に混ざるので、公開ページだけを比べる。
    const expected = categoryLabels.flatMap((label) =>
      pagesOfCategory(articles, label).map((p) => hrefOf(p.path, baseURL))
    );
    const published = new Set(articles.map((p) => hrefOf(p.path, baseURL)));
    expect(all.filter((h) => published.has(h))).toStrictEqual(expected);
    // 各ページが開けることを、遷移せずにHTTPで並列に確かめる。
    // previewは存在しないパスにもHomeを200で返すので、ステータスに加えてtitleも見る。
    const titleOf = new Map(
      articles.map((p) => [
        hrefOf(p.path, baseURL),
        `${p.title} | iGEM Keio 2026`,
      ])
    );
    const home = pages.find((p) => p.slug === "home");
    const homeTitle = `${home?.title} | iGEM Keio 2026`;
    const responses = await Promise.all(
      [...new Set(all)].map(async (href) => {
        const response = await page.request.get(href);
        const html = await response.text();
        const title = /<title>(.*?)<\/title>/u.exec(html)?.[1] ?? "";
        return { href, status: response.status(), title: unescapeHtml(title) };
      })
    );
    expect(responses.filter((r) => r.status !== 200)).toStrictEqual([]);
    // 公開ページはtitleが一致し、確認用ページはHomeのtitleではない
    for (const r of responses) {
      const want = titleOf.get(r.href);
      if (want) {
        expect({ href: r.href, title: r.title }).toStrictEqual({
          href: r.href,
          title: want,
        });
      } else {
        expect(r.title, r.href).not.toBe(homeTitle);
      }
    }
  });

  test(`[${locale}] Homeのパネルから代表のページへクリックで移れる`, async ({
    page,
    baseURL,
  }) => {
    const entries = [representatives[0], representatives.at(-1)];
    for (const entry of entries) {
      await page.goto(start);
      const label = categoryLabelOf(entry?.slug ?? "") ?? "";
      await cell(page, label).hover();
      await item(page, label)
        .locator(`ul a[href="${hrefOf(entry?.path ?? "", baseURL)}"]`)
        .click();
      await expect(page).toHaveURL(
        (url) => pathOf(url.href, baseURL) === entry?.path
      );
      await expect(page).toHaveTitle(`${entry?.title} | iGEM Keio 2026`);
      await expect(page.locator("h1")).toHaveText(entry?.title ?? "");
    }
  });

  test(`[${locale}] ヘッダーのリンクのhrefにbaseが付く`, async ({
    page,
    baseURL,
  }) => {
    const prefix = new URL(baseURL ?? "http://localhost/").pathname;
    await page.goto(start);
    const hrefs = await page
      .locator("header a")
      .evaluateAll((els) => els.map((el) => el.getAttribute("href") ?? ""));
    expect(hrefs.length).toBeGreaterThan(10);
    expect(hrefs.filter((h) => !h.startsWith(prefix))).toStrictEqual([]);
  });

  test(`[${locale}] 左のSidebarが出ず、本文が左の列に押されない`, async ({
    page,
  }) => {
    for (const entry of [pages[0], ...representatives.slice(0, 1)]) {
      await page.goto(entry.path.slice(1));
      await expect(
        page.getByRole("navigation", {
          name: locale === "en" ? "Main" : "メインメニュー",
        })
      ).toHaveCount(0);
      const box = await page.locator("main").boundingBox();
      expect(box?.x ?? 1000).toBeLessThan(300);
    }
  });

  test(`[${locale}] ホバーでパネルが開き、マウスがパネルへ移っても閉じない`, async ({
    page,
  }) => {
    await page.goto(start);
    const [label] = categoryLabels;
    const panelLinks = item(page, label).locator("ul a");
    await expect(panelLinks.first()).toBeHidden();
    await cell(page, label).hover();
    await expect(panelLinks.first()).toBeVisible();
    // 大腸菌の中心から真下へ、続けて横へパネルの最後のリンクの中心まで連続して動かし、途中で閉じないことを見る
    const origin = await centerOf(cell(page, label));
    const end = await centerOf(panelLinks.last());
    for (const [x, y] of path(origin, end, 20)) {
      await page.mouse.move(x, y);
      await expect(panelLinks.first()).toBeVisible();
    }
    await expect(panelLinks.last()).toBeVisible();
    await page.mouse.move(5, 700);
    await expect(panelLinks.first()).toBeHidden();
  });

  test(`[${locale}] 展開の途中で下のリンクへ素早く移っても、パネルは閉じない`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(start);
    const [label] = categoryLabels;
    const panelLinks = item(page, label).locator("ul a");
    await cell(page, label).hover();
    // 展開を途中(20ms)で止め、移る間も展開中のままにする
    await item(page, label)
      .locator("ul")
      .evaluate((e) => {
        for (const a of e.getAnimations()) {
          a.pause();
          a.currentTime = 20;
        }
      });
    const last = await centerOf(panelLinks.last());
    // ホバー直後に、まだ展開中の最後のリンクの位置へ1回で移る
    await page.mouse.move(last.x, last.y);
    await page.mouse.move(last.x, last.y + 1);
    await expect(panelLinks.first()).toBeVisible();
    await expect(panelLinks.last()).toBeVisible();
    const href = await panelLinks.last().getAttribute("href");
    await item(page, label)
      .locator("ul")
      .evaluate((e) => {
        for (const a of e.getAnimations()) {
          a.finish();
        }
      });
    await panelLinks.last().click();
    await expect(page).toHaveURL((url) => url.pathname === href);
  });

  test(`[${locale}] Tabで大腸菌にフォーカスするとパネルが開き、中のリンクへ進め、外れると閉じる`, async ({
    page,
  }) => {
    await page.goto(start);
    const [label] = categoryLabels;
    const panelLinks = item(page, label).locator("ul a");
    // ロゴの次が先頭の大腸菌
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await expect(cell(page, label)).toBeFocused();
    await expect(panelLinks.first()).toBeVisible();
    await page.keyboard.press("Tab");
    await expect(panelLinks.first()).toBeFocused();
    expect(await panelLinks.count()).toBeGreaterThan(1);
    await page.keyboard.press("Tab");
    await expect(panelLinks.nth(1)).toBeFocused();
    await expect(panelLinks.nth(1)).toBeVisible();
    // 最後のリンクを越えると次の大腸菌に移り、前のパネルは閉じる
    for (let i = 2; i < (await panelLinks.count()); i += 1) {
      await page.keyboard.press("Tab");
    }
    await page.keyboard.press("Tab");
    await expect(cell(page, categoryLabels[1])).toBeFocused();
    await expect(panelLinks.first()).toBeHidden();
  });

  test(`[${locale}] パネルは上から伸びるアニメーションで開き、prefers-reduced-motionでは止まる`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(start);
    const [label] = categoryLabels;
    const panel = item(page, label).locator("ul").first();
    await cell(page, label).hover();
    await expect(panel).toBeVisible();
    await expect(panel).not.toHaveCSS("animation-name", "none");
    await page.mouse.move(5, 700);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await cell(page, label).hover();
    await expect(panel).toBeVisible();
    await expect(panel).toHaveCSS("animation-name", "none");
  });

  test(`[${locale}] ナビのためのJSがページに入らない`, async ({ page }) => {
    await page.goto(`${start}e2e-plain/`);
    await expect(page.locator("script")).toHaveCount(0);
  });

  test(`[${locale}] aria-currentが現在のページのリンクだけに付く`, async ({
    page,
    baseURL,
  }) => {
    for (const entry of representatives) {
      await page.goto(entry.path.slice(1));
      const current = header(page).locator('ul a[aria-current="page"]');
      await expect(current).toHaveCount(1);
      await expect(current).toHaveAttribute(
        "href",
        hrefOf(entry.path, baseURL)
      );
    }
    await page.goto(start);
    await expect(page.locator('header a[aria-current="page"]')).toHaveAttribute(
      "href",
      hrefOf(locale === "en" ? "/" : "/ja/", baseURL)
    );
  });

  test(`[${locale}] 各分類のパネルには、その分類のページが対応表の順に並ぶ`, async ({
    page,
    baseURL,
  }) => {
    const published = new Set(articles.map((p) => hrefOf(p.path, baseURL)));
    await page.goto(start);
    for (const label of categoryLabels) {
      const expected = pagesOfCategory(articles, label).map((p) =>
        hrefOf(p.path, baseURL)
      );
      // 確認用ページ(PRERENDER_ALLで出る)はProjectの末尾に混ざるので、公開ページだけを比べる
      const hrefs = await item(page, label)
        .locator("ul a")
        .evaluateAll((els) => els.map((el) => el.getAttribute("href") ?? ""));
      expect(hrefs.filter((h) => published.has(h))).toStrictEqual(expected);
    }
  });

  test(`[${locale}] ロゴからHomeへ、言語の切り替えから相手の言語のページへ行ける`, async ({
    page,
    baseURL,
  }) => {
    const other = locale === "en" ? "ja" : "en";
    const otherPages = publishedPages(other);
    for (const entry of [articles[0], articles.at(-1) ?? articles[0]]) {
      await page.goto(entry.path.slice(1));
      const target =
        otherPages.find((p) => p.slug === entry.slug) ??
        otherPages.find((p) => p.slug === "home");
      await page.locator(`header a[hreflang=${other}]`).click();
      await expect(page).toHaveURL(
        (url) => pathOf(url.href, baseURL) === target?.path
      );
    }
    await page.goto(articles[0].path.slice(1));
    await page.locator("header a", { hasText: "iGEM" }).click();
    await expect(page).toHaveURL(
      (url) => pathOf(url.href, baseURL) === (locale === "en" ? "/" : "/ja/")
    );
  });

  test(`[${locale}] ヘッダーの大腸菌は5匹で、いまの分類だけが現在地になる`, async ({
    page,
  }) => {
    for (const entry of [pages[0], ...representatives]) {
      await page.goto(entry.path.slice(1));
      const links = cells(page);
      await expect(links).toHaveText(categoryLabels);
      const label = categoryLabelOf(entry.slug);
      const current = cells(page).and(page.locator("[aria-current]"));
      await (label
        ? expect(current).toHaveText(label)
        : expect(current).toHaveCount(0));
    }
  });

  test(`[${locale}] ヘッダーの大腸菌は分類の先頭のページに移り、キーボードで操作できる`, async ({
    page,
    baseURL,
  }) => {
    await page.goto(start);
    const links = cells(page);
    const first = links.first();
    const href = await first.getAttribute("href");
    const target = firstPageOf(articles, categoryLabels[0]);
    expect(href).toBe(hrefOf(target?.path ?? "", baseURL));
    await first.focus();
    await expect(first).toBeFocused();
    // Tabはまずパネルの中のリンクへ進む
    await page.keyboard.press("Tab");
    await expect(
      item(page, categoryLabels[0]).locator("ul a").first()
    ).toBeFocused();
    await first.focus();
    await expect(first).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL((url) => url.pathname === href);
  });

  for (const width of [1280, 768]) {
    test(`[${locale}] ${width}px幅で、全分類のパネルのリンクが画面内にあり、他に覆われない`, async ({
      page,
    }, testInfo) => {
      skipInBase(testInfo);
      await page.setViewportSize({ width, height: 800 });
      await page.goto(start);
      for (const label of categoryLabels) {
        await cell(page, label).hover();
        const links = item(page, label).locator("ul a");
        const count = await links.count();
        expect(count).toBeGreaterThan(0);
        for (let i = 0; i < count; i += 1) {
          const link = links.nth(i);
          await expect(link).toBeInViewport({ ratio: 1 });
          const covered = await link.evaluate((el) => {
            const r = el.getBoundingClientRect();
            const top = document.elementFromPoint(
              r.x + r.width / 2,
              r.y + r.height / 2
            );
            return !(top && el.contains(top));
          });
          expect(covered, `${label} ${i}`).toBe(false);
        }
      }
    });
  }

  for (const width of [768, 900, 1000, 1100]) {
    test(`[${locale}] ${width}px幅でも、ヘッダーの5匹が収まり押せる`, async ({
      page,
      baseURL,
    }, testInfo) => {
      skipInBase(testInfo);
      await page.setViewportSize({ width, height: 800 });
      await page.goto(start);
      const links = cells(page);
      await expect(links).toHaveCount(5);
      for (const link of await links.all()) {
        const box = await link.boundingBox();
        expect(box?.x ?? -1).toBeGreaterThanOrEqual(0);
        expect((box?.x ?? width) + (box?.width ?? width)).toBeLessThanOrEqual(
          width
        );
        // 中央の点がリンク自身で、他の要素に覆われていない
        const covered = await link.evaluate((el) => {
          const r = el.getBoundingClientRect();
          const top = document.elementFromPoint(
            r.x + r.width / 2,
            r.y + r.height / 2
          );
          return !(top && el.contains(top));
        });
        expect(covered).toBe(false);
      }
      await links.last().click();
      const target = firstPageOf(articles, categoryLabels.at(-1) ?? "");
      expect(target).toBeDefined();
      await expect(page).toHaveURL(
        (url) => pathOf(url.href, baseURL) === target?.path
      );
    });
  }
}
