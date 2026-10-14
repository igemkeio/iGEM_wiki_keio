import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import footer from "../data/footer.json";
import sponsors from "../data/sponsors.json";
import { Footer } from "./Footer";

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
