import { LocaleManager } from "./localeManager.js";
import { OverrideLoader } from "./overrideLoader.js";
import type { I18nInstance, I18nOptions, TranslateFunction } from "../types/index.js";

// Global translation store: locale -> namespace -> key -> value
const translations = new Map<string, Map<string, Record<string, string>>>();

/**
 * Register translations for a namespace and locale.
 * Called by virtual module imports.
 */
export function __registerTranslations(
  namespace: string,
  locale: string,
  data: Record<string, string>
): void {
  if (!translations.has(locale)) {
    translations.set(locale, new Map());
  }
  translations.get(locale)!.set(namespace, data);
}

export function createI18n(options: I18nOptions = {}): I18nInstance {
  const localeManager = new LocaleManager(options.locale, options.fallbackLocale);
  const overrideLoader = options.cdnUrl ? new OverrideLoader(options.cdnUrl) : null;

  // Pre-load overrides for current locale
  if (overrideLoader) {
    overrideLoader.load(localeManager.getLocale());
  }

  const t: TranslateFunction = (key, params) => {
    const locale = localeManager.getLocale();
    const fallback = localeManager.getFallbackLocale();

    // 1. Check CDN overrides
    if (overrideLoader) {
      const override = overrideLoader.get(locale, key);
      if (override !== undefined) {
        return interpolate(override, params);
      }
    }

    // 2. Check local translations
    const value = lookupKey(locale, key) ?? lookupKey(fallback, key);
    if (value !== undefined) {
      return interpolate(value, params);
    }

    // 3. Fallback to key
    return key;
  };

  const setLocale = async (locale: string): Promise<void> => {
    if (overrideLoader) {
      overrideLoader.invalidate(localeManager.getLocale());
      await overrideLoader.load(locale);
    }
    localeManager.setLocale(locale);
  };

  const getLocale = (): string => {
    return localeManager.getLocale();
  };

  const preloadFn = async (key: string): Promise<void> => {
    // Namespace extraction - the actual import is handled by the Vite plugin transform
    // This is a no-op at runtime since imports are injected at build time
    const dotIndex = key.indexOf(".");
    if (dotIndex <= 0) return;
    // The namespace chunk will already be loaded via virtual module import
  };

  const onLocaleChange = (cb: (locale: string) => void): (() => void) => {
    return localeManager.onLocaleChange(cb);
  };

  return { t, setLocale, getLocale, preload: preloadFn, onLocaleChange };
}

function lookupKey(locale: string, key: string): string | undefined {
  const dotIndex = key.indexOf(".");
  if (dotIndex <= 0) return undefined;

  const namespace = key.substring(0, dotIndex);
  const subKey = key.substring(dotIndex + 1);

  const localeMap = translations.get(locale);
  if (!localeMap) return undefined;

  const nsData = localeMap.get(namespace);
  if (!nsData) return undefined;

  return nsData[subKey];
}

function interpolate(
  value: string,
  params?: Record<string, string | number>
): string {
  if (!params) return value;

  return value.replace(/:(\w+)/g, (_, key) => {
    return params[key] !== undefined ? String(params[key]) : `:${key}`;
  });
}
