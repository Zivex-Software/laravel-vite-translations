import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { Plugin, PluginOption } from "vite";
import { translationsPlugin } from "./vitePlugin.js";

describe("translationsPlugin", () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("creates a virtual namespace module that registers all locales", () => {
    const root = mkdtempSync(join(tmpdir(), "lvt-plugin-"));
    tempDirs.push(root);

    mkdirSync(join(root, "resources/js/lang/translations/en"), { recursive: true });
    mkdirSync(join(root, "resources/js/lang/translations/nl"), { recursive: true });
    writeFileSync(
      join(root, "resources/js/lang/translations/en/dashboard.json"),
      JSON.stringify({ title: "Dashboard" }, null, 2)
    );
    writeFileSync(
      join(root, "resources/js/lang/translations/nl/dashboard.json"),
      JSON.stringify({ title: "Dashboard NL" }, null, 2)
    );

    const [generatorPlugin] = toPluginArray(
      translationsPlugin({
        outputDir: "resources/js/lang/translations",
      })
    );

    runHook(generatorPlugin.configResolved, { root } as any);

    const code = runHook(generatorPlugin.load, "\0virtual:lvt/dashboard") as string;

    expect(code).toContain('__registerTranslations("dashboard", "en", {');
    expect(code).toContain('"title": "Dashboard"');
    expect(code).toContain('__registerTranslations("dashboard", "nl", {');
    expect(code).toContain('"title": "Dashboard NL"');
  });

  it("normalizes legacy .json virtual ids", () => {
    const [generatorPlugin] = toPluginArray(translationsPlugin());

    const resolved = runHook(generatorPlugin.resolveId, "virtual:lvt/common.json") as string;

    expect(resolved).toBe("\0virtual:lvt/common");
  });
});

function runHook(hook: any, ...args: any[]): any {
  if (!hook) return undefined;
  return typeof hook === "function" ? hook(...args) : hook.handler(...args);
}

function toPluginArray(option: PluginOption): Plugin[] {
  const result: Plugin[] = [];
  flattenPluginOption(option, result);
  return result;
}

function flattenPluginOption(option: PluginOption, result: Plugin[]): void {
  if (!option) return;
  if (Array.isArray(option)) {
    for (const item of option) {
      flattenPluginOption(item, result);
    }
    return;
  }
  result.push(option as Plugin);
}
