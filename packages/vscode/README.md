# `laravel-vite-translations-vscode`

VS Code extension for Laravel Vite Translations.

## Features

- Autocomplete for translation keys
- Diagnostics for unknown keys
- Go-to-definition from `t("...")` calls to PHP translation files

## How it works

The extension reads the generated translation index from your project and watches supported frontend files:

- `.ts`
- `.tsx`
- `.js`
- `.jsx`
- `.vue`
- `.svelte`

## Development

```bash
pnpm build
```

## Publishing

This package is separate from the npm package in `packages/core`.

Publishing the VS Code extension typically happens through the VS Code marketplace tooling, not through `npm publish`.
