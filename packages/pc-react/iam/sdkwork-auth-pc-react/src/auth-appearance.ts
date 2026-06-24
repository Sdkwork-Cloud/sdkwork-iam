import type {
  ComponentType,
  CSSProperties,
  ReactNode,
} from "react";

export interface SdkworkAuthSlotContainerProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export interface SdkworkAuthAsideContainerSlotProps extends SdkworkAuthSlotContainerProps {
  presentation: "panel" | "raw";
}

export interface SdkworkAuthHeaderSlotProps extends SdkworkAuthSlotContainerProps {
  badge?: ReactNode;
  description: ReactNode;
  title: ReactNode;
}

export interface SdkworkAuthSurfaceSlots {
  AsideContainer?: ComponentType<SdkworkAuthAsideContainerSlotProps>;
  AsidePanel?: ComponentType<SdkworkAuthSlotContainerProps>;
  Background?: ComponentType<SdkworkAuthSlotContainerProps>;
  Body?: ComponentType<SdkworkAuthSlotContainerProps>;
  ContentContainer?: ComponentType<SdkworkAuthSlotContainerProps>;
  Header?: ComponentType<SdkworkAuthHeaderSlotProps>;
  Page?: ComponentType<SdkworkAuthSlotContainerProps>;
  Shell?: ComponentType<SdkworkAuthSlotContainerProps>;
}

export interface SdkworkAuthSurfaceSlotProps {
  asideContainer?: Partial<SdkworkAuthAsideContainerSlotProps>;
  asidePanel?: Partial<SdkworkAuthSlotContainerProps>;
  background?: Partial<SdkworkAuthSlotContainerProps>;
  body?: Partial<SdkworkAuthSlotContainerProps>;
  contentContainer?: Partial<SdkworkAuthSlotContainerProps>;
  header?: Partial<SdkworkAuthHeaderSlotProps>;
  page?: Partial<SdkworkAuthSlotContainerProps>;
  shell?: Partial<SdkworkAuthSlotContainerProps>;
}

export interface SdkworkAuthThemeTokens {
  asideCardBackgroundColor?: string;
  asideCardBorderColor?: string;
  asideGlowPrimaryColor?: string;
  asideGlowSecondaryColor?: string;
  asideIconWellBackgroundColor?: string;
  asideIconWellColor?: string;
  asidePanelBackgroundColor?: string;
  asidePanelBorderColor?: string;
  asidePanelColor?: string;
  badgeBackgroundColor?: string;
  badgeTextColor?: string;
  callbackBackgroundColor?: string;
  callbackTextColor?: string;
  contentBackgroundColor?: string;
  contentBorderColor?: string;
  contentTextColor?: string;
  descriptionColor?: string;
  dividerColor?: string;
  fieldBackgroundColor?: string;
  fieldBorderColor?: string;
  fieldPlaceholderColor?: string;
  fieldTextColor?: string;
  formMutedTextColor?: string;
  iconMutedColor?: string;
  labelColor?: string;
  oauthProviderCardActionColor?: string;
  oauthProviderCardBackgroundColor?: string;
  oauthProviderCardBorderColor?: string;
  oauthProviderCardHintColor?: string;
  oauthProviderCardIconBackgroundColor?: string;
  oauthProviderCardIconColor?: string;
  oauthProviderCardTitleColor?: string;
  pageBackgroundColor?: string;
  qrFrameBackgroundColor?: string;
  qrFrameBorderColor?: string;
  shellBackdropFilter?: string;
  shellBackgroundColor?: string;
  shellBorderColor?: string;
  tabActiveBackgroundColor?: string;
  tabActiveTextColor?: string;
  tabBackgroundColor?: string;
  tabInactiveTextColor?: string;
  titleColor?: string;
  validationMessageColor?: string;
}

export type SdkworkAuthAppearancePreset = "sdkwork" | "midnight" | "paper" | "standard";

