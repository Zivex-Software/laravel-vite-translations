import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { parsePhpTranslationFile } from "./phpParser.js";
import { flattenTranslations } from "./flatten.js";
import { generateTypeDeclaration } from "../types/keyGenerator.js";
import { logger } from "../utils/logger.js";
import type {
  ScanResult,
  GenerationResult,
  TranslationIndex,
  FlatTranslations,
  PluginOptions,
} from "../types/index.js";

export async function generateTranslations(
  scanResult: ScanResult,
  options: PluginOptions
): Promise<GenerationResult> {
  const outputDir = options.outputDir || "resources/js/i18n/generated";
  const index: TranslationIndex = {};
  let filesWritten = 0;

  for (const [namespace, localeFiles] of scanResult.namespaces) {
    for (const [locale, filePath] of localeFiles) {
      const record = await parsePhpTranslationFile(filePath);
      const flat = flattenTranslations(record);

      // Build index entries
      for (const key of Object.keys(flat)) {
        const fullKey = `${namespace}.${key}`;
        if (!index[fullKey]) {
          index[fullKey] = {
            namespace,
            file: filePath,
            locales: [],
          };
        }
        if (!index[fullKey].locales.includes(locale)) {
          index[fullKey].locales.push(locale);
        }
      }

      // Write JSON file
      const outDir = join(outputDir, locale);
      await mkdir(outDir, { recursive: true });

      const outFile = join(outDir, `${namespace}.json`);
      const newContent = JSON.stringify(flat, null, 2);

      // Only write if changed
      if (existsSync(outFile)) {
        try {
          const existing = await readFile(outFile, "utf-8");
          if (existing === newContent) continue;
        } catch {
          // File read failed, write anyway
        }
      }

      await writeFile(outFile, newContent, "utf-8");
      filesWritten++;
    }
  }

  // Write translation index
  await mkdir(outputDir, { recursive: true });
  const indexPath = join(outputDir, "translation-index.json");
  await writeFile(indexPath, JSON.stringify(index, null, 2), "utf-8");

  // Generate TypeScript types if enabled
  if (options.generateTypes !== false) {
    const typesPath = options.typesOutputPath || "resources/js/i18n/translations.d.ts";
    const typesDir = join(typesPath, "..");
    await mkdir(typesDir, { recursive: true });
    const declaration = generateTypeDeclaration(index);
    await writeFile(typesPath, declaration, "utf-8");
    logger.success(`Generated types at ${typesPath}`);
  }

  const namespaces = [...scanResult.namespaces.keys()];
  logger.success(
    `Generated ${filesWritten} files for ${namespaces.length} namespaces across ${scanResult.locales.length} locales`
  );

  return {
    index,
    namespaces,
    locales: scanResult.locales,
    filesWritten,
  };
}
