<p align="center">
  <img src="https://laravel.com/img/logomark.min.svg" height="40" alt="Laravel" />
  &nbsp;&nbsp;
  <img src="https://vitejs.dev/logo.svg" height="40" alt="Vite" />
</p>

<h1 align="center">laravel-vite-translations</h1>

<p align="center">
  Use your Laravel PHP translations directly in React, Vue, and Svelte — with full Vite HMR, namespace code-splitting, CDN overrides, and type safety.
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a>&nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="#how-it-works">How It Works</a>&nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="#framework-guides">React</a>&nbsp;/&nbsp;<a href="#vue">Vue</a>&nbsp;/&nbsp;<a href="#svelte">Svelte</a>&nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="#cli">CLI</a>&nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="#eslint-plugin">ESLint</a>&nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="#vscode-extension">VSCode</a>
</p>

---

## Why

Laravel has a great translation system. But when your frontend lives in React, Vue, or Svelte, you end up duplicating strings in JSON, manually syncing keys, and losing the structure Laravel gives you.

This plugin bridges the gap. Write translations in PHP the Laravel way, and use them in your frontend with zero duplication, automatic code-splitting, and full HMR.

## Features

- **Zero duplication** — PHP translation files are the single source of truth
- **Namespace code-splitting** — only loads the translations each page actually uses
- **Vite HMR** — edit a `.php` file, see the change instantly
- **CDN overrides** — ship translation fixes without redeploying
- **TypeScript autocomplete** — generated types for every translation key
- **Framework adapters** — first-class React, Vue, and Svelte support
- **Laravel-style interpolation** — `:name` parameters work exactly like Blade
- **ESLint plugin** — catch hardcoded text and invalid keys at lint time
- **VSCode extension** — autocomplete, diagnostics, and go-to-definition
- **CLI tools** — `init`, `codemod` (migrate from `__()`), and `doctor`
- **Optimized for scale** — incremental caching, designed for 300+ pages and 5000+ keys

## Quick Start

### Install

```bash
npm install @zivex/laravel-vite-translations
# or
pnpm add @zivex/laravel-vite-translations
# or
bun add @zivex/laravel-vite-translations
```

### Add the Vite Plugin

```ts
// vite.config.ts
import { defineConfig } from "vite";
import translations from "@zivex/laravel-vite-translations";

export default defineConfig({
  plugins: [
    translations({
      defaultLocale: "en",
      // Optional: override auto-detected tooling
      packageManager: "bun",
      runtime: "bun",
    }),
    // ... your framework plugin (react/vue/svelte)
  ],
});
```

Package manager and runtime are auto-detected from `package.json`, lockfiles, the current user agent, and Bun runtime signals. Only set `packageManager` or `runtime` when you want to override detection manually.

### Write Translations in PHP (the Laravel way)

```php
// lang/en/dashboard.php
<?php

return [
    'title' => 'Dashboard',
    'welcome' => 'Welcome, :name!',
    'stats' => [
        'total' => 'Total Users',
        'active' => 'Active Users',
    ],
];
```

### Use in Your Components

```tsx
// React
const { t } = useTranslations();

t("dashboard.title");                        // "Dashboard"
t("dashboard.welcome", { name: "Taylor" });  // "Welcome, Taylor!"
t("dashboard.stats.total");                  // "Total Users"
```

That's it. The plugin handles everything else — parsing PHP, generating JSON chunks, injecting imports, and loading only what's needed.

---

## How It Works

```
lang/en/dashboard.php ─────┐
lang/en/billing.php ───────┤
lang/nl/dashboard.php ─────┤
                            ▼
                   ┌─────────────────┐
                   │  PHP Parser +   │
                   │  Generator      │  buildStart / watch
                   └────────┬────────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
        en/dashboard  en/billing   nl/dashboard    ← JSON chunks
              │             │             │
              └─────────────┼─────────────┘
                            ▼
                   ┌─────────────────┐
                   │  SWC Transform  │  Finds t() calls in your code
                   └────────┬────────┘
                            │
                   Injects: import "virtual:lvt/dashboard"
                            │
                            ▼
                   ┌─────────────────┐
                   │  Runtime        │  t() → override? → local → interpolate
                   └─────────────────┘
```

