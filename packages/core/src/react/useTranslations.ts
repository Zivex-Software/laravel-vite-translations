import { useContext, useCallback, useSyncExternalStore } from "react";
import { TranslationContext } from "./context.js";
import type { TranslateFunction } from "../types/index.js";

export interface UseTranslationsReturn {
  t: TranslateFunction;
  locale: string;
  setLocale: (locale: string) => Promise<void>;
}

export function useTranslations(): UseTranslationsReturn {
  const i18n = useContext(TranslationContext);

  if (!i18n) {
    throw new Error(
      "useTranslations must be used within a <TranslationProvider>. " +
        "Wrap your app with <TranslationProvider> from 'laravel-vite-translations/react'."
    );
  }

  const locale = useSyncExternalStore(
    i18n.onLocaleChange,
    i18n.getLocale,
    i18n.getLocale
  );

  const t: TranslateFunction = useCallback(
    (key, params) => i18n.t(key, params),
    [i18n, locale]
  );

  return {
    t,
    locale,
    setLocale: i18n.setLocale,
  };
}
