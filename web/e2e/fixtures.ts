import { test as base, expect } from "@playwright/test";

// 許可ホスト(iGEMの規定でwikiが読み込んでよい配信元)へのリクエストは、実際には出さず空のダミーを返す。
// それ以外のlocalhost以外へのリクエストは失敗させて記録し、1件でもあればテストを落とす。
const allowedHosts = ["igem.org", "igem.wiki"];
const isAllowed = (hostname: string) =>
  allowedHosts.some((host) => hostname === host || hostname.endsWith(`.${host}`));

// 1x1の透明なPNG
const pixel = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

export const test = base.extend<{ blockedRequests: string[] }>({
  blockedRequests: [
    async ({ context }, use) => {
      const blocked: string[] = [];
      await context.route("**/*", (route) => {
        const { hostname } = new URL(route.request().url());
        if (hostname === "localhost") return route.fallback();
        if (isAllowed(hostname)) {
          return route.request().resourceType() === "image"
            ? route.fulfill({ status: 200, contentType: "image/png", body: pixel })
            : route.fulfill({ status: 200, body: "" });
        }
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
