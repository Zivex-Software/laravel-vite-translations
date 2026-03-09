import { logger } from "../utils/logger.js";

interface OverrideCache {
  [locale: string]: Record<string, string>;
}

export class OverrideLoader {
  private cdnUrl: string;
  private cache: OverrideCache = {};
  private pending = new Map<string, Promise<Record<string, string>>>();

  constructor(cdnUrl: string) {
    this.cdnUrl = cdnUrl.replace(/\/$/, "");
  }

  async load(locale: string): Promise<Record<string, string>> {
    // Return cached
    if (this.cache[locale]) return this.cache[locale];

    // Return pending
    if (this.pending.has(locale)) return this.pending.get(locale)!;

    const promise = this.fetchWithRetry(locale);
    this.pending.set(locale, promise);

    try {
      const result = await promise;
      this.cache[locale] = result;
      return result;
    } finally {
      this.pending.delete(locale);
    }
  }

  private async fetchWithRetry(
    locale: string,
    retries: number = 3
  ): Promise<Record<string, string>> {
    const url = `${this.cdnUrl}/${locale}.json`;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return (await response.json()) as Record<string, string>;
      } catch (error) {
        if (attempt === retries) {
          logger.warn(`Failed to fetch CDN overrides for ${locale}: ${error}`);
          return {};
        }
        // Exponential backoff
        await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 100));
      }
    }

    return {};
  }

  get(locale: string, key: string): string | undefined {
    return this.cache[locale]?.[key];
  }

  invalidate(locale: string): void {
    delete this.cache[locale];
  }

  invalidateAll(): void {
    this.cache = {};
  }
}
