import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  getBinaryCommand,
  getScriptCommand,
  resolveToolingEnvironment,
} from "./packageManager.js";

describe("package manager detection", () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("detects bun from package.json packageManager", () => {
    const root = createTempProject(tempDirs);
    writeFileSync(
      join(root, "package.json"),
      JSON.stringify({ packageManager: "bun@1.1.38" }, null, 2)
    );

    const environment = resolveToolingEnvironment(root, {}, { bunVersion: undefined });

    expect(environment).toEqual({
      packageManager: "bun",
      runtime: "node",
    });
  });

  it("detects bun from lockfiles", () => {
    const root = createTempProject(tempDirs);
    writeFileSync(join(root, "bun.lock"), "");

    const environment = resolveToolingEnvironment(root, {}, { bunVersion: undefined });

    expect(environment.packageManager).toBe("bun");
  });

  it("detects bun from user agent and runtime fallback", () => {
    const root = createTempProject(tempDirs);

    const environment = resolveToolingEnvironment(root, {}, {
      userAgent: "bun/1.1.38 npm/? node/v22.0.0",
      bunVersion: "1.1.38",
    });

    expect(environment).toEqual({
      packageManager: "bun",
      runtime: "bun",
    });
  });

  it("allows manual overrides to win over auto detection", () => {
    const root = createTempProject(tempDirs);
    writeFileSync(
      join(root, "package.json"),
      JSON.stringify({ packageManager: "npm@10.9.0" }, null, 2)
    );

    const environment = resolveToolingEnvironment(
      root,
      { packageManager: "bun", runtime: "bun" },
      { bunVersion: undefined }
    );

    expect(environment).toEqual({
      packageManager: "bun",
      runtime: "bun",
    });
  });

  it("builds Bun-specific commands", () => {
    expect(getScriptCommand("bun", "dev")).toBe("bun dev");
    expect(
      getBinaryCommand(
        { packageManager: "bun", runtime: "bun" },
        "laravel-vite-translations",
        ["codemod"]
      )
    ).toBe("bunx laravel-vite-translations codemod");
  });
});

function createTempProject(tempDirs: string[]): string {
  const root = mkdtempSync(join(tmpdir(), "lvt-package-manager-"));
  tempDirs.push(root);
  return root;
}
