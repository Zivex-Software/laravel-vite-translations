<script setup lang="ts">
import { useTranslations } from "@zivex/laravel-vite-translations/vue";

const { t, locale, setLocale } = useTranslations();
</script>

<template>
  <div>
    <h1>{{ t("dashboard.title") }}</h1>
    <p>{{ t("dashboard.welcome", { name: "John" }) }}</p>

    <div>
      <h2>{{ t("dashboard.stats.total") }}</h2>
      <h2>{{ t("dashboard.stats.active") }}</h2>
      <h2>{{ t("dashboard.stats.revenue") }}</h2>
    </div>

    <div>
      <p>Current locale: {{ locale }}</p>
      <button @click="setLocale('en')">English</button>
      <button @click="setLocale('nl')">Nederlands</button>
    </div>
  </div>
</template>