**Key design decisions:**
- PHP files are parsed with `php-parser` (full AST, not regex)
- SWC parses your JS/TS to find `t()` calls; `magic-string` injects the imports
- Each namespace becomes a separate chunk — Vite's tree-shaking does the rest
- A transform cache (hash-based) skips re-parsing unchanged files

---

## Plugin Options

```ts
translations({
  // Directories to scan for .php translation files
  langPaths: ["lang"],

  // Where to write generated JSON chunks
  outputDir: "resources/js/lang/translations",

  // Default locale for the transform
  defaultLocale: "en",

  // Optional: override auto-detected tooling
  packageManager: "bun",
  runtime: "bun",

  // CDN URL for runtime overrides (optional)
  cdnUrl: "https://cdn.example.com/translations",

  // Generate a .d.ts file with all translation keys
  generateTypes: true,

  // Where to write the .d.ts file
  typesOutputPath: "resources/js/lang/translations.d.ts",

  // Additional glob patterns for translation directories
  additionalPatterns: ["custom/*/lang/{locale}/*.php"],
});
```

---

## Framework Guides

### React

```tsx
// main.tsx
import { TranslationProvider } from "@zivex/laravel-vite-translations/react";

createRoot(document.getElementById("root")!).render(
  <TranslationProvider locale="en" fallbackLocale="en">
    <App />
  </TranslationProvider>
);
```

```tsx
// components/Dashboard.tsx
import { useTranslations } from "@zivex/laravel-vite-translations/react";

export function Dashboard() {
  const { t, locale, setLocale } = useTranslations();

  return (
    <div>
      <h1>{t("dashboard.title")}</h1>
      <p>{t("dashboard.welcome", { name: "Taylor" })}</p>

      <button onClick={() => setLocale("nl")}>Nederlands</button>
    </div>
  );
}
```

The `useTranslations` hook uses `useSyncExternalStore` under the hood — locale changes trigger re-renders efficiently without context cascading.

### Vue

```ts
// main.ts
import { createApp } from "vue";
import { createTranslationsPlugin } from "@zivex/laravel-vite-translations/vue";
import App from "./App.vue";

const app = createApp(App);
app.use(createTranslationsPlugin({ locale: "en", fallbackLocale: "en" }));
app.mount("#app");
```

```vue
<!-- components/Dashboard.vue -->
<script setup lang="ts">
import { useTranslations } from "@zivex/laravel-vite-translations/vue";

const { t, locale, setLocale } = useTranslations();
</script>

<template>
  <h1>{{ t("dashboard.title") }}</h1>
  <p>{{ t("dashboard.welcome", { name: "Taylor" }) }}</p>

  <p>Current locale: {{ locale }}</p>
  <button @click="setLocale('nl')">Nederlands</button>
</template>
```

The Vue adapter uses `provide/inject` and reactive `ref` for locale tracking. `$t` is also available as a global property in templates.

### Svelte

```svelte
<!-- App.svelte -->
<script lang="ts">
  import { createTranslations } from "@zivex/laravel-vite-translations/svelte";

  const { t, locale } = createTranslations({
    locale: "en",
    fallbackLocale: "en",
  });
</script>

<h1>{$t("dashboard.title")}</h1>
<p>{$t("dashboard.welcome", { name: "Taylor" })}</p>

<p>Current locale: {$locale}</p>
<button on:click={() => locale.set("nl")}>Nederlands</button>
```

The Svelte adapter exposes `t` as a derived store and `locale` as a writable store — use them with the `$` syntax as you would any Svelte store.

---

## Runtime API

For cases where you need the raw runtime without a framework adapter:

