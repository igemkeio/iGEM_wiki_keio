import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import footer from "../data/footer.json";
import sponsors from "../data/sponsors.json";
import { Footer, SocialLinks } from "./Footer";

afterEach(cleanup);

describe(Footer, () => {
  it("3段が出る: 連絡先とSNS、スポンサー、ライセンスとリポジトリ", () => {
    render(<Footer locale="en" />);
    expect(screen.getByRole("link", { name: footer.email })).toHaveAttribute(
      "href",
      `mailto:${footer.email}`
    );
    for (const item of footer.social) {
      expect(screen.getByRole("link", { name: item.label })).toHaveAttribute(
        "href",
        item.href
      );
    }
    expect(screen.getAllByRole("img")).toHaveLength(sponsors.length);
    expect(screen.getByText(/Licensed under CC BY 4\.0/u)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Wiki repository" })
    ).toHaveAttribute("href", footer.repository);
  });

  it("送りのボタンは hidden で出し、aria-label を言語ごとに付ける", () => {
    const { container, rerender } = render(<Footer locale="ja" />);
    const read = () =>
      ["prev", "next"].map((key) => {
        const button = container.querySelector(`[data-sponsors-${key}]`);
        return [
          button?.hasAttribute("hidden"),
          button?.getAttribute("aria-label"),
        ];
      });
    expect(read()).toStrictEqual([
      [true, "前へ"],
      [true, "次へ"],
    ]);
    rerender(<Footer locale="en" />);
    expect(read()).toStrictEqual([
      [true, "Previous"],
      [true, "Next"],
    ]);
  });
});

describe(SocialLinks, () => {
  const items = [
    { label: "Instagram", href: "https://www.instagram.com/example" },
    { label: "Example", href: "https://example.com/" },
  ];

  it("対応するアイコンがあればaria-hiddenのSVGで、サービス名をaria-labelにする", () => {
    const { container } = render(<SocialLinks items={items} label="SNS" />);
    const link = screen.getByRole("link", { name: "Instagram" });
    expect(link).toHaveAttribute("aria-label", "Instagram");
    const svg = link.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelectorAll("svg")).toHaveLength(1);
  });

  it("対応するアイコンが無いときは文字で出す", () => {
    render(<SocialLinks items={items} label="SNS" />);
    const link = screen.getByRole("link", { name: "Example" });
    expect(link).toHaveTextContent("Example");
    expect(link.querySelector("svg")).toBeNull();
  });
});