export interface SdkworkAuthAppearanceConfig {
  asideCardClassName?: string;
  asideCardStyle?: CSSProperties;
  asideGlowPrimaryClassName?: string;
  asideGlowPrimaryStyle?: CSSProperties;
  asideGlowSecondaryClassName?: string;
  asideGlowSecondaryStyle?: CSSProperties;
  asideIconWellClassName?: string;
  asideIconWellStyle?: CSSProperties;
  asidePanelClassName?: string;
  asidePanelStyle?: CSSProperties;
  badgeClassName?: string;
  badgeStyle?: CSSProperties;
  bodyClassName?: string;
  bodyStyle?: CSSProperties;
  callbackHeaderClassName?: string;
  callbackHeaderStyle?: CSSProperties;
  callbackShellClassName?: string;
  callbackShellStyle?: CSSProperties;
  contentContainerClassName?: string;
  contentContainerStyle?: CSSProperties;
  descriptionClassName?: string;
  descriptionStyle?: CSSProperties;
  headerClassName?: string;
  headerStyle?: CSSProperties;
  oauthProviderCardClassName?: string;
  oauthProviderCardStyle?: CSSProperties;
  pageClassName?: string;
  pageStyle?: CSSProperties;
  qrFrameClassName?: string;
  qrFrameStyle?: CSSProperties;
  shellClassName?: string;
  shellStyle?: CSSProperties;
  slotProps?: SdkworkAuthSurfaceSlotProps;
  slots?: SdkworkAuthSurfaceSlots;
  theme?: SdkworkAuthThemeTokens;
  titleClassName?: string;
  titleStyle?: CSSProperties;
}

export function mergeSdkworkAuthClassNames(
  ...values: Array<string | false | null | undefined>
): string {
  return values.filter(Boolean).join(" ");
}

export function mergeSdkworkAuthStyles(
  ...styles: Array<CSSProperties | null | undefined>
): CSSProperties | undefined {
  const resolvedStyles = styles.filter(Boolean);
  if (!resolvedStyles.length) {
    return undefined;
  }

  return Object.assign({}, ...resolvedStyles);
}

function mergeSlotContainerProps<T extends { className?: string; style?: CSSProperties }>(
  currentValue: T | undefined,
  nextValue: T | undefined,
): T | undefined {
  if (!currentValue && !nextValue) {
    return undefined;
  }

  return {
    ...(currentValue ?? {}),
    ...(nextValue ?? {}),
    className: mergeSdkworkAuthClassNames(currentValue?.className, nextValue?.className) || undefined,
    style: mergeSdkworkAuthStyles(currentValue?.style, nextValue?.style),
  } as T;
}

function mergeSurfaceSlotProps(
  currentValue: SdkworkAuthSurfaceSlotProps | undefined,
  nextValue: SdkworkAuthSurfaceSlotProps | undefined,
): SdkworkAuthSurfaceSlotProps | undefined {
  if (!currentValue && !nextValue) {
    return undefined;
  }

  return {
    asideContainer: mergeSlotContainerProps(currentValue?.asideContainer, nextValue?.asideContainer),
    asidePanel: mergeSlotContainerProps(currentValue?.asidePanel, nextValue?.asidePanel),
    background: mergeSlotContainerProps(currentValue?.background, nextValue?.background),
    body: mergeSlotContainerProps(currentValue?.body, nextValue?.body),
    contentContainer: mergeSlotContainerProps(currentValue?.contentContainer, nextValue?.contentContainer),
    header: mergeSlotContainerProps(currentValue?.header, nextValue?.header),
    page: mergeSlotContainerProps(currentValue?.page, nextValue?.page),
    shell: mergeSlotContainerProps(currentValue?.shell, nextValue?.shell),
  };
}

function mergeAppearanceValue(
  key: keyof SdkworkAuthAppearanceConfig,
  currentValue: SdkworkAuthAppearanceConfig[keyof SdkworkAuthAppearanceConfig],
  nextValue: SdkworkAuthAppearanceConfig[keyof SdkworkAuthAppearanceConfig],
) {
  if (nextValue === undefined) {
    return currentValue;
  }

  if (key === "theme") {
    return {
      ...(currentValue as SdkworkAuthThemeTokens | undefined),
      ...(nextValue as SdkworkAuthThemeTokens | undefined),
    };
  }

  if (key === "slots") {
    return {
      ...(currentValue as SdkworkAuthSurfaceSlots | undefined),
      ...(nextValue as SdkworkAuthSurfaceSlots | undefined),
    };
  }

  if (key === "slotProps") {
    return mergeSurfaceSlotProps(
      currentValue as SdkworkAuthSurfaceSlotProps | undefined,
      nextValue as SdkworkAuthSurfaceSlotProps | undefined,
    );
  }

  if (String(key).endsWith("ClassName")) {
    return mergeSdkworkAuthClassNames(
      currentValue as string | undefined,
      nextValue as string | undefined,
    ) || undefined;
  }

  if (String(key).endsWith("Style")) {
    return mergeSdkworkAuthStyles(
      currentValue as CSSProperties | undefined,
      nextValue as CSSProperties | undefined,
    );
  }

  return nextValue;
}

