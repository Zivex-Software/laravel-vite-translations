import type { Rule } from "eslint";

const IGNORED_ATTRIBUTES = new Set([
  "className",
  "class",
  "id",
  "key",
  "ref",
  "style",
  "type",
  "name",
  "htmlFor",
  "for",
  "role",
  "tabIndex",
  "aria-label",
  "aria-labelledby",
  "aria-describedby",
]);

const IGNORED_ATTRIBUTE_PREFIXES = ["data-", "aria-"];

const noHardcodedText: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow hardcoded text in JSX elements",
    },
    messages: {
      hardcodedText:
        'Hardcoded text "{{text}}" should use a translation function: t("translation.key")',
    },
    schema: [
      {
        type: "object",
        properties: {
          ignoreAttributes: {
            type: "array",
            items: { type: "string" },
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const options = context.options[0] || {};
    const extraIgnored = new Set<string>(options.ignoreAttributes || []);

    return {
      JSXText(node: any) {
        const text = node.value.trim();
        if (!text) return;

        // Ignore if it's just whitespace, numbers, or single characters
        if (/^[\s\d.,;:!?@#$%^&*()_+=\-[\]{}|\\/<>~`'"]+$/.test(text)) return;

        // Must contain at least one letter and be more than 1 char
        if (!/[a-zA-Z]/.test(text) || text.length <= 1) return;

        context.report({
          node,
          messageId: "hardcodedText",
          data: {
            text: text.length > 40 ? text.slice(0, 40) + "..." : text,
          },
        });
      },

      JSXAttribute(node: any) {
        const attrName = node.name?.name;
        if (!attrName) return;

        // Skip ignored attributes
        if (IGNORED_ATTRIBUTES.has(attrName) || extraIgnored.has(attrName)) return;
        if (IGNORED_ATTRIBUTE_PREFIXES.some((p) => attrName.startsWith(p))) return;

        // Check string literal values
        if (
          node.value?.type === "Literal" &&
          typeof node.value.value === "string"
        ) {
          const text = node.value.value.trim();
          if (!text || !/[a-zA-Z]/.test(text) || text.length <= 1) return;

          context.report({
            node: node.value,
            messageId: "hardcodedText",
            data: {
              text: text.length > 40 ? text.slice(0, 40) + "..." : text,
            },
          });
        }
      },
    };
  },
};

export default noHardcodedText;
