import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import translations from "@zivex/laravel-vite-translations";

export default defineConfig({
  plugins: [
    ...translations({
      defaultLocale: "en",
      outputDir: "src/lang/translations",
    }),
    react(),
  ],
});