export function mergeSdkworkAuthAppearanceConfigs(
  ...configs: Array<SdkworkAuthAppearanceConfig | null | undefined>
): SdkworkAuthAppearanceConfig | undefined {
  const resolvedConfigs = configs.filter(Boolean) as SdkworkAuthAppearanceConfig[];
  if (!resolvedConfigs.length) {
    return undefined;
  }

  const mergedConfig: SdkworkAuthAppearanceConfig = {};
  for (const config of resolvedConfigs) {
    for (const key of Object.keys(config) as Array<keyof SdkworkAuthAppearanceConfig>) {
      mergedConfig[key] = mergeAppearanceValue(key, mergedConfig[key], config[key]) as never;
    }
  }

  return mergedConfig;
}

function pickSdkworkAuthThemeOverrides(
  theme: SdkworkAuthThemeTokens | undefined,
  baseline: SdkworkAuthThemeTokens | undefined,
): SdkworkAuthThemeTokens | undefined {
  if (!theme) {
    return undefined;
  }

  const overrides: SdkworkAuthThemeTokens = {};
  for (const key of Object.keys(theme) as Array<keyof SdkworkAuthThemeTokens>) {
    const value = theme[key];
    if (value !== undefined && value !== baseline?.[key]) {
      overrides[key] = value;
    }
  }

  return Object.keys(overrides).length ? overrides : undefined;
}

export function resolveSdkworkAuthAppearance(
  appearance?: null | SdkworkAuthAppearanceConfig,
): SdkworkAuthAppearanceConfig | undefined {
  const defaultAppearance = createSdkworkAuthAppearancePreset("sdkwork");
  const themeOverrides = pickSdkworkAuthThemeOverrides(
    appearance?.theme,
    defaultAppearance.theme,
  );

  return mergeSdkworkAuthAppearanceConfigs(
    defaultAppearance,
    themeOverrides ? createSdkworkAuthThemeAppearance(themeOverrides) : undefined,
    appearance,
  );
}