```ts
import { createI18n } from "@zivex/laravel-vite-translations/runtime";

const { t, setLocale, getLocale, onLocaleChange } = createI18n({
  locale: "en",
  fallbackLocale: "en",
  cdnUrl: "https://cdn.example.com/translations", // optional
});

t("dashboard.title");
t("dashboard.welcome", { name: "Taylor" });

await setLocale("nl");

const unsubscribe = onLocaleChange((locale) => {
  console.log("Locale changed to", locale);
});
```

### Locale Detection

When no explicit locale is provided, the runtime detects it automatically:

1. `localStorage` (`lvt-locale` key)
2. `<html lang="...">` attribute
3. `navigator.language`
4. Fallback locale (default: `"en"`)

### CDN Overrides

Ship translation fixes without redeploying your app. Override translations are fetched from a CDN and take priority over local JSON:

```ts
translations({
  cdnUrl: "https://cdn.example.com/translations",
});
```

The CDN should serve JSON files at `{cdnUrl}/{locale}.json`:

```json
{
  "dashboard.title": "Updated Dashboard Title"
}
```

Overrides are cached in memory, retried with exponential backoff on failure, and refreshed on locale change.

---

## CLI

The package includes a CLI for project setup, migration, and diagnostics.

```bash
npx laravel-vite-translations <command>
# or
bunx laravel-vite-translations <command>
```

### `init`

Scaffolds the plugin into your project:

```bash
npx laravel-vite-translations init
# or
bunx laravel-vite-translations init
```

- Detects your framework (React/Vue/Svelte) and lang directory
- Patches `vite.config.ts` to add the plugin
- Generates a runtime loader at `resources/js/lang/index.ts`
- Prompts for locale and options interactively

Options: `--locale <locale>`, `--framework <react|vue|svelte>`, `--lang-path <path>`, `--package-manager <auto|bun|pnpm|npm|yarn>`, `--runtime <auto|bun|node>`, `--no-codemod`

`init` auto-detects package manager and runtime from `package.json.packageManager`, lockfiles, the active user agent, and Bun runtime signals. Manual overrides take priority.

### `codemod`

Migrates existing `__()` and `trans()` calls to `t()`:

```bash
npx laravel-vite-translations codemod
# or
bunx laravel-vite-translations codemod
```

```diff
- <h1>{__('dashboard.title')}</h1>
+ <h1>{t('dashboard.title')}</h1>
```

Uses SWC for accurate AST-based transforms (not regex). Adds the `import { t }` statement automatically.

Options: `--dir <directory>` (default: `resources/js`), `--dry-run`

### `doctor`

Diagnoses translation issues across your project:

```bash
npx laravel-vite-translations doctor
# or
bunx laravel-vite-translations doctor
```

Reports:
- **Missing translations** — keys used in code but not defined in PHP
- **Unused translations** — keys defined in PHP but never referenced
- **Missing locales** — keys that exist in some locales but not others
- **Hardcoded text** — potential untranslated strings in JSX/templates

Options: `--dir <directory>`, `--lang-path <path>`, `--json`

---

## ESLint Plugin

Flat config compatible (ESLint v9+).

```bash
npm install eslint --save-dev
# or
bun add -d eslint
```

```js
// eslint.config.js
import translations from "@zivex/laravel-vite-translations/eslint";

export default [
  translations.configs.recommended,
  // ... your other configs
];
```

### Rules

#### `laravel-vite-translations/no-hardcoded-text`

Warns on hardcoded text in JSX elements:

```tsx
// bad
<h1>Create Project</h1>

// good
<h1>{t("projects.create_title")}</h1>
```

Ignores `className`, `id`, `key`, `data-*`, `aria-*`, and other non-display attributes.

#### `laravel-vite-translations/valid-translation-key`

Errors on translation keys that don't exist in the translation index:

```tsx
// error: Unknown translation key "dashboard.typo"
t("dashboard.typo");
```

Options: `{ indexPath: "path/to/translation-index.json" }`

---

## VSCode Extension

Available on the VS Marketplace as **Laravel Vite Translations**.

