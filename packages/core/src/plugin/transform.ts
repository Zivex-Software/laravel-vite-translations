import { parseSync } from "@swc/core";
import MagicString from "magic-string";
import type { TransformResult } from "../types/index.js";

const EXTENSIONS: Record<string, "ecmascript" | "typescript"> = {
  ".js": "ecmascript",
  ".jsx": "ecmascript",
  ".ts": "typescript",
  ".tsx": "typescript",
  ".mjs": "ecmascript",
  ".mts": "typescript",
};

export function transformCode(
  code: string,
  id: string
): TransformResult | null {
  // Extract script content from SFC files
  let scriptContent = code;

  if (id.endsWith(".vue")) {
    const match = code.match(/<script[^>]*>([\s\S]*?)<\/script>/);
    if (!match) return null;
    scriptContent = match[1];
  } else if (id.endsWith(".svelte")) {
    const match = code.match(/<script[^>]*>([\s\S]*?)<\/script>/);
    if (!match) return null;
    scriptContent = match[1];
  }

  // Determine syntax
  const ext = getExtension(id);
  const syntax = EXTENSIONS[ext];
  if (!syntax) return null;

  const isJsx = ext === ".jsx" || ext === ".tsx" || id.endsWith(".vue") || id.endsWith(".svelte");

  let ast: any;
  try {
    ast =
      syntax === "typescript"
        ? parseSync(scriptContent, { syntax: "typescript", tsx: isJsx })
        : parseSync(scriptContent, { syntax: "ecmascript", jsx: isJsx });
  } catch {
    return null;
  }

  // Walk AST to find t() calls and extract namespaces
  const namespaces = new Set<string>();
  walkNode(ast, (node: any) => {
    if (
      node.type === "CallExpression" &&
      node.callee?.type === "Identifier" &&
      node.callee.value === "t" &&
      node.arguments?.length > 0
    ) {
      const firstArg = node.arguments[0]?.expression;
      if (firstArg?.type === "StringLiteral" && firstArg.value) {
        const dotIndex = firstArg.value.indexOf(".");
        if (dotIndex > 0) {
          namespaces.add(firstArg.value.substring(0, dotIndex));
        }
      }
    }
  });

  if (namespaces.size === 0) return null;

  // Inject virtual imports using magic-string
  const s = new MagicString(code);
  const imports = [...namespaces]
    .map((ns) => `import "virtual:lvt/${ns}";`)
    .join("\n");

  s.prepend(imports + "\n");

  return {
    code: s.toString(),
    map: s.generateMap({ hires: true }) as any,
  };
}

function walkNode(node: any, visitor: (node: any) => void): void {
  if (!node || typeof node !== "object") return;

  visitor(node);

  for (const key of Object.keys(node)) {
    const child = node[key];
    if (Array.isArray(child)) {
      for (const item of child) {
        if (item && typeof item === "object") {
          walkNode(item, visitor);
        }
      }
    } else if (child && typeof child === "object" && child.type) {
      walkNode(child, visitor);
    }
  }
}

function getExtension(id: string): string {
  if (id.endsWith(".vue") || id.endsWith(".svelte")) return ".ts";
  const match = id.match(/\.[^.]+$/);
  return match ? match[0] : ".js";
}
