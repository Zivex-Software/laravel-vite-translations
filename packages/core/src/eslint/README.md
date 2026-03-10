# ESLint Plugin

ESLint support for `@zivex/laravel-vite-translations`.

## Included rules

- `laravel-vite-translations/no-hardcoded-text`
- `laravel-vite-translations/valid-translation-key`

## Usage

```ts
import translations from "@zivex/laravel-vite-translations/eslint";
```

## What the rules do

- `no-hardcoded-text` warns on visible hardcoded JSX text
- `valid-translation-key` validates `t("...")` keys against the generated translation index
