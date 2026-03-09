import { createI18n } from "../runtime/runtimeLoader.js";
import { I18N_KEY } from "./useTranslations.js";
import type { I18nOptions } from "../types/index.js";
import type { App, Plugin } from "vue";

export function createTranslationsPlugin(options?: I18nOptions): Plugin {
  const i18n = createI18n(options);

  return {
    install(app: App) {
      app.provide(I18N_KEY as any, i18n);

      // Also expose as global property for template usage
      app.config.globalProperties.$t = i18n.t;
      app.config.globalProperties.$locale = i18n.getLocale;
      app.config.globalProperties.$setLocale = i18n.setLocale;
    },
  };
}
