import { test as base, expect } from "@playwright/test";

// localhost以外へのリクエストをすべて失敗させ、1件でもあればテストを落とす。
// iGEMの規定でstatic.igem.wiki等以外に出ないことを、E2Eでも固定する。
export const test = base.extend<{ blockedRequests: string[] }>({
  blockedRequests: [
    async ({ context }, use) => {
      const blocked: string[] = [];
      await context.route("**/*", (route) => {
        const { hostname } = new URL(route.request().url());
        if (hostname === "localhost") return route.fallback();
        blocked.push(route.request().url());
        return route.abort("blockedbyclient");
      });
      await use(blocked);
      expect(blocked, "localhost以外へのリクエスト").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

// baseURLの配信パス(/ か /keio/)を除いた、ページのパス。
export function pathOf(url: string, baseURL: string | undefined): string {
  const base = new URL(baseURL ?? "http://localhost/").pathname.replace(/\/$/, "");
  return new URL(url).pathname.slice(base.length) || "/";
}

// ページのパスに、baseURLの配信パスを付けたhref。
export function hrefOf(path: string, baseURL: string | undefined): string {
  return new URL(baseURL ?? "http://localhost/").pathname.replace(/\/$/, "") + path;
}
