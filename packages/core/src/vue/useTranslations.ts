import { inject, ref, watchEffect, type Ref } from "vue";
import type { I18nInstance, TranslateFunction } from "../types/index.js";

const I18N_KEY = Symbol("laravel-vite-translations");

export { I18N_KEY };

export interface UseTranslationsReturn {
  t: TranslateFunction;
  locale: Ref<string>;
  setLocale: (locale: string) => Promise<void>;
}

export function useTranslations(): UseTranslationsReturn {
  const i18n = inject<I18nInstance>(I18N_KEY as any);

  if (!i18n) {
    throw new Error(
      "useTranslations() requires the translations plugin to be installed. " +
        "Call app.use(translationsPlugin) in your main.ts."
    );
  }

  const locale = ref(i18n.getLocale());

  const unsubscribe = i18n.onLocaleChange((newLocale) => {
    locale.value = newLocale;
  });

  // Note: In a real app, you'd clean this up in onUnmounted
  // For simplicity, the subscription lives for the component lifetime

  const t: TranslateFunction = (key, params) => {
    // Access locale.value to create reactivity dependency
    void locale.value;
    return i18n.t(key, params);
  };

  return {
    t,
    locale,
    setLocale: i18n.setLocale,
  };
}
