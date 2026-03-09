import { TranslationProvider, useTranslations } from "laravel-vite-translations/react";

function Dashboard() {
  const { t, locale, setLocale } = useTranslations();

  return (
    <div>
      <h1>{t("dashboard.title")}</h1>
      <p>{t("dashboard.welcome", { name: "John" })}</p>

      <div>
        <h2>{t("dashboard.stats.total")}</h2>
        <h2>{t("dashboard.stats.active")}</h2>
        <h2>{t("dashboard.stats.revenue")}</h2>
      </div>

      <div>
        <p>Current locale: {locale}</p>
        <button onClick={() => setLocale("en")}>English</button>
        <button onClick={() => setLocale("nl")}>Nederlands</button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <TranslationProvider locale="en" fallbackLocale="en">
      <Dashboard />
    </TranslationProvider>
  );
}
