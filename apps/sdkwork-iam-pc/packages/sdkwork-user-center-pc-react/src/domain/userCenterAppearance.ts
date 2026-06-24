import {
  createSdkworkAuthAppearancePreset,
  mergeSdkworkAuthAppearanceConfigs,
  resolveSdkworkAuthAppearance,
  type SdkworkAuthAppearanceConfig,
  type SdkworkAuthAppearancePreset,
  type SdkworkAuthThemeTokens,
} from "@sdkwork/auth-pc-react";
import {
  createSdkworkUserAppearancePreset,
  mergeSdkworkUserAppearanceConfigs,
  resolveSdkworkUserAppearance,
  type SdkworkUserAppearanceConfig,
  type SdkworkUserAppearancePreset,
  type SdkworkUserThemeTokens,
} from "@sdkwork/user-pc-react";
import type {
  UserCenterSurfaceAppearanceBundle,
  UserCenterSurfaceAppearanceInput,
  UserCenterSurfaceAppearancePreset,
  UserCenterSurfaceThemeAppearanceBundle,
  UserCenterSurfaceThemeTokens,
} from "../types/userCenterSurfaceTypes.ts";

function resolveSharedPresetFromTheme(
  theme?: string,
): UserCenterSurfaceAppearancePreset | undefined {
  const normalizedTheme = theme?.trim().toLowerCase();
  if (
    normalizedTheme === "sdkwork"
    || normalizedTheme === "standard"
    || normalizedTheme === "midnight"
    || normalizedTheme === "paper"
  ) {
    return normalizedTheme;
  }

  return undefined;
}

function resolveAuthPreset(
  sharedPreset?: UserCenterSurfaceAppearancePreset,
  authPreset?: SdkworkAuthAppearancePreset,
): SdkworkAuthAppearancePreset {
  if (authPreset) {
    return authPreset;
  }

  if (sharedPreset === "sdkwork" || sharedPreset === "midnight" || sharedPreset === "paper") {
    return sharedPreset;
  }

  return "sdkwork";
}

function resolveUserPreset(
  sharedPreset?: UserCenterSurfaceAppearancePreset,
  userPreset?: SdkworkUserAppearancePreset,
): SdkworkUserAppearancePreset {
  if (userPreset) {
    return userPreset;
  }

  if (
    sharedPreset === "sdkwork"
    || sharedPreset === "midnight"
    || sharedPreset === "paper"
    || sharedPreset === "standard"
  ) {
    return sharedPreset;
  }

  return "sdkwork";
}

export function createUserCenterSurfaceThemeAppearance(
  theme: UserCenterSurfaceThemeTokens,
): UserCenterSurfaceThemeAppearanceBundle {
  const auth: SdkworkAuthThemeTokens = {
    asideCardBackgroundColor: theme.cardBackgroundColor,
    asideCardBorderColor: theme.cardBorderColor,
    asideIconWellBackgroundColor: theme.iconWellBackgroundColor,
    asideIconWellColor: theme.iconWellColor,
    asidePanelBackgroundColor: theme.emphasisPanelBackgroundColor,
    asidePanelBorderColor: theme.emphasisPanelBorderColor,
    asidePanelColor: theme.emphasisPanelTextColor,
    badgeBackgroundColor: theme.badgeBackgroundColor,
    badgeTextColor: theme.badgeTextColor,
    callbackBackgroundColor: theme.callbackHeaderBackgroundColor ?? theme.emphasisPanelBackgroundColor,
    callbackTextColor: theme.callbackHeaderTextColor ?? theme.emphasisPanelTextColor,
    descriptionColor: theme.descriptionColor,
    oauthProviderCardBackgroundColor: theme.oauthProviderCardBackgroundColor ?? theme.cardBackgroundColor,
    oauthProviderCardBorderColor: theme.oauthProviderCardBorderColor ?? theme.cardBorderColor,
    pageBackgroundColor: theme.pageBackgroundColor,
    qrFrameBackgroundColor: theme.qrFrameBackgroundColor,
    qrFrameBorderColor: theme.qrFrameBorderColor,
    shellBackgroundColor: theme.shellBackgroundColor,
    shellBorderColor: theme.shellBorderColor,
    titleColor: theme.titleColor,
  };
  const user: SdkworkUserThemeTokens = {
    contentBackgroundColor: theme.contentBackgroundColor,
    heroBadgeBackgroundColor: theme.badgeBackgroundColor,
    heroBadgeTextColor: theme.badgeTextColor,
    heroDescriptionColor: theme.descriptionColor,
    heroIconBackgroundColor: theme.iconWellBackgroundColor,
    heroIconColor: theme.iconWellColor,
    heroPanelBackgroundColor: theme.heroPanelBackgroundColor ?? theme.emphasisPanelBackgroundColor,
    heroPanelBorderColor: theme.heroPanelBorderColor ?? theme.emphasisPanelBorderColor,
    heroTitleColor: theme.titleColor,
    pageBackgroundColor: theme.pageBackgroundColor,
    sectionSurfaceBackgroundColor: theme.sectionSurfaceBackgroundColor,
    sectionSurfaceBorderColor: theme.sectionSurfaceBorderColor,
    shellBackgroundColor: theme.shellBackgroundColor,
    shellBorderColor: theme.shellBorderColor,
    shellShadow: theme.shellShadow,
    standardsCardBackgroundColor: theme.standardsCardBackgroundColor ?? theme.cardBackgroundColor,
    standardsCardBorderColor: theme.standardsCardBorderColor ?? theme.cardBorderColor,
    standardsIconBackgroundColor: theme.iconWellBackgroundColor,
    standardsIconColor: theme.iconWellColor,
    standardsPanelBackgroundColor: theme.standardsPanelBackgroundColor ?? theme.emphasisPanelBackgroundColor,
    standardsPanelBorderColor: theme.standardsPanelBorderColor ?? theme.emphasisPanelBorderColor,
    standardsPanelColor: theme.standardsPanelColor ?? theme.emphasisPanelTextColor,
  };

  return {
    auth,
    user,
  };
}

