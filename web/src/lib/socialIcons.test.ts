import { describe, expect, it } from "vitest";

import { socialIconPath } from "./socialIcons";

describe(socialIconPath, () => {
  it("Instagram、X、YouTubeのリンクには、サービスごとに違うパスを返す", () => {
    const paths = [
      "https://www.instagram.com/example",
      "https://x.com/example",
      "https://twitter.com/example",
      "https://www.youtube.com/@example",
    ].map((href) => socialIconPath(href));
    expect(paths.every((p) => typeof p === "string" && p.length > 0)).toBe(
      true
    );
    expect(new Set(paths).size).toBe(3);
  });

  it("対応するサービスが無い、またはURLでないときはundefined", () => {
    expect(socialIconPath("https://example.com/")).toBeUndefined();
    expect(socialIconPath("https://notinstagram.com/")).toBeUndefined();
    expect(socialIconPath("instagram")).toBeUndefined();
  });
});
