export interface TranslationRecord {
  [key: string]: string | number | null | TranslationRecord;
}

export interface FlatTranslations {
  [key: string]: string;
}

export interface TranslationIndexEntry {
  namespace: string;
  file: string;
  locales: string[];
}

export interface TranslationIndex {
  [key: string]: TranslationIndexEntry;
}

export interface ScanResult {
  locales: string[];
  namespaces: Map<string, Map<string, string>>; // namespace -> locale -> filePath
}

export interface GenerationResult {
  index: TranslationIndex;
  namespaces: string[];
  locales: string[];
  filesWritten: number;
}

export interface PluginOptions {
  /** Directories to scan for translation files */
  langPaths?: string[];
  /** Output directory for generated JSON */
  outputDir?: string;
  /** Default locale */
  defaultLocale?: string;
  /** CDN URL for override translations */
  cdnUrl?: string | null;
  /** Enable TypeScript type generation */
  generateTypes?: boolean;
  /** Output path for generated .d.ts */
  typesOutputPath?: string;
  /** Additional glob patterns for translation directories */
  additionalPatterns?: string[];
}

export interface I18nOptions {
  /** Initial locale */
  locale?: string;
  /** Default/fallback locale */
  fallbackLocale?: string;
  /** CDN URL for override translations */
  cdnUrl?: string | null;
}

export interface I18nInstance {
  t: TranslateFunction;
  setLocale: (locale: string) => Promise<void>;
  getLocale: () => string;
  preload: (key: string) => Promise<void>;
  onLocaleChange: (cb: (locale: string) => void) => () => void;
}

export type TranslateFunction = (key: string, params?: Record<string, string | number>) => string;

export interface TransformResult {
  code: string;
  map?: { mappings: string; [key: string]: unknown } | null;
}

export interface CacheEntry {
  hash: string;
  namespaces: string[];
  timestamp: number;
}

export interface TransformCache {
  [filePath: string]: CacheEntry;
}

export interface DiagnosticItem {
  severity: "error" | "warning" | "info";
  message: string;
  file?: string;
  key?: string;
}