export function createUserCenterSurfaceAppearanceBundle(
  input?: UserCenterSurfaceAppearanceInput,
): UserCenterSurfaceAppearanceBundle {
  const sharedPreset = input?.preset;
  const authPreset = resolveAuthPreset(sharedPreset, input?.authPreset);
  const userPreset = resolveUserPreset(sharedPreset, input?.userPreset);
  const themeAppearance = input?.theme
    ? createUserCenterSurfaceThemeAppearance(input.theme)
    : undefined;
  const auth = resolveSdkworkAuthAppearance(
    mergeSdkworkAuthAppearanceConfigs(
      createSdkworkAuthAppearancePreset(authPreset),
      themeAppearance ? { theme: themeAppearance.auth } : undefined,
      input?.auth,
    ),
  ) ?? createSdkworkAuthAppearancePreset(authPreset);
  const user = resolveSdkworkUserAppearance(
    mergeSdkworkUserAppearanceConfigs(
      createSdkworkUserAppearancePreset(userPreset),
      themeAppearance ? { theme: themeAppearance.user } : undefined,
      input?.user,
    ),
  ) ?? createSdkworkUserAppearancePreset(userPreset);

  return {
    auth,
    user,
  };
}

export function mergeUserCenterSurfaceAppearanceInputs(
  ...inputs: Array<UserCenterSurfaceAppearanceInput | undefined>
): UserCenterSurfaceAppearanceInput | undefined {
  const resolvedInputs = inputs.filter(Boolean) as UserCenterSurfaceAppearanceInput[];
  if (!resolvedInputs.length) {
    return undefined;
  }

  const mergedInput: UserCenterSurfaceAppearanceInput = {};
  for (const input of resolvedInputs) {
    if (input.preset !== undefined) {
      mergedInput.preset = input.preset;
    }

    if (input.authPreset !== undefined) {
      mergedInput.authPreset = input.authPreset;
    }

    if (input.userPreset !== undefined) {
      mergedInput.userPreset = input.userPreset;
    }

    mergedInput.theme = {
      ...(mergedInput.theme ?? {}),
      ...(input.theme ?? {}),
    };
    mergedInput.auth = mergeSdkworkAuthAppearanceConfigs(
      mergedInput.auth,
      input.auth,
    );
    mergedInput.user = mergeSdkworkUserAppearanceConfigs(
      mergedInput.user,
      input.user,
    );
  }

  if (!Object.keys(mergedInput.theme ?? {}).length) {
    delete mergedInput.theme;
  }

  return mergedInput;
}

export function resolveUserCenterSurfaceAuthAppearance(
  appearance?: SdkworkAuthAppearanceConfig,
  input?: UserCenterSurfaceAppearanceInput,
): SdkworkAuthAppearanceConfig {
  return createUserCenterSurfaceAppearanceBundle({
    ...input,
    auth: mergeSdkworkAuthAppearanceConfigs(input?.auth, appearance),
  }).auth;
}

export function resolveUserCenterSurfaceUserAppearance(
  appearance?: SdkworkUserAppearanceConfig,
  input?: UserCenterSurfaceAppearanceInput,
): SdkworkUserAppearanceConfig {
  return createUserCenterSurfaceAppearanceBundle({
    ...input,
    user: mergeSdkworkUserAppearanceConfigs(input?.user, appearance),
  }).user;
}

export function resolveUserCenterSurfaceAppearanceBundleFromTheme(
  theme?: string,
  input?: Omit<UserCenterSurfaceAppearanceInput, "preset">,
): UserCenterSurfaceAppearanceBundle {
  return createUserCenterSurfaceAppearanceBundle({
    ...input,
    preset: resolveSharedPresetFromTheme(theme),
  });
}
