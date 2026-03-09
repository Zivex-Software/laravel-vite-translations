import { writable, derived, type Readable, type Writable } from "svelte/store";
import { createI18n } from "../runtime/runtimeLoader.js";
import type { I18nOptions, TranslateFunction } from "../types/index.js";

export interface TranslationStore {
  t: Readable<TranslateFunction>;
  locale: Writable<string>;
}

export function createTranslations(options?: I18nOptions): TranslationStore {
  const i18n = createI18n(options);

  const locale = writable(i18n.getLocale());

  // Sync locale changes
  i18n.onLocaleChange((newLocale) => {
    locale.set(newLocale);
  });

  // Subscribe to store changes to update i18n
  locale.subscribe((value) => {
    if (value !== i18n.getLocale()) {
      i18n.setLocale(value);
    }
  });

  const t = derived(locale, () => {
    return ((key: string, params?: Record<string, string | number>) =>
      i18n.t(key, params)) as TranslateFunction;
  });

  return { t, locale };
}
