import type { Locator, Page } from "@playwright/test";

import footerData from "../../src/data/footer.json" with { type: "json" };
import sponsors from "../../src/data/sponsors.json" with { type: "json" };
import { socialIconPath } from "../../src/lib/socialIcons";
import { expect, test } from "../fixtures";
import { locales, publishedPages } from "../pages";

const footer = (page: Page) => page.locator("footer");
const track = (page: Page) => page.locator("[data-sponsors-track]");
// 2組目は回すための複製で、読み上げとタブ送りから外してある。
const realSlides = (page: Page) =>
  page.locator("[data-sponsors-track] li:not([data-sponsors-clone])");

// 各ロゴの左端と、いまのスクロール位置。1枚ずつ送れていることを位置で確かめる。
const offsets = (locator: Locator) =>
  locator.evaluate((el) =>
    [...el.children].map((child) => (child as HTMLElement).offsetLeft)
  );
const scrollLeft = (locator: Locator) =>
  locator.evaluate((el) => Math.round(el.scrollLeft));

// 並んでいるロゴの画像のパスを、左から順に返す。
const logoSrcs = (locator: Locator) =>
  locator.evaluate((el) =>
    [...el.querySelectorAll("img")].map((img) => img.getAttribute("src") ?? "")
  );

// 帯の中に見えているロゴを、左から順に返す。
const visibleLogos = (locator: Locator) =>
  locator.evaluate((el) =>
    [...el.children]
      .filter((child) => {
        const slide = child as HTMLElement;
        return (
          slide.offsetLeft + slide.offsetWidth > el.scrollLeft &&
          slide.offsetLeft < el.scrollLeft + el.clientWidth
        );
      })
      .map((child) => child.querySelector("img")?.getAttribute("src") ?? "")
  );

// 右端まで帯で埋まっているか。送りの途中で空きが出ないことを確かめる。
const filledToRight = (locator: Locator) =>
  locator.evaluate((el) => {
    const last = el.lastElementChild as HTMLElement;
    return last.offsetLeft + last.offsetWidth >= el.scrollLeft + el.clientWidth;
  });

// 先頭から送っていったときに止まる位置。1組ぶん進むと黙って引き戻されるので、1周すると0へ戻る。
const forwardStops = async (locator: Locator) => {
  const all = await offsets(locator);
  const count = all.length / 2;
  return [...all.slice(1, count), 0];
};

// 時計を止め、以後は runFor だけで進める。実時間で自動送りが発火しないようにする。
const freezeClock = async (page: Page) => {
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
};

// 1組ぶん回せないときは送りのテストを飛ばす。回せるのにボタンが出ないとき(JSが読まれていない)は失敗させる。
const skipUnlessOverflow = async (page: Page) => {
  const loops = await track(page).evaluate((el) => {
    const loop = (el.children[el.children.length / 2] as HTMLElement)
      .offsetLeft;
    return loop > 0 && loop <= el.scrollWidth - el.clientWidth;
  });
  test.skip(!loops, "帯がはみ出さないので送らない");
  await expect(page.locator("[data-sponsors-prev]")).toBeVisible();
  await expect(page.locator("[data-sponsors-next]")).toBeVisible();
};

// ホバーとフォーカスを帯の外へ出す。
const leaveBand = async (page: Page) => {
  await page.mouse.move(2, 2);
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
};

const settledAt = (locator: Locator, expected: number) =>
  expect.poll(() => scrollLeft(locator)).toBe(expected);