export const SDKWORK_AUTH_SURFACE_THEME_STYLE = `
.sdkwork-auth-surface {
  background-color: var(--sdkwork-auth-page-background-color, #fafafa);
  color: var(--sdkwork-auth-content-text-color);
  color-scheme: light;
  --sdkwork-auth-action-button-text-color: var(--sdk-color-brand-primary, #dc2626);
  --sdkwork-auth-content-text-color: #09090b;
  --sdkwork-auth-divider-color: rgba(24, 24, 27, 0.08);
  --sdkwork-auth-field-background-color: #f4f4f5;
  --sdkwork-auth-field-border-color: transparent;
  --sdkwork-auth-field-placeholder-color: #a1a1aa;
  --sdkwork-auth-field-text-color: #09090b;
  --sdkwork-auth-icon-muted-color: #a1a1aa;
  --sdkwork-auth-label-color: #3f3f46;
  --sdkwork-auth-muted-color: #71717a;
  --sdkwork-auth-oauth-card-action-color: #a1a1aa;
  --sdkwork-auth-oauth-card-background-color: #f4f4f5;
  --sdkwork-auth-oauth-card-border-color: transparent;
  --sdkwork-auth-oauth-card-hint-color: #71717a;
  --sdkwork-auth-oauth-card-icon-background-color: #ececef;
  --sdkwork-auth-oauth-card-icon-color: #52525b;
  --sdkwork-auth-oauth-card-title-color: #18181b;
  --sdkwork-auth-outline-button-background-color: transparent;
  --sdkwork-auth-outline-button-border-color: transparent;
  --sdkwork-auth-outline-button-text-color: var(--sdk-color-brand-primary, #dc2626);
  --sdkwork-auth-page-background-color: #fafafa;
  --sdkwork-auth-primary-button-background-color: var(--sdk-color-brand-primary, #dc2626);
  --sdkwork-auth-primary-button-text-color: #ffffff;
  --sdkwork-auth-tab-active-background-color: transparent;
  --sdkwork-auth-tab-active-icon-color: var(--sdk-color-brand-primary, #dc2626);
  --sdkwork-auth-tab-active-text-color: #09090b;
  --sdkwork-auth-tab-hover-background-color: transparent;
  --sdkwork-auth-tab-hover-text-color: #18181b;
  --sdkwork-auth-tab-inactive-icon-color: #a1a1aa;
  --sdkwork-auth-tab-inactive-text-color: #71717a;
  --sdkwork-auth-tabs-background-color: transparent;
  --sdkwork-auth-validation-message-color: #b45309;
}

.sdkwork-auth-shell {
  background-color: #ffffff;
  border-color: transparent;
  box-shadow: none;
}

.sdkwork-auth-callback-shell {
  background-color: #ffffff;
  border-color: transparent;
  box-shadow: none;
}

.sdkwork-auth-surface input:-webkit-autofill,
.sdkwork-auth-surface input:-webkit-autofill:hover,
.sdkwork-auth-surface input:-webkit-autofill:focus {
  -webkit-text-fill-color: var(--sdkwork-auth-field-text-color, #09090b);
  box-shadow: 0 0 0 1000px var(--sdkwork-auth-field-background-color, #ffffff) inset;
  caret-color: var(--sdkwork-auth-field-text-color, #09090b);
  transition: background-color 9999s ease-out 0s;
}

.sdkwork-auth-surface input:autofill {
  background-color: var(--sdkwork-auth-field-background-color, #ffffff);
  color: var(--sdkwork-auth-field-text-color, #09090b);
  box-shadow: 0 0 0 1000px var(--sdkwork-auth-field-background-color, #ffffff) inset;
  caret-color: var(--sdkwork-auth-field-text-color, #09090b);
}

.sdkwork-auth-surface input[data-sdkwork-auth-secret-field="true"]::-ms-reveal,
.sdkwork-auth-surface input[data-sdkwork-auth-secret-field="true"]::-ms-clear {
  display: none;
}

.sdkwork-auth-surface input[data-sdkwork-auth-secret-field="true"]::-webkit-credentials-auto-fill-button,
.sdkwork-auth-surface input[data-sdkwork-auth-secret-field="true"]::-webkit-contacts-auto-fill-button {
  display: none !important;
  pointer-events: none;
  visibility: hidden;
}

.sdkwork-auth-tabs {
  background-color: var(--sdkwork-auth-tabs-background-color);
}

.sdkwork-auth-tab-button {
  background-color: transparent;
  color: var(--sdkwork-auth-tab-inactive-text-color);
}

.sdkwork-auth-tab-button:hover {
  background-color: var(--sdkwork-auth-tab-hover-background-color);
  color: var(--sdkwork-auth-tab-hover-text-color);
}

.sdkwork-auth-tab-button[data-state="active"] {
  background-color: var(--sdkwork-auth-tab-active-background-color);
  color: var(--sdkwork-auth-tab-active-text-color);
}

.sdkwork-auth-tab-icon {
  color: var(--sdkwork-auth-tab-inactive-icon-color);
}

.sdkwork-auth-tab-button[data-state="active"] .sdkwork-auth-tab-icon {
  color: var(--sdkwork-auth-tab-active-icon-color);
}

.dark .sdkwork-auth-surface,
[data-sdk-color-mode="dark"] .sdkwork-auth-surface,
.sdkwork-auth-surface[data-sdk-color-mode="dark"] {
  background-color: #09090b;
  color-scheme: dark;
  --sdkwork-auth-content-text-color: #ffffff;
  --sdkwork-auth-divider-color: rgba(255, 255, 255, 0.08);
  --sdkwork-auth-field-background-color: rgba(255, 255, 255, 0.06);
  --sdkwork-auth-field-border-color: transparent;
  --sdkwork-auth-field-placeholder-color: #a1a1aa;
  --sdkwork-auth-field-text-color: #f4f4f5;
  --sdkwork-auth-icon-muted-color: #71717a;
  --sdkwork-auth-label-color: #e4e4e7;
  --sdkwork-auth-muted-color: #a1a1aa;
  --sdkwork-auth-oauth-card-action-color: #71717a;
  --sdkwork-auth-oauth-card-background-color: rgba(255, 255, 255, 0.04);
  --sdkwork-auth-oauth-card-border-color: transparent;
  --sdkwork-auth-oauth-card-hint-color: #a1a1aa;
  --sdkwork-auth-oauth-card-icon-background-color: rgba(255, 255, 255, 0.06);
  --sdkwork-auth-oauth-card-icon-color: #d4d4d8;
  --sdkwork-auth-oauth-card-title-color: #f4f4f5;
  --sdkwork-auth-outline-button-background-color: transparent;
  --sdkwork-auth-outline-button-border-color: transparent;
  --sdkwork-auth-outline-button-text-color: #fca5a5;
  --sdkwork-auth-page-background-color: #09090b;
  --sdkwork-auth-tab-active-background-color: transparent;
  --sdkwork-auth-tab-active-icon-color: #fecaca;
  --sdkwork-auth-tab-active-text-color: #ffffff;
  --sdkwork-auth-tab-hover-background-color: transparent;
  --sdkwork-auth-tab-hover-text-color: #f4f4f5;
  --sdkwork-auth-tab-inactive-icon-color: #71717a;
  --sdkwork-auth-tab-inactive-text-color: #a1a1aa;
  --sdkwork-auth-tabs-background-color: transparent;
  --sdkwork-auth-validation-message-color: #fbbf24;
}

.dark .sdkwork-auth-shell,
[data-sdk-color-mode="dark"] .sdkwork-auth-shell,
.sdkwork-auth-shell[data-sdk-color-mode="dark"] {
  background-color: #09090b;
}

.dark .sdkwork-auth-callback-shell,
[data-sdk-color-mode="dark"] .sdkwork-auth-callback-shell,
.sdkwork-auth-callback-shell[data-sdk-color-mode="dark"] {
  background-color: #18181b;
}
`;

