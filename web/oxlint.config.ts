import { defineConfig } from "oxlint";
import core from "ultracite/oxlint/core";
import react from "ultracite/oxlint/react";
import vitest from "ultracite/oxlint/vitest";

// vitest のルールは Vitest のテスト(src/)だけに掛ける。scripts/ は node:test、
// e2e/ は Playwright で、vitest の自動修正が import を差し込んで壊すため。
const vitestOverrides = (vitest.overrides ?? []).map((override) => ({
  ...override,
  files: ["src/**/*.test.{ts,tsx}"],
  rules: {
    ...override.rules,
    // 属性を1つずつ確かめるテストがあり、1テスト1アサーションにはしない。
    "vitest/max-expects": "off",
    // beforeEach と afterEach はファイル単位の準備で、describe に入れない。
    "vitest/require-top-level-describe": "off",
    // 真偽値そのものを確かめたいので toBe(true) と toBe(false) を使う。
    "vitest/prefer-to-be-truthy": "off",
    "vitest/prefer-to-be-falsy": "off",
    // expect の第2引数に失敗時のメッセージを渡す。
    "vitest/valid-expect": "off",
    // テストでは DOM の取得結果に ! を付けて書く。
    "typescript/no-non-null-assertion": "off",
  },
}));

export default defineConfig({
  extends: [core, react],
  ignorePatterns: [
    ...(core.ignorePatterns ?? []),
    "src/__snapshots__/**",
    "e2e/**/*-snapshots/**",
    "public/**",
    "dist/**",
  ],
  overrides: vitestOverrides,
  rules: {
    // 関数宣言と function コンポーネントで統一している。巻き上げにも頼っている。
    "eslint/func-style": "off",
    "react/function-component-definition": "off",
    // 原稿 JSON と生成物のキーの順は仕様(README の表の順)で、並べ替えると出力が変わる。
    "eslint/sort-keys": "off",
    // コンポーネントとフックは PascalCase と camelCase のファイル名で書く。
    "unicorn/filename-case": "off",
    // Notion API のレート制限と出力順のため、同期とビルドは逐次で処理する。
    "eslint/no-await-in-loop": "off",
    // 文字参照のコードポイントは 16 進数をそのまま書く。
    "unicorn/numeric-separators-style": "off",
    // 原稿 HTML をそのまま描画するのがこのサイトの仕様。
    "react/no-danger": "off",
    // node:path は名前付き import で書く。
    "unicorn/import-style": "off",
    // パーサ系の短い正規表現は、位置(m[1])で参照する前提で書いている。
    "eslint/prefer-named-capture-group": "off",
  },
});
