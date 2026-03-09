import { readFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import fg from "fast-glob";
import chalk from "chalk";
import { scanWorkspace } from "../workspace/workspaceScanner.js";
import { generateTranslations } from "../generator/translationGenerator.js";
import { logger } from "../utils/logger.js";
import type { DiagnosticItem, TranslationIndex } from "../types/index.js";

interface DoctorOptions {
  dir: string;
  langPath?: string;
  json?: boolean;
}

export async function doctorCommand(options: DoctorOptions): Promise<void> {
  const root = process.cwd();
  const diagnostics: DiagnosticItem[] = [];

  logger.info("Running diagnostics...\n");

  // 1. Scan workspace and generate index
  const scanResult = await scanWorkspace(root, { langPaths: options.langPath ? [options.langPath] : undefined });

  if (scanResult.locales.length === 0) {
    diagnostics.push({
      severity: "error",
      message: "No translation files found. Check your lang directory path.",
    });
    outputDiagnostics(diagnostics, options.json);
    return;
  }

  logger.info(`Found ${scanResult.locales.length} locales: ${scanResult.locales.join(", ")}`);
  logger.info(`Found ${scanResult.namespaces.size} namespaces\n`);

  // Generate translations to get the index
  const outputDir = resolve(root, ".laravel-vite-translations-doctor");
  const genResult = await generateTranslations(scanResult, {
    outputDir,
    generateTypes: false,
  });
  const index = genResult.index;

  // 2. Find all t() calls in source code
  const keysInCode = await findTranslationKeysInCode(root, options.dir);

  // 3. Check for missing translations
  for (const key of keysInCode) {
    if (!index[key]) {
      diagnostics.push({
        severity: "error",
        message: `Missing translation key: "${key}"`,
        key,
      });
    } else {
      // Check for missing locales
      const entry = index[key];
      for (const locale of scanResult.locales) {
        if (!entry.locales.includes(locale)) {
          diagnostics.push({
            severity: "warning",
            message: `Key "${key}" is missing for locale "${locale}"`,
            key,
          });
        }
      }
    }
  }

  // 4. Check for unused translations
  const indexKeys = new Set(Object.keys(index));
  for (const key of indexKeys) {
    if (!keysInCode.has(key)) {
      diagnostics.push({
        severity: "info",
        message: `Unused translation key: "${key}"`,
        key,
      });
    }
  }

  // 5. Check for hardcoded text (basic check)
  const hardcodedCount = await scanForHardcodedText(root, options.dir);
  if (hardcodedCount > 0) {
    diagnostics.push({
      severity: "warning",
      message: `Found ${hardcodedCount} potential hardcoded text strings in JSX/templates`,
    });
  }

  outputDiagnostics(diagnostics, options.json);

  // Cleanup temp dir
  try {
    const { rmSync } = await import("node:fs");
    rmSync(outputDir, { recursive: true, force: true });
  } catch {
    // Cleanup failed, not critical
  }
}

async function findTranslationKeysInCode(root: string, dir: string): Promise<Set<string>> {
  const keys = new Set<string>();
  const files = await fg(["**/*.{js,jsx,ts,tsx,vue,svelte}"], {
    cwd: resolve(root, dir),
    absolute: true,
    ignore: ["**/node_modules/**"],
  });

  for (const file of files) {
    const content = readFileSync(file, "utf-8");
    // Match t("key") and t('key') patterns
    const regex = /\bt\(\s*["']([^"']+)["']/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      keys.add(match[1]);
    }
  }

  return keys;
}

async function scanForHardcodedText(root: string, dir: string): Promise<number> {
  let count = 0;
  const files = await fg(["**/*.{jsx,tsx,vue,svelte}"], {
    cwd: resolve(root, dir),
    absolute: true,
    ignore: ["**/node_modules/**"],
  });

  for (const file of files) {
    const content = readFileSync(file, "utf-8");
    // Basic check: text content in JSX/HTML elements
    const regex = />([A-Z][a-z]+(?:\s+[A-Za-z]+){1,})</g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      count++;
    }
  }

  return count;
}

function outputDiagnostics(diagnostics: DiagnosticItem[], json?: boolean): void {
  if (json) {
    console.log(JSON.stringify(diagnostics, null, 2));
    return;
  }

  const errors = diagnostics.filter((d) => d.severity === "error");
  const warnings = diagnostics.filter((d) => d.severity === "warning");
  const infos = diagnostics.filter((d) => d.severity === "info");

  console.log("");

  if (errors.length > 0) {
    console.log(chalk.red.bold(`Errors (${errors.length}):`));
    for (const d of errors) {
      console.log(chalk.red(`  ✗ ${d.message}`));
    }
    console.log("");
  }

  if (warnings.length > 0) {
    console.log(chalk.yellow.bold(`Warnings (${warnings.length}):`));
    for (const d of warnings) {
      console.log(chalk.yellow(`  ⚠ ${d.message}`));
    }
    console.log("");
  }

  if (infos.length > 0) {
    console.log(chalk.blue.bold(`Info (${infos.length}):`));
    for (const d of infos) {
      console.log(chalk.blue(`  ℹ ${d.message}`));
    }
    console.log("");
  }

  if (diagnostics.length === 0) {
    console.log(chalk.green.bold("✓ No issues found!"));
  } else {
    console.log(
      `Total: ${errors.length} errors, ${warnings.length} warnings, ${infos.length} info`
    );
  }
}
