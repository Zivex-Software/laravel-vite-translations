# Plugin And Preload

This folder contains the Vite-facing integration layer.

## Vite plugin

The main package export wires together:

- workspace scanning
- PHP translation generation
- source transforms
- virtual module loading for namespace chunks

Import path:

```ts
import translations from "@zivex/laravel-vite-translations";
```

## Preload helpers

The `@zivex/laravel-vite-translations/preload` export contains helpers for building preload links for translation chunks.

```ts
import { getPreloadLinks } from "@zivex/laravel-vite-translations/preload";
```
