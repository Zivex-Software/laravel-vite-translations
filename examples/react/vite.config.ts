import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import translations from "laravel-vite-translations";

export default defineConfig({
  plugins: [
    ...translations({
      defaultLocale: "en",
      outputDir: "src/i18n/generated",
    }),
    react(),
  ],
});
