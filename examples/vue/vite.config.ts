import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import translations from "@zivex/laravel-vite-translations";

export default defineConfig({
  plugins: [
    translations({
      defaultLocale: "en",
      outputDir: "src/lang/translations",
    }),
    vue(),
  ],
});
