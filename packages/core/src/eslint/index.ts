import noHardcodedText from "./rules/no-hardcoded-text.js";
import validTranslationKey from "./rules/valid-translation-key.js";

const plugin = {
  meta: {
    name: "laravel-vite-translations",
    version: "0.1.0",
  },
  rules: {
    "no-hardcoded-text": noHardcodedText,
    "valid-translation-key": validTranslationKey,
  },
  configs: {
    recommended: {
      plugins: {} as Record<string, any>,
      rules: {
        "laravel-vite-translations/no-hardcoded-text": "warn",
        "laravel-vite-translations/valid-translation-key": "error",
      },
    },
  },
};

// Self-reference for flat config
plugin.configs.recommended.plugins = {
  "laravel-vite-translations": plugin,
};

export default plugin;
