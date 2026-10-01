import { defineConfig } from "oxfmt";
import ultracite from "ultracite/oxfmt";

export default defineConfig({
  ...ultracite,
  ignorePatterns: [
    ...(ultracite.ignorePatterns ?? []),
    "src/__snapshots__/**",
    "e2e/**/*-snapshots/**",
    "public/**",
    "dist/**",
    "**/*-lock.json",
  ],
});
