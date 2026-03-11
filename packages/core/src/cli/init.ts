import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, join } from "node:path";
import prompts from "prompts";
import chalk from "chalk";
import { logger } from "../utils/logger.js";
import {
  getBinaryCommand,
  getScriptCommand,
  resolveToolingEnvironment,
  type ToolingEnvironmentOptions,
} from "../utils/packageManager.js";
import type { PackageManagerPreference, RuntimePreference } from "../types/index.js";

interface InitOptions {
  locale: string;
  framework?: string;
  langPath?: string;
  packageManager?: PackageManagerPreference;
  runtime?: RuntimePreference;
  codemod: boolean;
}

export async function initCommand(options: InitOptions): Promise<void> {
  logger.info("Initializing laravel-vite-translations...\n");

  const root = process.cwd();

  // Detect framework if not provided
  let framework = options.framework;
  if (!framework) {
    framework = detectFramework(root);
    if (framework) {
      logger.info(`Detected framework: ${chalk.bold(framework)}`);
    } else {
      const response = await prompts({
        type: "select",
        name: "framework",
        message: "Which frontend framework are you using?",
        choices: [
          { title: "React", value: "react" },
          { title: "Vue", value: "vue" },
          { title: "Svelte", value: "svelte" },
        ],
      });
      framework = response.framework;
    }
  }

  // Detect lang path
  let langPath = options.langPath;
  if (!langPath) {
    if (existsSync(resolve(root, "lang"))) {
      langPath = "lang";
    } else if (existsSync(resolve(root, "resources/lang"))) {
      langPath = "resources/lang";
    } else {
      const response = await prompts({
        type: "text",
        name: "langPath",
        message: "Where are your translation files?",
        initial: "lang",
      });
      langPath = response.langPath;
    }
  }

  // Detect locale
  const locale = options.locale || "en";
  const toolingEnvironment = resolveToolingEnvironment(root, {
    packageManager: options.packageManager,
    runtime: options.runtime,
  });
  logger.info(`Default locale: ${chalk.bold(locale)}`);
  logger.info(`Language path: ${chalk.bold(langPath)}`);
  logger.info(`Package manager: ${chalk.bold(toolingEnvironment.packageManager)}`);
  logger.info(`Runtime: ${chalk.bold(toolingEnvironment.runtime)}`);

  // Patch vite.config.ts
  patchViteConfig(root, {
    packageManager: options.packageManager,
    runtime: options.runtime,
  });

  // Generate runtime loader
  generateRuntimeLoader(root, framework!, locale);

  logger.success("\nInitialization complete!");
  logger.info("\nNext steps:");
  logger.info(
    `  1. Run ${chalk.cyan(
      getScriptCommand(toolingEnvironment.packageManager, "dev")
    )} to start the dev server`
  );
  logger.info(`  2. Import translations in your components`);

  if (options.codemod) {
    logger.info(
      `\n  Run ${chalk.cyan(
        getBinaryCommand(toolingEnvironment, "laravel-vite-translations", ["codemod"])
      )} to convert existing __() calls`
    );
  }
}

function detectFramework(root: string): string | undefined {
  try {
    const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf-8"));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    if (deps["react"] || deps["@vitejs/plugin-react"]) return "react";
    if (deps["vue"] || deps["@vitejs/plugin-vue"]) return "vue";
    if (deps["svelte"] || deps["@sveltejs/vite-plugin-svelte"]) return "svelte";
  } catch {
    // No package.json
  }
  return undefined;
}

function patchViteConfig(root: string, toolingOptions: ToolingEnvironmentOptions): void {
  const configFiles = ["vite.config.ts", "vite.config.js", "vite.config.mts"];
  let configFile: string | null = null;

  for (const file of configFiles) {
    if (existsSync(resolve(root, file))) {
      configFile = file;
      break;
    }
  }

  if (!configFile) {
    logger.warn("No vite.config.ts found. Please add the plugin manually.");
    return;
  }

  const configPath = resolve(root, configFile);
  let content = readFileSync(configPath, "utf-8");

  // Check if already configured
  if (content.includes("laravel-vite-translations")) {
    logger.info("Vite config already includes laravel-vite-translations");
    return;
  }

  // Add import
  const importLine = `import translations from "@zivex/laravel-vite-translations";\n`;
  content = importLine + content;

  // Add to plugins array
  content = content.replace(
    /plugins:\s*\[/,
    `plugins: [\n    ${buildTranslationsCall(toolingOptions)},`
  );

  writeFileSync(configPath, content, "utf-8");
  logger.success(`Patched ${configFile}`);
}

function buildTranslationsCall(options: ToolingEnvironmentOptions): string {
  const properties: string[] = [];

  if (options.packageManager && options.packageManager !== "auto") {
    properties.push(`packageManager: "${options.packageManager}"`);
  }

  if (options.runtime && options.runtime !== "auto") {
    properties.push(`runtime: "${options.runtime}"`);
  }

  return properties.length === 0
    ? "translations()"
    : `translations({ ${properties.join(", ")} })`;
}

function generateRuntimeLoader(root: string, framework: string, locale: string): void {
  const outDir = resolve(root, "resources/js/lang");
  mkdirSync(outDir, { recursive: true });

  let content: string;

  switch (framework) {
    case "react":
      content = `import { createI18n } from "@zivex/laravel-vite-translations/runtime";

export const { t, setLocale, getLocale, onLocaleChange } = createI18n({
  locale: "${locale}",
  fallbackLocale: "${locale}",
});
`;
      break;

    case "vue":
      content = `import { createTranslationsPlugin } from "@zivex/laravel-vite-translations/vue";

export const translationsPlugin = createTranslationsPlugin({
  locale: "${locale}",
  fallbackLocale: "${locale}",
});
`;
      break;

    case "svelte":
      content = `import { createTranslations } from "@zivex/laravel-vite-translations/svelte";

export const { t, locale } = createTranslations({
  locale: "${locale}",
  fallbackLocale: "${locale}",
});
`;
      break;

    default:
      content = `import { createI18n } from "@zivex/laravel-vite-translations/runtime";

export const { t, setLocale, getLocale, onLocaleChange } = createI18n({
  locale: "${locale}",
  fallbackLocale: "${locale}",
});
`;
  }

  const outFile = join(outDir, "index.ts");
  writeFileSync(outFile, content, "utf-8");
  logger.success(`Generated runtime loader at resources/js/lang/index.ts`);
}
