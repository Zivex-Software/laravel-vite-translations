# React Adapter

React integration for `@zivex/laravel-vite-translations`.

## Exports

- `TranslationProvider`
- `useTranslations`
- `TranslationContext`

## Usage

```tsx
import { TranslationProvider, useTranslations } from "@zivex/laravel-vite-translations/react";
```

Wrap your app in `TranslationProvider` and use `useTranslations()` inside components to access:

- `t()`
- `locale`
- `setLocale()`
