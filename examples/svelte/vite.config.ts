import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import translations from "@zivex/laravel-vite-translations";

export default defineConfig({
  plugins: [
    ...translations({
      defaultLocale: "en",
      outputDir: "src/lang/translations",
    }),
    svelte(),
  ],
});