test.describe("フッターの3段", () => {
  for (const locale of locales) {
    for (const entry of publishedPages(locale)) {
      test(`${entry.path} に3段が出る`, async ({ page }) => {
        await page.goto(entry.path.replace(/^\//u, ""));
        const f = footer(page);
        await expect(f.locator('a[href^="mailto:"]')).toHaveCount(1);
        await expect(
          f.getByRole("list", { name: /Social|SNS/u })
        ).toBeVisible();
        await expect(realSlides(page).locator("img")).toHaveCount(
          sponsors.length
        );
        await expect(f.getByText("CC BY 4.0")).toBeVisible();
        await expect(
          f.locator(`a[href="${footerData.repository}"]`)
        ).toBeVisible();
      });
    }
  }
});

test("SNSはアイコンで出て、リンクのaria-labelにサービス名が入る", async ({
  page,
}) => {
  await page.goto("e2e-plain/");
  const links = footer(page).getByRole("list", { name: /Social|SNS/u });
  for (const item of footerData.social) {
    const link = links.getByRole("link", { name: item.label });
    await expect(link).toHaveAttribute("href", item.href);
    // アイコンがあるサービスだけ、SVGの aria-hidden とリンクの aria-label を確かめる。
    if (socialIconPath(item.href)) {
      await expect(link).toHaveAttribute("aria-label", item.label);
      await expect(link.locator("svg")).toHaveAttribute("aria-hidden", "true");
    }
  }
});

test.describe("スポンサーの帯", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await freezeClock(page);
    await page.goto("e2e-plain/");
    await track(page).scrollIntoViewIfNeeded();
    await skipUnlessOverflow(page);
  });

  test("3秒ごとに1枚ずつ左へ送られ、1周して先頭の位置に戻る", async ({
    page,
  }) => {
    const t = track(page);
    const [first, ...rest] = await forwardStops(t);
    await page.clock.runFor(2900);
    expect(await scrollLeft(t)).toBe(0);
    await page.clock.runFor(100);
    await settledAt(t, first);
    for (const stop of rest) {
      await page.clock.runFor(3000);
      await settledAt(t, stop);
      expect(await filledToRight(t)).toBe(true);
    }
  });

  test("ボタンで1枚ずつ前後に送れ、キーボードでも押せる", async ({ page }) => {
    const t = track(page);
    const [first, second] = await forwardStops(t);
    const next = page.getByRole("button", { name: "Next" });
    const prev = page.getByRole("button", { name: "Previous" });
    await next.click();
    await settledAt(t, first);
    await prev.click();
    await settledAt(t, 0);
    await next.focus();
    await page.keyboard.press("Enter");
    await settledAt(t, first);
    await page.keyboard.press("Space");
    await settledAt(t, second);
  });

  test("ホバー中は自動で送られず、外れると再開する", async ({ page }) => {
    const t = track(page);
    const [first] = await forwardStops(t);
    const box = await t.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.move((box?.x ?? 0) + 20, (box?.y ?? 0) + 20);
    await page.clock.runFor(9000);
    expect(await scrollLeft(t)).toBe(0);
    await page.mouse.move(2, 2);
    await page.clock.runFor(3000);
    await settledAt(t, first);
  });

  test("帯の中にフォーカスがある間は自動で送られない", async ({ page }) => {
    const t = track(page);
    await page.getByRole("button", { name: "Next" }).focus();
    await page.clock.runFor(9000);
    expect(await scrollLeft(t)).toBe(0);
    await page.getByRole("button", { name: "Next" }).blur();
    await page.clock.runFor(3000);
    await expect.poll(() => scrollLeft(t)).toBeGreaterThan(0);
  });

  test("マウスで再生を押し、ポインタがボタンに乗ったままでも送られる", async ({
    page,
  }) => {
    const t = track(page);
    const [first] = await forwardStops(t);
    await page.getByRole("button", { name: "Pause" }).click();
    // 読み込み時の周期の途中まで進めてから再生し、再生の3秒後に送られることを確かめる。
    await page.clock.runFor(1500);
    await page.getByRole("button", { name: "Play" }).click();
    await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
    await expect(page.locator("[data-sponsors-toggle]")).toBeFocused();
    await page.clock.runFor(2900);
    expect(await scrollLeft(t)).toBe(0);
    await page.clock.runFor(100);
    await settledAt(t, first);
  });

  test("キーボードで再生を押し、フォーカスがボタンに残ったままでも送られる", async ({
    page,
  }) => {
    const t = track(page);
    const [first] = await forwardStops(t);
    const toggle = page.locator("[data-sponsors-toggle]");
    await toggle.focus();
    await page.keyboard.press("Enter");
    await expect(toggle).toHaveAttribute("aria-label", "Play");
    await page.clock.runFor(1500);
    await page.keyboard.press("Enter");
    await expect(toggle).toHaveAttribute("aria-label", "Pause");
    await expect(toggle).toBeFocused();
    await page.mouse.move(2, 2);
    await page.clock.runFor(2900);
    expect(await scrollLeft(t)).toBe(0);
    await page.clock.runFor(100);
    await settledAt(t, first);
  });

  const parts = {
    ロゴ: (page: Page) => page.locator("[data-sponsors-track] li a").first(),
    前へ: (page: Page) => page.getByRole("button", { name: "Previous" }),
    次へ: (page: Page) => page.getByRole("button", { name: "Next" }),
  };
  for (const [name, locate] of Object.entries(parts)) {
    test(`${name}にホバーがある間は送られない`, async ({ page }) => {
      await locate(page).hover();
      await page.clock.runFor(9000);
      expect(await scrollLeft(track(page))).toBe(0);
    });

    test(`${name}にフォーカスがある間は送られない`, async ({ page }) => {
      await page.mouse.move(2, 2);
      await locate(page).focus();
      await page.clock.runFor(9000);
      expect(await scrollLeft(track(page))).toBe(0);
    });
  }

  test("トグルにホバーしていても、ロゴにフォーカスがあれば送られない", async ({
    page,
  }) => {
    await page.locator("[data-sponsors-toggle]").hover();
    await parts.ロゴ(page).focus();
    await page.clock.runFor(9000);
    expect(await scrollLeft(track(page))).toBe(0);
  });

  test("先頭で前へを押すと末尾へ回る", async ({ page }) => {
    const t = track(page);
    const all = await offsets(t);
    await page.getByRole("button", { name: "Previous" }).click();
    await settledAt(t, all[all.length / 2 - 1]);
    expect(await filledToRight(t)).toBe(true);
  });

  // 端で巻き戻らず回ること。1周を越えて押しても並びが続き、右端に空きが出ないことを位置で確かめる。
  test("次へを押し続けると、先頭を通り越しても途切れずに回る", async ({
    page,
  }) => {
    const t = track(page);
    const stops = await forwardStops(t);
    const srcs = await logoSrcs(t);
    const logos = srcs.slice(0, stops.length);
    const next = page.getByRole("button", { name: "Next" });
    for (let i = 0; i < stops.length * 2; i += 1) {
      await next.click();
      await settledAt(t, stops[i % stops.length]);
      expect(await filledToRight(t)).toBe(true);
      const visible = await visibleLogos(t);
      expect(visible[0]).toBe(logos[(i + 1) % logos.length]);
    }
  });

  test("前へを押し続けると、逆向きにも途切れずに回る", async ({ page }) => {
    const t = track(page);
    const all = await offsets(t);
    const count = all.length / 2;
    const srcs = await logoSrcs(t);
    const logos = srcs.slice(0, count);
    const prev = page.getByRole("button", { name: "Previous" });
    for (let i = 0; i < count * 2; i += 1) {
      await prev.click();
      await settledAt(t, all[(count * 2 - 1 - i) % count]);
      expect(await filledToRight(t)).toBe(true);
      const visible = await visibleLogos(t);
      expect(visible[0]).toBe(logos[(count * 2 - 1 - i) % count]);
    }
  });

  test("一時停止で自動の送りが止まり、再生で再開する(クリック)", async ({
    page,
  }) => {
    const t = track(page);
    const [first] = await forwardStops(t);
    await page.getByRole("button", { name: "Pause" }).click();
    await expect(page.getByRole("button", { name: "Play" })).toBeVisible();
    await leaveBand(page);
    await page.clock.runFor(9000);
    expect(await scrollLeft(t)).toBe(0);
    await page.getByRole("button", { name: "Play" }).click();
    await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
    await leaveBand(page);
    await page.clock.runFor(3000);
    await settledAt(t, first);
  });

  test("一時停止と再生はキーボードでも切り替えられる", async ({ page }) => {
    const t = track(page);
    const toggle = page.locator("[data-sponsors-toggle]");
    await toggle.focus();
    await page.keyboard.press("Enter");
    await expect(toggle).toHaveAttribute("aria-label", "Play");
    await leaveBand(page);
    await page.clock.runFor(9000);
    expect(await scrollLeft(t)).toBe(0);
    await toggle.focus();
    await page.keyboard.press("Space");
    await expect(toggle).toHaveAttribute("aria-label", "Pause");
    await leaveBand(page);
    await page.clock.runFor(3000);
    await expect.poll(() => scrollLeft(t)).toBeGreaterThan(0);
  });
});