export function createSdkworkAuthDarkPanelStyle(): CSSProperties {
  return {
    backgroundColor: "#09090b",
    color: "#ffffff",
  };
}

export function createSdkworkAuthDarkCardStyle(): CSSProperties {
  return {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: "transparent",
  };
}

export function createSdkworkAuthDarkIconWellStyle(): CSSProperties {
  return {
    backgroundColor: "rgba(255,255,255,0.08)",
    color: "#ffffff",
  };
}

export function createSdkworkAuthDarkHeaderStyle(): CSSProperties {
  return {
    backgroundColor: "#09090b",
    color: "#ffffff",
  };
}

export function createSdkworkAuthLightShellStyle(): CSSProperties {
  return {};
}

export function createSdkworkAuthQrFrameStyle(): CSSProperties {
  return {
    backgroundColor: "rgba(24,24,27,0.7)",
  };
}

export function createSdkworkAuthOAuthCardStyle(): CSSProperties {
  return {};
}

export function createSdkworkAuthStandardAppearancePreset(): SdkworkAuthAppearanceConfig {
  return {
    theme: {
      asideCardBackgroundColor: "rgba(255, 255, 255, 0.060)",
      asideCardBorderColor: "transparent",
      asideGlowPrimaryColor: "rgba(51, 156, 255, 0.100)",
      asideGlowSecondaryColor: "rgba(255, 255, 255, 0.400)",
      asideIconWellBackgroundColor: "rgba(255, 255, 255, 0.080)",
      asideIconWellColor: "#ffffff",
      asidePanelBackgroundColor: "#09090b",
      asidePanelBorderColor: "transparent",
      asidePanelColor: "#FFFFFF",
      badgeBackgroundColor: "rgba(51, 156, 255, 0.100)",
      badgeTextColor: "#0369a1",
      callbackBackgroundColor: "#09090b",
      callbackTextColor: "#ffffff",
      contentBackgroundColor: "transparent",
      contentBorderColor: "transparent",
      contentTextColor: "#09090b",
      descriptionColor: "#71717a",
      dividerColor: "rgba(24, 24, 27, 0.100)",
      fieldBackgroundColor: "#f4f4f5",
      fieldBorderColor: "transparent",
      fieldPlaceholderColor: "#a1a1aa",
      fieldTextColor: "#09090b",
      formMutedTextColor: "#71717a",
      iconMutedColor: "#a1a1aa",
      labelColor: "#3f3f46",
      oauthProviderCardActionColor: "#a1a1aa",
      oauthProviderCardBackgroundColor: "#f4f4f5",
      oauthProviderCardBorderColor: "transparent",
      oauthProviderCardHintColor: "#71717a",
      oauthProviderCardIconBackgroundColor: "#ececef",
      oauthProviderCardIconColor: "#52525b",
      oauthProviderCardTitleColor: "#18181b",
      pageBackgroundColor: "#fafafa",
      qrFrameBackgroundColor: "rgba(24, 24, 27, 0.700)",
      qrFrameBorderColor: "transparent",
      shellBackgroundColor: "#ffffff",
      shellBorderColor: "transparent",
      tabActiveBackgroundColor: "transparent",
      tabActiveTextColor: "#09090b",
      tabBackgroundColor: "transparent",
      tabInactiveTextColor: "#71717a",
      titleColor: "#09090b",
      validationMessageColor: "#b45309",
    },
    slotProps: {
      contentContainer: {
        style: {
          backgroundColor: "transparent",
        },
      },
    },
  };
}

