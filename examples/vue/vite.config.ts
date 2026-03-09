import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import translations from "laravel-vite-translations";

export default defineConfig({
  plugins: [
    ...translations({
      defaultLocale: "en",
      outputDir: "src/i18n/generated",
    }),
    vue(),
  ],
});