test("帯がはみ出さないときはボタンが出ず、はみ出すと出る", async ({ page }) => {
  await page.goto("e2e-plain/");
  const buttons = page.locator(
    "[data-sponsors-prev], [data-sponsors-next], [data-sponsors-toggle]"
  );
  const slides = page.locator("[data-sponsors-track] li");
  const setHidden = (hidden: boolean) =>
    slides.evaluateAll((items, hide) => {
      for (const item of items.slice(1)) {
        (item as HTMLElement).style.display = hide ? "none" : "";
      }
    }, hidden);
  await setHidden(true);
  for (const button of await buttons.all()) {
    await expect(button).toBeHidden();
  }
  await setHidden(false);
  const overflows = await track(page).evaluate(
    (el) => el.scrollWidth > el.clientWidth
  );
  if (overflows) {
    for (const button of await buttons.all()) {
      await expect(button).toBeVisible();
    }
  }
});

test.describe("prefers-reduced-motion", () => {
  test("自動では送られないが、ボタンでは送れる", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await freezeClock(page);
    await page.goto("e2e-plain/");
    await skipUnlessOverflow(page);
    const t = track(page);
    const [first] = await forwardStops(t);
    await expect(page.getByRole("button", { name: "Play" })).toBeVisible();
    await page.clock.runFor(12_000);
    expect(await scrollLeft(t)).toBe(0);
    await page.getByRole("button", { name: "Next" }).click();
    await settledAt(t, first);
  });

  test("初めは一時停止で、再生を押すと自動で送られる", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await freezeClock(page);
    await page.goto("e2e-plain/");
    await skipUnlessOverflow(page);
    const t = track(page);
    const [first] = await forwardStops(t);
    await page.getByRole("button", { name: "Play" }).click();
    await leaveBand(page);
    await page.clock.runFor(3000);
    await settledAt(t, first);
  });
});

