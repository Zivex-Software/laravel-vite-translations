import { describe, expect, it } from "vitest";
import { transformCode } from "./transform.js";

describe("transformCode", () => {
  it("injects namespace imports without locking to one locale", () => {
    const result = transformCode(
      `
        export function Example() {
          return t("dashboard.title");
        }
      `,
      "/project/resources/js/Example.tsx"
    );

    expect(result).not.toBeNull();
    expect(result!.code).toContain('import "virtual:lvt/dashboard";');
  });
});
