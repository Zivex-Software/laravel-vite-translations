type LocaleChangeCallback = (locale: string) => void;

export class LocaleManager {
  private locale: string;
  private fallbackLocale: string;
  private listeners = new Set<LocaleChangeCallback>();

  constructor(locale?: string, fallbackLocale: string = "en") {
    this.fallbackLocale = fallbackLocale;
    this.locale = locale || this.detectLocale();
  }

  private detectLocale(): string {
    // 1. localStorage
    if (typeof window !== "undefined" && window.localStorage) {
      const stored = localStorage.getItem("lvt-locale");
      if (stored) return stored;
    }

    // 2. HTML lang attribute
    if (typeof document !== "undefined") {
      const htmlLang = document.documentElement.lang;
      if (htmlLang) return htmlLang;
    }

    // 3. Browser language
    if (typeof navigator !== "undefined" && navigator.language) {
      return navigator.language.split("-")[0];
    }

    // 4. Default
    return this.fallbackLocale;
  }

  getLocale(): string {
    return this.locale;
  }

  getFallbackLocale(): string {
    return this.fallbackLocale;
  }

  setLocale(locale: string): void {
    this.locale = locale;

    // Persist to localStorage
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("lvt-locale", locale);
    }

    // Notify listeners
    for (const cb of this.listeners) {
      cb(locale);
    }
  }

  onLocaleChange(cb: LocaleChangeCallback): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }
}
