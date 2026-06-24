import { describe, expect, it } from "vitest";

import * as userCenterCore from "../src/index.ts";

function requireExport<T>(name: string): T {
  return (userCenterCore as Record<string, unknown>)[name] as T;
}

describe("user-center command matrix contract", () => {
  it("exposes a mode-complete command matrix with doctor and env coverage", () => {
    const createUserCenterCommandMatrix = requireExport<
      (() => Array<{
        command: string;
        iamMode: string;
        lifecycle: string;
        mode: string;
        providerKind: string;
        surface: string;
      }>)
      | undefined
    >("createUserCenterCommandMatrix");

    expect(createUserCenterCommandMatrix).toBeTypeOf("function");

    const matrix = createUserCenterCommandMatrix?.() ?? [];
    const commands = matrix.map((entry) => entry.command);
    const uniqueCommands = new Set(commands);

    expect(matrix.length).toBeGreaterThanOrEqual(72);
    expect(uniqueCommands.size).toBe(matrix.length);
    expect(
      matrix.every((entry) => entry.command === `${entry.surface}:${entry.lifecycle}:${entry.mode}`),
    ).toBe(true);

    expect(matrix).toContainEqual({
      command: "desktop:dev:local",
      iamMode: "desktop-local",
      lifecycle: "dev",
      mode: "local",
      providerKind: "builtin-local",
      surface: "desktop",
    });
    expect(matrix).toContainEqual({
      command: "web:env:private",
      iamMode: "server-private",
      lifecycle: "env",
      mode: "private",
      providerKind: "builtin-local",
      surface: "web",
    });
    expect(matrix).toContainEqual({
      command: "server:doctor:cloud",
      iamMode: "cloud-saas",
      lifecycle: "doctor",
      mode: "cloud",
      providerKind: "sdkwork-cloud-app-api",
      surface: "server",
    });
    expect(matrix).toContainEqual({
      command: "server:doctor:external",
      iamMode: "server-private",
      lifecycle: "doctor",
      mode: "external",
      providerKind: "external-user-center",
      surface: "server",
    });
    expect(matrix.every((entry) => !Object.hasOwn(entry, "identityMode"))).toBe(true);

    for (const surface of ["desktop", "web", "server"] as const) {
      for (const mode of ["local", "private", "cloud", "external"] as const) {
        expect(
          matrix.some(
            (entry) =>
              entry.surface === surface
              && entry.mode === mode
              && entry.lifecycle === "doctor",
          ),
        ).toBe(true);
        expect(
          matrix.some(
            (entry) =>
              entry.surface === surface
              && entry.mode === mode
              && entry.lifecycle === "env",
          ),
        ).toBe(true);
      }
    }
  });
});
