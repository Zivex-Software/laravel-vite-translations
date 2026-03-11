import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type {
  PackageManagerName,
  PackageManagerPreference,
  RuntimeName,
  RuntimePreference,
  ToolingEnvironment,
} from "../types/index.js";

interface DetectEnvironmentContext {
  userAgent?: string;
  bunVersion?: string;
  packageJsonPackageManager?: string;
  existsSync?: (path: string) => boolean;
}

export interface ToolingEnvironmentOptions {
  packageManager?: PackageManagerPreference;
  runtime?: RuntimePreference;
}

export function resolveToolingEnvironment(
  root: string,
  options: ToolingEnvironmentOptions = {},
  context: DetectEnvironmentContext = {}
): ToolingEnvironment {
  const runtime = resolveRuntime(options.runtime, context);
  const packageManager = resolvePackageManager(root, options.packageManager, runtime, context);
  return { packageManager, runtime };
}

export function getScriptCommand(
  packageManager: PackageManagerName,
  script: string
): string {
  switch (packageManager) {
    case "bun":
      return `bun ${script}`;
    case "pnpm":
      return `pnpm ${script}`;
    case "yarn":
      return `yarn ${script}`;
    default:
      return `npm run ${script}`;
  }
}

export function getBinaryCommand(
  environment: ToolingEnvironment,
  binary: string,
  args: string[] = []
): string {
  const command =
    environment.runtime === "bun" || environment.packageManager === "bun"
      ? `bunx ${binary}`
      : environment.packageManager === "pnpm"
        ? `pnpm exec ${binary}`
        : environment.packageManager === "yarn"
          ? `yarn ${binary}`
          : `npx ${binary}`;

  return [...command.split(" "), ...args].join(" ");
}

function resolveRuntime(
  runtime: RuntimePreference | undefined,
  context: DetectEnvironmentContext
): RuntimeName {
  const normalized = normalizeRuntimeName(runtime);
  if (normalized) return normalized;

  const bunVersion =
    context.bunVersion ??
    (process.versions as NodeJS.ProcessVersions & { bun?: string }).bun;
  return bunVersion ? "bun" : "node";
}

function resolvePackageManager(
  root: string,
  preferredPackageManager: PackageManagerPreference | undefined,
  runtime: RuntimeName,
  context: DetectEnvironmentContext
): PackageManagerName {
  const normalized = normalizePackageManagerName(preferredPackageManager);
  if (normalized) return normalized;

  const packageJsonPackageManager =
    context.packageJsonPackageManager ?? readPackageJsonPackageManager(root);
  const packageManagerFromPackageJson = normalizePackageManagerField(
    packageJsonPackageManager
  );
  if (packageManagerFromPackageJson) return packageManagerFromPackageJson;

  const exists = context.existsSync ?? existsSync;
  const lockfilePackageManager = detectPackageManagerFromLockfiles(root, exists);
  if (lockfilePackageManager) return lockfilePackageManager;

  const packageManagerFromUserAgent = detectPackageManagerFromUserAgent(
    context.userAgent ?? process.env.npm_config_user_agent
  );
  if (packageManagerFromUserAgent) return packageManagerFromUserAgent;

  return runtime === "bun" ? "bun" : "npm";
}

function readPackageJsonPackageManager(root: string): string | undefined {
  try {
    const packageJson = JSON.parse(readFileSync(resolve(root, "package.json"), "utf-8")) as {
      packageManager?: string;
    };
    return packageJson.packageManager;
  } catch {
    return undefined;
  }
}

function detectPackageManagerFromLockfiles(
  root: string,
  doesFileExist: (path: string) => boolean
): PackageManagerName | undefined {
  const lockfiles: Array<[fileName: string, packageManager: PackageManagerName]> = [
    ["bun.lockb", "bun"],
    ["bun.lock", "bun"],
    ["pnpm-lock.yaml", "pnpm"],
    ["package-lock.json", "npm"],
    ["yarn.lock", "yarn"],
  ];

  for (const [fileName, packageManager] of lockfiles) {
    if (doesFileExist(resolve(root, fileName))) {
      return packageManager;
    }
  }

  return undefined;
}

function detectPackageManagerFromUserAgent(
  userAgent: string | undefined
): PackageManagerName | undefined {
  if (!userAgent) return undefined;

  const candidates: PackageManagerName[] = ["bun", "pnpm", "yarn", "npm"];
  return candidates.find((candidate) => userAgent.includes(`${candidate}/`));
}

function normalizePackageManagerField(
  packageManagerField: string | undefined
): PackageManagerName | undefined {
  if (!packageManagerField) return undefined;
  return normalizePackageManagerName(packageManagerField.split("@")[0]);
}

function normalizePackageManagerName(
  packageManager: string | undefined
): PackageManagerName | undefined {
  switch (packageManager) {
    case "bun":
    case "pnpm":
    case "npm":
    case "yarn":
      return packageManager;
    default:
      return undefined;
  }
}

function normalizeRuntimeName(runtime: string | undefined): RuntimeName | undefined {
  switch (runtime) {
    case "bun":
    case "node":
      return runtime;
    default:
      return undefined;
  }
}
