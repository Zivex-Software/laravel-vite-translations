import * as PhpParser from "php-parser";
import { readFile } from "node:fs/promises";
import type { TranslationRecord } from "../types/index.js";

const parser = new PhpParser.Engine({
  parser: { extractDoc: false },
  ast: { withPositions: false },
});

export async function parsePhpTranslationFile(filePath: string): Promise<TranslationRecord> {
  const content = await readFile(filePath, "utf-8");
  const ast = parser.parseCode(content, filePath) as any;

  // Find the return statement
  for (const node of ast.children as any[]) {
    if (node.kind === "return" && node.expr) {
      return extractValue(node.expr) as TranslationRecord;
    }
  }

  return {};
}

function extractValue(node: any): string | number | null | TranslationRecord {
  switch (node.kind) {
    case "string":
      return node.value as string;

    case "number":
      return Number(node.value);

    case "nullkeyword":
      return null;

    case "array": {
      const result: TranslationRecord = {};
      for (const item of node.items) {
        if (!item) continue;
        const entry = item.kind === "entry" ? item : item;
        if (entry.key) {
          const key = extractKey(entry.key);
          if (key !== null) {
            result[key] = extractValue(entry.value) as string | number | null | TranslationRecord;
          }
        }
      }
      return result;
    }

    case "encapsed":
      // Handle interpolated strings - return as template
      return node.raw || node.value || "";

    case "bin": {
      // Handle string concatenation
      const left = extractValue(node.left);
      const right = extractValue(node.right);
      if (typeof left === "string" && typeof right === "string") {
        return left + right;
      }
      return String(left) + String(right);
    }

    default:
      return null;
  }
}

function extractKey(node: any): string | null {
  if (node.kind === "string") return node.value;
  if (node.kind === "number") return String(node.value);
  return null;
}
