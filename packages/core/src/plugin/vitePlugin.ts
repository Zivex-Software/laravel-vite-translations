import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve, relative } from "node:path";
import { scanWorkspace } from "../workspace/workspaceScanner.js";
import { generateTranslations } from "../generator/translationGenerator.js";
import { transformCode } from "./transform.js";
import { TransformCacheManager } from "../cache/transformCache.js";
import { logger } from "../utils/logger.js";
import { resolveToolingEnvironment } from "../utils/packageManager.js";
import type { PluginOptions } from "../types/index.js";
import type { Plugin, PluginOption, ViteDevServer } from "vite";

const VIRTUAL_PREFIX = "virtual:lvt/";
const RESOLVED_PREFIX = "\0virtual:lvt/";

export function translationsPlugin(options: PluginOptions = {}): PluginOption {
  const outputDir = options.outputDir || "resources/js/lang/translations";
  let root: string;
  let cache: TransformCacheManager;

  const generatorPlugin: Plugin = {
    name: "laravel-vite-translations:generator",
    enforce: "pre",

    configResolved(config) {
      root = config.root;
      cache = new TransformCacheManager(root);
      const toolingEnvironment = resolveToolingEnvironment(root, options);
      logger.debug(
        `Resolved tooling environment: ${toolingEnvironment.packageManager}/${toolingEnvironment.runtime}`
      );
    },

    async buildStart() {
      const scanResult = await scanWorkspace(root, options);
      await generateTranslations(scanResult, {
        ...options,
        outputDir: resolve(root, outputDir),
      });
    },

    configureServer(server: ViteDevServer) {
      // Watch lang directories for changes
      const patterns = [
        "lang/**/*.php",
        "resources/lang/**/*.php",
        "packages/*/lang/**/*.php",
        "modules/*/lang/**/*.php",
      ];

      for (const pattern of patterns) {
        server.watcher.add(pattern);
      }

      server.watcher.on("change", async (file) => {
        if (!file.endsWith(".php")) return;

        // Check if this is a translation file
        const rel = relative(root, file);
        if (!rel.includes("lang/")) return;

        logger.info(`Translation file changed: ${rel}`);

        const scanResult = await scanWorkspace(root, options);
        await generateTranslations(scanResult, {
          ...options,
          outputDir: resolve(root, outputDir),
        });

        server.hot.send({ type: "full-reload" });
      });
    },

    resolveId(id) {
      if (id.startsWith(VIRTUAL_PREFIX)) {
        return "\0" + normalizeVirtualId(id);
      }
      return null;
    },

    load(id) {
      if (!id.startsWith(RESOLVED_PREFIX)) return null;

      // Parse: virtual:lvt/{namespace}
      const path = id.slice(RESOLVED_PREFIX.length);
      const namespace = stripLegacyJsonSuffix(path);
      if (!namespace) return null;

      const generatedRoot = resolve(root, outputDir);
      const locales = existsSync(generatedRoot)
        ? readdirSync(generatedRoot, { withFileTypes: true })
            .filter((entry) => entry.isDirectory())
            .map((entry) => entry.name)
        : [];

      const registrations = locales
        .map((locale) => {
          const jsonPath = resolve(generatedRoot, locale, `${namespace}.json`);
          if (!existsSync(jsonPath)) return null;

          const content = readFileSync(jsonPath, "utf-8");
          return `__registerTranslations(${JSON.stringify(namespace)}, ${JSON.stringify(locale)}, ${content});`;
        })
        .filter(Boolean)
        .join("\n");

      return `
        import { __registerTranslations } from "@zivex/laravel-vite-translations/runtime";
        ${registrations}
        export default {};
      `;
    },
  };

  const transformPlugin: Plugin = {
    name: "laravel-vite-translations:transform",
    enforce: "pre",

    transform(code, id) {
      // Skip node_modules and virtual modules
      if (id.includes("node_modules") || id.startsWith("\0")) return null;

      // Only process JS/TS/Vue/Svelte files
      if (!/\.(js|jsx|ts|tsx|vue|svelte|mjs|mts)$/.test(id)) return null;

      // Check cache
      const cached = cache.get(id, code);
      if (cached) {
        if (cached.namespaces.length === 0) return null;

        // Re-inject imports from cache
        const imports = cached.namespaces
          .map((ns) => `import "virtual:lvt/${ns}";`)
          .join("\n");
        return {
          code: imports + "\n" + code,
          map: null,
        };
      }

      const result = transformCode(code, id);

      // Cache the result
      const namespaces = result ? extractNamespacesFromResult(result.code) : [];
      cache.set(id, code, namespaces);

      if (!result) return null;
      return { code: result.code, map: result.map as any };
    },

    buildEnd() {
      cache.save();
    },
  };

  return [generatorPlugin, transformPlugin];
}

function extractNamespacesFromResult(code: string): string[] {
  const namespaces: string[] = [];
  const regex = /import "virtual:lvt\/([^"]+)"/g;
  let match;
  while ((match = regex.exec(code)) !== null) {
    namespaces.push(stripLegacyJsonSuffix(match[1]));
  }
  return namespaces;
}

function normalizeVirtualId(id: string): string {
  if (!id.startsWith(VIRTUAL_PREFIX)) return id;
  return `${VIRTUAL_PREFIX}${stripLegacyJsonSuffix(id.slice(VIRTUAL_PREFIX.length))}`;
}

function stripLegacyJsonSuffix(value: string): string {
  return value.endsWith(".json") ? value.slice(0, -5) : value;
}
