import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import translations from "laravel-vite-translations";

export default defineConfig({
  plugins: [
    ...translations({
      defaultLocale: "en",
      outputDir: "src/i18n/generated",
    }),
    svelte(),
  ],
});