- **Autocomplete** — suggestions inside `t("...")` with translation value previews
- **Diagnostics** — red squiggles on unknown translation keys
- **Go to Definition** — jump from `t("dashboard.title")` to the PHP source file

The extension reads the generated `translation-index.json` and watches for changes automatically.

### Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `laravelViteTranslations.generatedDir` | `resources/js/lang/translations` | Path to generated translation files |

---

## TypeScript Support

The plugin generates a `.d.ts` file with a union type of all your translation keys:

```ts
// Auto-generated
declare module "@zivex/laravel-vite-translations/runtime" {
  export type TranslationKey =
    | "dashboard.title"
    | "dashboard.welcome"
    | "dashboard.stats.total"
    | "dashboard.stats.active"
    | "billing.invoice";

  export function createI18n(options?: I18nOptions): I18nInstance;
}
```

This gives you autocomplete and type checking on every `t()` call. The file is regenerated on every build and PHP file change.

---

## Project Structure

The plugin scans these directories by default:

```
lang/{locale}/*.php                  # Laravel 9+
resources/lang/{locale}/*.php        # Laravel 8
packages/*/lang/{locale}/*.php       # Package translations
modules/*/lang/{locale}/*.php        # Modular monolith
```

Namespace is derived from the PHP filename: `lang/en/dashboard.php` becomes the `dashboard` namespace, so keys are accessed as `t("dashboard.key")`.

Nested PHP arrays are flattened with dot notation:

```php
// lang/en/dashboard.php
return [
    'stats' => [
        'total' => 'Total Users',    // → t("dashboard.stats.total")
    ],
];
```

---

## Performance

Designed for large Laravel applications with hundreds of pages and thousands of translation keys.

| Optimization | What it does |
|---|---|
| **Transform cache** | Hashes source files, skips SWC re-parsing when unchanged |
| **Namespace splitting** | Each PHP file becomes a separate JSON chunk — only used namespaces are loaded |
| **Generator diffing** | Only rewrites JSON files that actually changed, preventing unnecessary HMR |
| **Preload** | `<link rel="modulepreload">` for critical translation chunks |
| **CDN caching** | Override responses cached in memory, refreshed only on locale change |

---

## Preload

For critical above-the-fold content, preload translation chunks to avoid waterfalls:

```ts
import { getPreloadLinks } from "@zivex/laravel-vite-translations/preload";

// In your SSR template or HTML
const links = getPreloadLinks(["dashboard", "nav"], "en");
// <link rel="modulepreload" href="/assets/en/dashboard.json" />
// <link rel="modulepreload" href="/assets/en/nav.json" />
```

---

## Import Paths

| Path | Description |
|---|---|
| `@zivex/laravel-vite-translations` | Vite plugin |
| `@zivex/laravel-vite-translations/runtime` | Runtime API (`createI18n`, `t`) |
| `@zivex/laravel-vite-translations/react` | React adapter (`TranslationProvider`, `useTranslations`) |
| `@zivex/laravel-vite-translations/vue` | Vue adapter (`createTranslationsPlugin`, `useTranslations`) |
| `@zivex/laravel-vite-translations/svelte` | Svelte adapter (`createTranslations`) |
| `@zivex/laravel-vite-translations/eslint` | ESLint plugin |
| `@zivex/laravel-vite-translations/preload` | SSR preload utilities |

---

## Release

### Local release commands

Publish the npm package:

```bash
pnpm release:npm
```

Publish the VS Code extension:

```bash
pnpm release:vscode
```

Run the full release flow in one command:

```bash
pnpm release:all
```

Package the VS Code extension locally without publishing:

```bash
pnpm release:vscode:package
```

### GitHub Actions release

A manual workflow is included at `.github/workflows/release.yml`.

Required repository secrets:

- `NPM_TOKEN` for publishing `@zivex/laravel-vite-translations`
- `VSCE_PAT` for publishing the VS Code extension

If you want the npm package to stay under `@zivex`, the npm scope `zivex` must exist and your npm account must have publish access to it.

---

## License

[MIT](./LICENSE)
