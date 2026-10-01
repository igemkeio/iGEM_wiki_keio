import { defineConfig, mergeConfig } from "vitest/config";

import viteConfig from "./vite.config";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "happy-dom",
      // パースしたHTMLの<link>や<script>を取りに行かないようにする。
      environmentOptions: {
        happyDOM: {
          settings: {
            disableCSSFileLoading: true,
            disableJavaScriptFileLoading: true,
          },
        },
      },
      setupFiles: ["src/test/setup.ts"],
      include: ["src/**/*.test.{ts,tsx}"],
    },
  })
);
