import { readFileSync, writeFileSync } from "node:fs";
import fg from "fast-glob";
import { parseSync } from "@swc/core";
import MagicString from "magic-string";
import chalk from "chalk";
import { logger } from "../utils/logger.js";

interface CodemodOptions {
  dir: string;
  dryRun?: boolean;
}

export async function codemodCommand(options: CodemodOptions): Promise<void> {
  const root = process.cwd();
  const dir = options.dir;

  logger.info(`Scanning ${chalk.bold(dir)} for __() and trans() calls...\n`);

  const files = await fg(["**/*.{js,jsx,ts,tsx,vue,svelte}"], {
    cwd: `${root}/${dir}`,
    absolute: true,
    ignore: ["**/node_modules/**"],
  });

  let totalChanges = 0;
  let filesModified = 0;

  for (const file of files) {
    const code = readFileSync(file, "utf-8");
    const result = transformFile(code, file);

    if (result) {
      totalChanges += result.changes;
      filesModified++;

      if (options.dryRun) {
        logger.info(`${chalk.yellow("[dry-run]")} ${file}: ${result.changes} changes`);
      } else {
        writeFileSync(file, result.code, "utf-8");
        logger.info(`${chalk.green("[modified]")} ${file}: ${result.changes} changes`);
      }
    }
  }

  logger.success(
    `\nDone! ${totalChanges} changes across ${filesModified} files${options.dryRun ? " (dry run)" : ""}`
  );
}

interface TransformFileResult {
  code: string;
  changes: number;
}

function transformFile(code: string, filePath: string): TransformFileResult | null {
  // Extract script from SFC if needed
  let scriptContent = code;
  let isVueOrSvelte = false;

  if (filePath.endsWith(".vue") || filePath.endsWith(".svelte")) {
    const match = code.match(/<script[^>]*>([\s\S]*?)<\/script>/);
    if (!match) return null;
    scriptContent = match[1];
    isVueOrSvelte = true;
  }

  const isTsx = filePath.endsWith(".tsx") || filePath.endsWith(".jsx");
  const isTs = filePath.endsWith(".ts") || filePath.endsWith(".tsx") || isVueOrSvelte;

  let ast: any;
  try {
    ast = isTs
      ? parseSync(scriptContent, {
          syntax: "typescript",
          tsx: isTsx || isVueOrSvelte,
        })
      : parseSync(scriptContent, {
          syntax: "ecmascript",
          jsx: isTsx,
        });
  } catch {
    return null;
  }

  const s = new MagicString(code);
  let changes = 0;
  let hasImport = false;

  // Check if t is already imported
  if (code.includes("import") && /\bt\b/.test(code)) {
    hasImport = true;
  }

  // Walk AST to find __() and trans() calls
  walkNode(ast, (node: any) => {
    if (
      node.type === "CallExpression" &&
      node.callee?.type === "Identifier" &&
      (node.callee.value === "__" || node.callee.value === "trans")
    ) {
      const start = node.callee.span.start;
      const end = node.callee.span.end;

      // Adjust offset for SFC files
      let offset = 0;
      if (isVueOrSvelte) {
        offset = code.indexOf(scriptContent);
      }

      s.overwrite(start + offset, end + offset, "t");
      changes++;
    }
  });

  if (changes === 0) return null;

  // Add import if needed
  if (!hasImport) {
    if (isVueOrSvelte) {
      // Insert inside <script> tag
      const scriptStart = code.indexOf(">", code.indexOf("<script")) + 1;
      s.appendLeft(scriptStart, '\nimport { t } from "@/i18n";\n');
    } else {
      s.prepend('import { t } from "@/i18n";\n');
    }
  }

  return { code: s.toString(), changes };
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
