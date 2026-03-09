import React, { type ReactNode } from "react";
import { createI18n } from "../runtime/runtimeLoader.js";
import { TranslationContext } from "./context.js";
import type { I18nOptions } from "../types/index.js";

export { useTranslations } from "./useTranslations.js";
export { TranslationContext } from "./context.js";
export type { UseTranslationsReturn } from "./useTranslations.js";

interface TranslationProviderProps {
  children: ReactNode;
  locale?: string;
  fallbackLocale?: string;
  cdnUrl?: string | null;
}

const instanceCache = new Map<string, ReturnType<typeof createI18n>>();

export function TranslationProvider({
  children,
  locale,
  fallbackLocale,
  cdnUrl,
}: TranslationProviderProps) {
  const cacheKey = `${locale}:${fallbackLocale}:${cdnUrl}`;

  if (!instanceCache.has(cacheKey)) {
    instanceCache.set(cacheKey, createI18n({ locale, fallbackLocale, cdnUrl }));
  }

  const i18n = instanceCache.get(cacheKey)!;

  return React.createElement(
    TranslationContext.Provider,
    { value: i18n },
    children
  );
}