function createSdkworkAuthContentVariableStyle(
  theme: SdkworkAuthThemeTokens,
): CSSProperties | undefined {
  const variables: Record<string, string> = {};

  if (theme.contentTextColor) {
    variables["--sdkwork-auth-content-text-color"] = theme.contentTextColor;
  }
  if (theme.dividerColor) {
    variables["--sdkwork-auth-divider-color"] = theme.dividerColor;
  }
  if (theme.fieldBackgroundColor) {
    variables["--sdkwork-auth-field-background-color"] = theme.fieldBackgroundColor;
  }
  if (theme.fieldBorderColor) {
    variables["--sdkwork-auth-field-border-color"] = theme.fieldBorderColor;
  }
  if (theme.fieldPlaceholderColor) {
    variables["--sdkwork-auth-field-placeholder-color"] = theme.fieldPlaceholderColor;
  }
  if (theme.fieldTextColor) {
    variables["--sdkwork-auth-field-text-color"] = theme.fieldTextColor;
  }
  if (theme.formMutedTextColor) {
    variables["--sdkwork-auth-muted-color"] = theme.formMutedTextColor;
  }
  if (theme.iconMutedColor) {
    variables["--sdkwork-auth-icon-muted-color"] = theme.iconMutedColor;
  }
  if (theme.labelColor) {
    variables["--sdkwork-auth-label-color"] = theme.labelColor;
  }
  if (theme.validationMessageColor) {
    variables["--sdkwork-auth-validation-message-color"] = theme.validationMessageColor;
  }
  const oauthProviderCardTitleColor = theme.oauthProviderCardTitleColor
    ?? (theme.oauthProviderCardBackgroundColor ? theme.contentTextColor : undefined);
  const oauthProviderCardHintColor = theme.oauthProviderCardHintColor
    ?? (theme.oauthProviderCardBackgroundColor ? (theme.formMutedTextColor ?? theme.descriptionColor) : undefined);
  const oauthProviderCardIconColor = theme.oauthProviderCardIconColor
    ?? (theme.oauthProviderCardBackgroundColor
      ? (theme.iconMutedColor ?? theme.formMutedTextColor ?? theme.contentTextColor)
      : undefined);
  const oauthProviderCardActionColor = theme.oauthProviderCardActionColor
    ?? oauthProviderCardIconColor;

  if (oauthProviderCardActionColor) {
    variables["--sdkwork-auth-oauth-card-action-color"] = oauthProviderCardActionColor;
  }
  if (theme.oauthProviderCardBackgroundColor) {
    variables["--sdkwork-auth-oauth-card-background-color"] = theme.oauthProviderCardBackgroundColor;
  }
  if (theme.oauthProviderCardBorderColor) {
    variables["--sdkwork-auth-oauth-card-border-color"] = theme.oauthProviderCardBorderColor;
  }
  if (oauthProviderCardHintColor) {
    variables["--sdkwork-auth-oauth-card-hint-color"] = oauthProviderCardHintColor;
  }
  if (theme.oauthProviderCardIconBackgroundColor) {
    variables["--sdkwork-auth-oauth-card-icon-background-color"] = theme.oauthProviderCardIconBackgroundColor;
  }
  if (oauthProviderCardIconColor) {
    variables["--sdkwork-auth-oauth-card-icon-color"] = oauthProviderCardIconColor;
  }
  if (oauthProviderCardTitleColor) {
    variables["--sdkwork-auth-oauth-card-title-color"] = oauthProviderCardTitleColor;
  }
  if (theme.tabActiveBackgroundColor) {
    variables["--sdkwork-auth-tab-active-background-color"] = theme.tabActiveBackgroundColor;
  }
  if (theme.tabActiveTextColor) {
    variables["--sdkwork-auth-tab-active-text-color"] = theme.tabActiveTextColor;
  }
  if (theme.tabBackgroundColor) {
    variables["--sdkwork-auth-tabs-background-color"] = theme.tabBackgroundColor;
  }
  if (theme.tabInactiveTextColor) {
    variables["--sdkwork-auth-tab-inactive-text-color"] = theme.tabInactiveTextColor;
  }

  return Object.keys(variables).length ? variables as CSSProperties : undefined;
}

