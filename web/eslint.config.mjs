import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";
import prettier from "eslint-config-prettier";

// eslint-config-next 14 は eslintrc 形式のため、FlatCompat で flat config に取り込む。
const __dirname = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // Prettier と競合するフォーマット系ルールを無効化（必ず最後に置く）
  prettier,
  // eslint-config-next の既定 ignore を再掲。
  {
    // ベンダー資産（bootstrap 等の圧縮JS）やビルド成果物は lint しない。
    ignores: ["public/**", ".next/**", "out/**", "build/**", "next-env.d.ts"],
  },
];

export default eslintConfig;
