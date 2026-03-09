import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "runtime/index": "src/runtime/index.ts",
    "react/index": "src/react/index.ts",
    "vue/index": "src/vue/index.ts",
    "svelte/index": "src/svelte/index.ts",
    "eslint/index": "src/eslint/index.ts",
    preload: "src/plugin/preload.ts",
    cli: "src/cli/index.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  splitting: true,
  clean: true,
  external: ["vite", "react", "vue", "svelte", "eslint", "@typescript-eslint/utils"],
  banner({ format }) {
    if (format === "esm") {
      return {};
    }
    return {};
  },
});
