import type { TranslationRecord, FlatTranslations } from "../types/index.js";

export function flattenTranslations(
  record: TranslationRecord,
  prefix: string = ""
): FlatTranslations {
  const result: FlatTranslations = {};

  for (const [key, value] of Object.entries(record)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (value !== null && typeof value === "object") {
      Object.assign(result, flattenTranslations(value as TranslationRecord, fullKey));
    } else {
      result[fullKey] = value === null ? "" : String(value);
    }
  }

  return result;
}