export function createSdkworkAuthThemeAppearance(
  theme: SdkworkAuthThemeTokens,
): SdkworkAuthAppearanceConfig {
  return {
    asideCardStyle: mergeSdkworkAuthStyles(
      theme.asideCardBackgroundColor || theme.asideCardBorderColor
        ? {
            ...(theme.asideCardBackgroundColor ? { backgroundColor: theme.asideCardBackgroundColor } : {}),
            ...(theme.asideCardBorderColor ? { borderColor: theme.asideCardBorderColor } : {}),
          }
        : undefined,
    ),
    asideGlowPrimaryStyle: theme.asideGlowPrimaryColor
      ? { backgroundColor: theme.asideGlowPrimaryColor }
      : undefined,
    asideGlowSecondaryStyle: theme.asideGlowSecondaryColor
      ? { backgroundColor: theme.asideGlowSecondaryColor }
      : undefined,
    asideIconWellStyle: mergeSdkworkAuthStyles(
      theme.asideIconWellBackgroundColor || theme.asideIconWellColor
        ? {
            ...(theme.asideIconWellBackgroundColor ? { backgroundColor: theme.asideIconWellBackgroundColor } : {}),
            ...(theme.asideIconWellColor ? { color: theme.asideIconWellColor } : {}),
          }
        : undefined,
    ),
    asidePanelStyle: mergeSdkworkAuthStyles(
      theme.asidePanelBackgroundColor || theme.asidePanelBorderColor || theme.asidePanelColor
        ? {
            ...(theme.asidePanelBackgroundColor ? { backgroundColor: theme.asidePanelBackgroundColor } : {}),
            ...(theme.asidePanelBorderColor ? { borderColor: theme.asidePanelBorderColor } : {}),
            ...(theme.asidePanelColor ? { color: theme.asidePanelColor } : {}),
          }
        : undefined,
    ),
    badgeStyle: mergeSdkworkAuthStyles(
      theme.badgeBackgroundColor || theme.badgeTextColor
        ? {
            ...(theme.badgeBackgroundColor ? { backgroundColor: theme.badgeBackgroundColor } : {}),
            ...(theme.badgeTextColor ? { color: theme.badgeTextColor } : {}),
          }
        : undefined,
    ),
    callbackHeaderStyle: mergeSdkworkAuthStyles(
      theme.callbackBackgroundColor || theme.callbackTextColor
        ? {
            ...(theme.callbackBackgroundColor ? { backgroundColor: theme.callbackBackgroundColor } : {}),
            ...(theme.callbackTextColor ? { color: theme.callbackTextColor } : {}),
          }
        : undefined,
    ),
    contentContainerStyle: mergeSdkworkAuthStyles(
      theme.contentBackgroundColor || theme.contentBorderColor || theme.contentTextColor
        ? {
            ...(theme.contentBackgroundColor ? { backgroundColor: theme.contentBackgroundColor } : {}),
            ...(theme.contentBorderColor ? { borderColor: theme.contentBorderColor } : {}),
            ...(theme.contentTextColor ? { color: theme.contentTextColor } : {}),
          }
        : undefined,
      createSdkworkAuthContentVariableStyle(theme),
    ),
    descriptionStyle: theme.descriptionColor
      ? { color: theme.descriptionColor }
      : undefined,
    oauthProviderCardStyle: theme.oauthProviderCardBackgroundColor
      ? { backgroundColor: theme.oauthProviderCardBackgroundColor }
      : undefined,
    pageStyle: theme.pageBackgroundColor
      ? { backgroundColor: theme.pageBackgroundColor }
      : undefined,
    qrFrameStyle: mergeSdkworkAuthStyles(
      theme.qrFrameBackgroundColor || theme.qrFrameBorderColor
        ? {
            ...(theme.qrFrameBackgroundColor ? { backgroundColor: theme.qrFrameBackgroundColor } : {}),
            ...(theme.qrFrameBorderColor ? { borderColor: theme.qrFrameBorderColor } : {}),
          }
        : undefined,
    ),
    shellStyle: mergeSdkworkAuthStyles(
      theme.shellBackgroundColor || theme.shellBackdropFilter || theme.shellBorderColor
        ? {
            ...(theme.shellBackgroundColor ? { backgroundColor: theme.shellBackgroundColor } : {}),
            ...(theme.shellBackdropFilter ? { backdropFilter: theme.shellBackdropFilter } : {}),
            ...(theme.shellBorderColor ? { borderColor: theme.shellBorderColor } : {}),
          }
        : undefined,
    ),
    bodyStyle: theme.contentTextColor
      ? { color: theme.contentTextColor }
      : undefined,
    titleStyle: theme.titleColor
      ? { color: theme.titleColor }
      : undefined,
  };
}