test.describe("JSを切ったとき", () => {
  test.use({ javaScriptEnabled: false });

  test("ボタンは出ず、横スクロールでロゴを全部見られる", async ({ page }) => {
    await page.goto("e2e-plain/");
    // 回すための2組目はJSが無いと出ない。
    await expect(page.locator("[data-sponsors-clone]").first()).toBeHidden();
    await expect(page.locator("[data-sponsors-prev]")).toBeHidden();
    await expect(page.locator("[data-sponsors-next]")).toBeHidden();
    await expect(page.locator("[data-sponsors-toggle]")).toBeHidden();
    const t = track(page);
    const scrollable = await t.evaluate((el) => ({
      overflow: getComputedStyle(el).overflowX,
      wider: el.scrollWidth > el.clientWidth,
    }));
    expect(scrollable.overflow).toBe("auto");
    // 社数が変わって帯がはみ出さないときは、末尾のロゴが見えることだけを確かめる。
    if (!scrollable.wider) {
      await t.scrollIntoViewIfNeeded();
      await expect(realSlides(page).last()).toBeInViewport({ ratio: 1 });
      return;
    }
    const pageOverflows = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(pageOverflows).toBe(false);
    await t.scrollIntoViewIfNeeded();
    const last = realSlides(page).last();
    await t.evaluate((el) => {
      el.scrollLeft = el.scrollWidth;
    });
    await expect(last).toBeInViewport({ ratio: 1 });
  });
});

test("増えるJSはフッター用の1ファイルだけで、Reactのチャンクは読まれない", async ({
  page,
}) => {
  const scripts: string[] = [];
  page.on("request", (request) => {
    if (
      request.resourceType() === "script" ||
      /\.m?js(\?|$)/u.test(request.url())
    ) {
      scripts.push(new URL(request.url()).pathname);
    }
  });
  await page.goto("e2e-plain/");
  await page.waitForLoadState("networkidle");
  expect(scripts).toHaveLength(1);
  expect(scripts[0]).toMatch(/\/footer-sponsors\.js$/u);
  await expect(page.locator("script")).toHaveCount(1);
});
