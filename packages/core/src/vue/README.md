# Vue Adapter

Vue integration for `@zivex/laravel-vite-translations`.

## Exports

- `createTranslationsPlugin`
- `useTranslations`

## Usage

```ts
import { createTranslationsPlugin } from "@zivex/laravel-vite-translations/vue";
```

The plugin provides the i18n instance through Vue dependency injection and also exposes template-friendly globals:

- `$t`
- `$locale`
- `$setLocale`
