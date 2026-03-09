import fg from "fast-glob";
import { basename, dirname, resolve } from "node:path";
import type { ScanResult, PluginOptions } from "../types/index.js";

const DEFAULT_PATTERNS = [
  "lang/{locale}/*.php",
  "resources/lang/{locale}/*.php",
  "packages/*/lang/{locale}/*.php",
  "modules/*/lang/{locale}/*.php",
  "apps/*/lang/{locale}/*.php",
];

export async function scanWorkspace(
  root: string,
  options: PluginOptions = {}
): Promise<ScanResult> {
  const patterns = options.additionalPatterns
    ? [...DEFAULT_PATTERNS, ...options.additionalPatterns]
    : DEFAULT_PATTERNS;

  // Resolve custom lang paths
  const langPaths = options.langPaths || [];

  // Build glob patterns
  const globPatterns: string[] = [];
  for (const pattern of patterns) {
    // Replace {locale} placeholder with wildcard for initial scan
    globPatterns.push(pattern.replace("{locale}", "*"));
  }
  for (const langPath of langPaths) {
    globPatterns.push(`${langPath}/*/*.php`);
  }

  const files = await fg(globPatterns, {
    cwd: root,
    absolute: true,
    onlyFiles: true,
  });

  const locales = new Set<string>();
  const namespaces = new Map<string, Map<string, string>>();

  for (const file of files) {
    const namespace = basename(file, ".php");
    const locale = basename(dirname(file));

    locales.add(locale);

    if (!namespaces.has(namespace)) {
      namespaces.set(namespace, new Map());
    }
    namespaces.get(namespace)!.set(locale, file);
  }

  return {
    locales: [...locales].sort(),
    namespaces,
  };
}
