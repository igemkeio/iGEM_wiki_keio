import { defineConfig } from "oxfmt";
import ultracite from "ultracite/oxfmt";

export default defineConfig({
  ...ultracite,
  ignorePatterns: [
    ...(ultracite.ignorePatterns ?? []),
    "src/__snapshots__/**",
    "e2e/**/*-snapshots/**",
    "public/fonts/**",
    "public/images/**",
    "public/models/**",
    "public/notion-files/**",
    "public/notion-images/**",
    "dist/**",
    "**/*-lock.json",
  ],
});
