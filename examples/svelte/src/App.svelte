<script lang="ts">
  import { createTranslations } from "laravel-vite-translations/svelte";

  const { t, locale } = createTranslations({
    locale: "en",
    fallbackLocale: "en",
  });
</script>

<div>
  <h1>{$t("dashboard.title")}</h1>
  <p>{$t("dashboard.welcome", { name: "John" })}</p>

  <div>
    <h2>{$t("dashboard.stats.total")}</h2>
    <h2>{$t("dashboard.stats.active")}</h2>
    <h2>{$t("dashboard.stats.revenue")}</h2>
  </div>

  <div>
    <p>Current locale: {$locale}</p>
    <button on:click={() => locale.set("en")}>English</button>
    <button on:click={() => locale.set("nl")}>Nederlands</button>
  </div>
</div>
