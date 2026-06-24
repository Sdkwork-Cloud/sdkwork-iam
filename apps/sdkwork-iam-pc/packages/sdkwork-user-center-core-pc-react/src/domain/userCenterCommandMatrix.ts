import type {
  IdentityDeploymentMode,
  UserCenterCommandLifecycle,
  UserCenterCommandMatrixEntry,
  UserCenterCommandMode,
  UserCenterCommandSurface,
  UserCenterDeploymentProfileKind,
} from "../types/userCenterTypes.ts";

export const USER_CENTER_COMMAND_SURFACES = [
  "desktop",
  "web",
  "server",
] as const satisfies readonly UserCenterCommandSurface[];

export const USER_CENTER_COMMAND_MODES = [
  "local",
  "private",
  "cloud",
  "external",
] as const satisfies readonly UserCenterCommandMode[];

export const USER_CENTER_COMMAND_LIFECYCLES = [
  "dev",
  "build",
  "package",
  "smoke",
  "doctor",
  "env",
] as const satisfies readonly UserCenterCommandLifecycle[];

function resolveProviderKind(mode: UserCenterCommandMode): UserCenterDeploymentProfileKind {
  switch (mode) {
    case "cloud":
      return "sdkwork-cloud-app-api";
    case "external":
      return "external-user-center";
    case "local":
    case "private":
    default:
      return "builtin-local";
  }
}

function resolveIamMode(
  surface: UserCenterCommandSurface,
  mode: UserCenterCommandMode,
): IdentityDeploymentMode {
  if (mode === "cloud") {
    return "cloud-saas";
  }

  if (mode === "local" && surface === "desktop") {
    return "desktop-local";
  }

  return "server-private";
}

export function createUserCenterCommandMatrix(): UserCenterCommandMatrixEntry[] {
  const matrix: UserCenterCommandMatrixEntry[] = [];

  for (const surface of USER_CENTER_COMMAND_SURFACES) {
    for (const lifecycle of USER_CENTER_COMMAND_LIFECYCLES) {
      for (const mode of USER_CENTER_COMMAND_MODES) {
        matrix.push({
          command: `${surface}:${lifecycle}:${mode}`,
          iamMode: resolveIamMode(surface, mode),
          lifecycle,
          mode,
          providerKind: resolveProviderKind(mode),
          surface,
        });
      }
    }
  }

  return matrix;
}
