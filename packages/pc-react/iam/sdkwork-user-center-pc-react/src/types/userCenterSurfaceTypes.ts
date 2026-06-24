import type {
  SdkworkAuthAppearanceConfig,
  SdkworkAuthAppearancePreset,
  SdkworkAuthThemeTokens,
} from "@sdkwork/auth-pc-react";
import type {
  SdkworkUserAppearanceConfig,
  SdkworkUserAppearancePreset,
  SdkworkUserThemeTokens,
} from "@sdkwork/user-pc-react";

export type UserCenterSurfaceAppearancePreset =
  | "sdkwork"
  | "standard"
  | "midnight"
  | "paper";

export interface UserCenterSurfaceThemeTokens {
  badgeBackgroundColor?: string;
  badgeTextColor?: string;
  callbackHeaderBackgroundColor?: string;
  callbackHeaderTextColor?: string;
  cardBackgroundColor?: string;
  cardBorderColor?: string;
  contentBackgroundColor?: string;
  descriptionColor?: string;
  emphasisPanelBackgroundColor?: string;
  emphasisPanelBorderColor?: string;
  emphasisPanelTextColor?: string;
  heroPanelBackgroundColor?: string;
  heroPanelBorderColor?: string;
  iconWellBackgroundColor?: string;
  iconWellColor?: string;
  oauthProviderCardBackgroundColor?: string;
  oauthProviderCardBorderColor?: string;
  pageBackgroundColor?: string;
  qrFrameBackgroundColor?: string;
  qrFrameBorderColor?: string;
  sectionSurfaceBackgroundColor?: string;
  sectionSurfaceBorderColor?: string;
  shellBackgroundColor?: string;
  shellBorderColor?: string;
  shellShadow?: string;
  standardsCardBackgroundColor?: string;
  standardsCardBorderColor?: string;
  standardsPanelBackgroundColor?: string;
  standardsPanelBorderColor?: string;
  standardsPanelColor?: string;
  titleColor?: string;
}

export interface UserCenterSurfaceAppearanceBundle {
  auth: SdkworkAuthAppearanceConfig;
  user: SdkworkUserAppearanceConfig;
}

export interface UserCenterSurfaceAppearanceInput {
  auth?: SdkworkAuthAppearanceConfig;
  authPreset?: SdkworkAuthAppearancePreset;
  preset?: UserCenterSurfaceAppearancePreset;
  theme?: UserCenterSurfaceThemeTokens;
  user?: SdkworkUserAppearanceConfig;
  userPreset?: SdkworkUserAppearancePreset;
}

export interface UserCenterSurfaceThemeAppearanceBundle {
  auth: SdkworkAuthThemeTokens;
  user: SdkworkUserThemeTokens;
}
