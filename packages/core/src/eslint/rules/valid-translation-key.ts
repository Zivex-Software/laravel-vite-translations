import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import type { Rule } from "eslint";
import type { TranslationIndex } from "../../types/index.js";

let cachedIndex: TranslationIndex | null = null;
let cachedIndexPath: string | null = null;

function loadIndex(indexPath: string): TranslationIndex {
  if (cachedIndexPath === indexPath && cachedIndex) {
    return cachedIndex;
  }

  try {
    if (existsSync(indexPath)) {
      cachedIndex = JSON.parse(readFileSync(indexPath, "utf-8"));
      cachedIndexPath = indexPath;
      return cachedIndex!;
    }
  } catch {
    // Failed to load index
  }

  return {};
}

const validTranslationKey: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Validate translation keys against the translation index",
    },
    messages: {
      unknownKey:
        'Unknown translation key "{{key}}". This key does not exist in any translation file.',
      missingLocale:
        'Translation key "{{key}}" is missing for locale "{{locale}}".',
    },
    schema: [
      {
        type: "object",
        properties: {
          indexPath: { type: "string" },
          checkLocales: { type: "boolean" },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const options = context.options[0] || {};
    const indexPath = options.indexPath
      ? resolve(options.indexPath)
      : resolve("resources/js/i18n/generated/translation-index.json");
    const checkLocales = options.checkLocales ?? false;

    const index = loadIndex(indexPath);

    return {
      CallExpression(node: any) {
        // Match t("key") calls
        if (
          node.callee?.type !== "Identifier" ||
          node.callee.name !== "t"
        ) {
          return;
        }

        const firstArg = node.arguments?.[0];
        if (!firstArg || firstArg.type !== "Literal" || typeof firstArg.value !== "string") {
          return;
        }

        const key = firstArg.value;
        const entry = index[key];

        if (!entry) {
          context.report({
            node: firstArg,
            messageId: "unknownKey",
            data: { key },
          });
          return;
        }

        // Optionally check if all locales have this key
        if (checkLocales && entry.locales) {
          // We can't know all expected locales from the index alone,
          // but we can flag if only some locales have the key
          // This is handled by the doctor command more thoroughly
        }
      },
    };
  },
};

export default validTranslationKey;
