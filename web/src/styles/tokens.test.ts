import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(import.meta.dirname, "tokens.css"), "utf-8");

describe("tokens.css のパレット", () => {
  it.each(["a", "b", "c"])(
    ':root[data-palette="%s"] が差し色の3トークンだけを上書きする',
    (name) => {
      const block = new RegExp(
        `:root\\[data-palette="${name}"\\]\\s*\\{([^}]*)\\}`,
        "u"
      ).exec(css);
      expect(block).not.toBeNull();
      const declared = [...(block?.[1] ?? "").matchAll(/(--[\w-]+):/gu)].map(
        (m) => m[1]
      );
      expect(declared).toStrictEqual([
        "--color-accent-orange",
        "--color-accent-blue",
        "--color-note-dot",
      ]);
    }
  );
});
