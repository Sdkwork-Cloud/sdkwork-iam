import { homedir } from "node:os";
import { posix as posixPath, win32 as win32Path } from "node:path";

function pathApiFor(platform: NodeJS.Platform | string) {
  return platform === "win32" ? win32Path : posixPath;
}

export function joinSdkworkPath(
  platform: NodeJS.Platform | string,
  ...segments: string[]
): string {
  return pathApiFor(platform).join(...segments);
}

/**
 * Join `%HOMEDRIVE%` + `%HOMEPATH%` without Node treating `\Users\...` as a
 * drive-relative absolute path that drops the drive letter.
 */
export function joinWindowsUserHome(drive: string, homePath: string): string {
  const drivePart = drive.trim().replace(/[/\\]+$/u, "");
  const normalizedHome = homePath.trim().replaceAll("/", "\\");
  if (normalizedHome.startsWith("\\")) {
    return `${drivePart}${normalizedHome}`;
  }
  return `${drivePart}\\${normalizedHome}`;
}

/**
 * Cross-platform home directory for `~/.sdkwork` paths.
 * On win32, `%USERPROFILE%` wins so Git-for-Windows `HOME` cannot shadow it.
 */
export function resolveSdkworkHomeDir(
  env: Readonly<Record<string, string | undefined>> = process.env,
  platform: NodeJS.Platform | string = process.platform,
): string {
  if (platform === "win32") {
    const userProfile = firstNonEmpty(env.USERPROFILE);
    if (userProfile) return userProfile;
    const drive = firstNonEmpty(env.HOMEDRIVE);
    const homePath = firstNonEmpty(env.HOMEPATH);
    if (drive && homePath) return joinWindowsUserHome(drive, homePath);
    const home = firstNonEmpty(env.HOME);
    if (home) return home;
  } else {
    const home = firstNonEmpty(env.HOME);
    if (home) return home;
    const userProfile = firstNonEmpty(env.USERPROFILE);
    if (userProfile) return userProfile;
  }
  return homedir();
}

export function firstNonEmpty(...values: Array<string | undefined>): string | undefined {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return undefined;
}
