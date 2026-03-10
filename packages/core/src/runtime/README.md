# Runtime

This folder contains the framework-agnostic translation runtime.

## Exports

- `createI18n()`
- `__registerTranslations()`

## Responsibilities

- Keep the in-memory translation store
- Resolve the active locale and fallback locale
- Load optional CDN overrides
- Interpolate `:placeholders`
- Notify subscribers when the locale changes

## Import path

```ts
import { createI18n } from "@zivex/laravel-vite-translations/runtime";
```
