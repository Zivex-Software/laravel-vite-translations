# Svelte Adapter

Svelte integration for `@zivex/laravel-vite-translations`.

## Exports

- `createTranslations`

## Usage

```ts
import { createTranslations } from "@zivex/laravel-vite-translations/svelte";
```

`createTranslations()` returns:

- `t` as a readable/derived store
- `locale` as a writable store

Use them with normal Svelte store syntax:

```svelte
{$t("dashboard.title")}
{$locale}
```