export function createSdkworkAuthAppearancePreset(
  preset: SdkworkAuthAppearancePreset = "sdkwork",
): SdkworkAuthAppearanceConfig {
  if (preset === "sdkwork" || preset === "standard") {
    return createSdkworkAuthStandardAppearancePreset();
  }

  if (preset === "midnight") {
    return {
      theme: {
        asideCardBackgroundColor: "rgba(255,255,255,0.08)",
        asideCardBorderColor: "rgba(148,163,184,0.12)",
        asideGlowPrimaryColor: "rgba(59,130,246,0.16)",
        asideGlowSecondaryColor: "rgba(15,23,42,0.88)",
        asideIconWellBackgroundColor: "rgba(255,255,255,0.10)",
        asideIconWellColor: "#ffffff",
        asidePanelBackgroundColor: "#020617",
        asidePanelBorderColor: "rgba(148,163,184,0.12)",
        asidePanelColor: "#ffffff",
        badgeBackgroundColor: "rgba(59,130,246,0.14)",
        badgeTextColor: "#bfdbfe",
        callbackBackgroundColor: "#020617",
        callbackTextColor: "#ffffff",
        contentBackgroundColor: "rgba(15,23,42,0.86)",
        contentBorderColor: "rgba(148,163,184,0.12)",
        contentTextColor: "#ffffff",
        descriptionColor: "#94a3b8",
        dividerColor: "rgba(148,163,184,0.16)",
        fieldBackgroundColor: "rgba(2,6,23,0.66)",
        fieldBorderColor: "rgba(148,163,184,0.20)",
        fieldPlaceholderColor: "#64748b",
        fieldTextColor: "#ffffff",
        formMutedTextColor: "#94a3b8",
        iconMutedColor: "#94a3b8",
        labelColor: "#e2e8f0",
        oauthProviderCardActionColor: "#64748b",
        oauthProviderCardBackgroundColor: "rgba(15,23,42,0.70)",
        oauthProviderCardBorderColor: "rgba(148,163,184,0.14)",
        oauthProviderCardHintColor: "#94a3b8",
        oauthProviderCardIconBackgroundColor: "rgba(255,255,255,0.08)",
        oauthProviderCardIconColor: "#cbd5e1",
        oauthProviderCardTitleColor: "#ffffff",
        pageBackgroundColor: "#020617",
        qrFrameBackgroundColor: "rgba(15,23,42,0.78)",
        qrFrameBorderColor: "rgba(148,163,184,0.12)",
        shellBackdropFilter: "blur(20px)",
        shellBackgroundColor: "rgba(2,6,23,0.88)",
        shellBorderColor: "rgba(148,163,184,0.12)",
        tabActiveBackgroundColor: "rgba(255,255,255,0.10)",
        tabActiveTextColor: "#ffffff",
        tabBackgroundColor: "rgba(2,6,23,0.58)",
        tabInactiveTextColor: "#94a3b8",
        titleColor: "#ffffff",
      },
    };
  }

  if (preset === "paper") {
    return {
      theme: {
        asideCardBackgroundColor: "rgba(255,255,255,0.10)",
        asideCardBorderColor: "rgba(148,163,184,0.18)",
        asideGlowPrimaryColor: "rgba(14,165,233,0.12)",
        asideGlowSecondaryColor: "rgba(255,255,255,0.48)",
        asideIconWellBackgroundColor: "rgba(255,255,255,0.10)",
        asideIconWellColor: "#ffffff",
        asidePanelBackgroundColor: "#0f172a",
        asidePanelBorderColor: "rgba(148,163,184,0.16)",
        asidePanelColor: "#ffffff",
        badgeBackgroundColor: "rgba(14,165,233,0.10)",
        badgeTextColor: "#0369a1",
        callbackBackgroundColor: "#0f172a",
        callbackTextColor: "#ffffff",
        contentBackgroundColor: "rgba(255,255,255,0.96)",
        contentBorderColor: "rgba(148,163,184,0.14)",
        contentTextColor: "#0f172a",
        descriptionColor: "#475569",
        dividerColor: "rgba(148,163,184,0.22)",
        fieldBackgroundColor: "#ffffff",
        fieldBorderColor: "rgba(148,163,184,0.30)",
        fieldPlaceholderColor: "#94a3b8",
        fieldTextColor: "#0f172a",
        formMutedTextColor: "#64748b",
        iconMutedColor: "#94a3b8",
        labelColor: "#334155",
        oauthProviderCardActionColor: "#94a3b8",
        oauthProviderCardBackgroundColor: "rgba(255,255,255,0.92)",
        oauthProviderCardBorderColor: "rgba(148,163,184,0.18)",
        oauthProviderCardHintColor: "#64748b",
        oauthProviderCardIconBackgroundColor: "#f1f5f9",
        oauthProviderCardIconColor: "#475569",
        oauthProviderCardTitleColor: "#0f172a",
        pageBackgroundColor: "#f8fafc",
        qrFrameBackgroundColor: "rgba(15,23,42,0.76)",
        qrFrameBorderColor: "rgba(148,163,184,0.12)",
        shellBackdropFilter: "blur(18px)",
        shellBackgroundColor: "rgba(255,255,255,0.98)",
        shellBorderColor: "rgba(148,163,184,0.16)",
        tabActiveBackgroundColor: "#ffffff",
        tabActiveTextColor: "#0f172a",
        tabBackgroundColor: "rgba(226,232,240,0.72)",
        tabInactiveTextColor: "#64748b",
        titleColor: "#0f172a",
      },
    };
  }

  return createSdkworkAuthAppearancePreset("sdkwork");
}
