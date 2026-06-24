import type {
  ComponentType,
  CSSProperties,
  ReactNode,
} from "react";

export interface SdkworkUserSlotContainerProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export interface SdkworkUserHeroSlotProps extends SdkworkUserSlotContainerProps {
  badge?: ReactNode;
  description: ReactNode;
  icon?: ReactNode;
  title: ReactNode;
}

export interface SdkworkUserStandardsSlotProps extends SdkworkUserSlotContainerProps {
  eyebrow?: ReactNode;
  items: ReactNode;
}

export interface SdkworkUserSurfaceSlots {
  Content?: ComponentType<SdkworkUserSlotContainerProps>;
  Hero?: ComponentType<SdkworkUserHeroSlotProps>;
  Page?: ComponentType<SdkworkUserSlotContainerProps>;
  Shell?: ComponentType<SdkworkUserSlotContainerProps>;
  Standards?: ComponentType<SdkworkUserStandardsSlotProps>;
}

export interface SdkworkUserSurfaceSlotProps {
  content?: Partial<SdkworkUserSlotContainerProps>;
  hero?: Partial<SdkworkUserHeroSlotProps>;
  page?: Partial<SdkworkUserSlotContainerProps>;
  shell?: Partial<SdkworkUserSlotContainerProps>;
  standards?: Partial<SdkworkUserStandardsSlotProps>;
}

export interface SdkworkUserThemeTokens {
  contentBackgroundColor?: string;
  heroBadgeBackgroundColor?: string;
  heroBadgeTextColor?: string;
  heroDescriptionColor?: string;
  heroIconBackgroundColor?: string;
  heroIconColor?: string;
  heroPanelBackgroundColor?: string;
  heroPanelBorderColor?: string;
  heroTitleColor?: string;
  pageBackgroundColor?: string;
  sectionSurfaceBackgroundColor?: string;
  sectionSurfaceBorderColor?: string;
  shellBackgroundColor?: string;
  shellBorderColor?: string;
  shellShadow?: string;
  standardsCardBackgroundColor?: string;
  standardsCardBorderColor?: string;
  standardsEyebrowColor?: string;
  standardsIconBackgroundColor?: string;
  standardsIconColor?: string;
  standardsPanelBackgroundColor?: string;
  standardsPanelBorderColor?: string;
  standardsPanelColor?: string;
}

export type SdkworkUserAppearancePreset = "sdkwork" | "midnight" | "paper" | "standard";

export interface SdkworkUserAppearanceConfig {
  contentClassName?: string;
  contentStyle?: CSSProperties;
  heroBadgeClassName?: string;
  heroBadgeStyle?: CSSProperties;
  heroDescriptionClassName?: string;
  heroDescriptionStyle?: CSSProperties;
  heroIconWellClassName?: string;
  heroIconWellStyle?: CSSProperties;
  heroPanelClassName?: string;
  heroPanelStyle?: CSSProperties;
  heroTitleClassName?: string;
  heroTitleStyle?: CSSProperties;
  pageClassName?: string;
  pageStyle?: CSSProperties;
  sectionSurfaceClassName?: string;
  sectionSurfaceStyle?: CSSProperties;
  shellClassName?: string;
  shellStyle?: CSSProperties;
  slotProps?: SdkworkUserSurfaceSlotProps;
  slots?: SdkworkUserSurfaceSlots;
  standardsCardClassName?: string;
  standardsCardStyle?: CSSProperties;
  standardsEyebrowClassName?: string;
  standardsEyebrowStyle?: CSSProperties;
  standardsIconWellClassName?: string;
  standardsIconWellStyle?: CSSProperties;
  standardsPanelClassName?: string;
  standardsPanelStyle?: CSSProperties;
  theme?: SdkworkUserThemeTokens;
}

export function mergeSdkworkUserClassNames(
  ...values: Array<string | false | null | undefined>
): string {
  return values.filter(Boolean).join(" ");
}

export function mergeSdkworkUserStyles(
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
    className: mergeSdkworkUserClassNames(currentValue?.className, nextValue?.className) || undefined,
    style: mergeSdkworkUserStyles(currentValue?.style, nextValue?.style),
  } as T;
}

function mergeUserSurfaceSlotProps(
  currentValue: SdkworkUserSurfaceSlotProps | undefined,
  nextValue: SdkworkUserSurfaceSlotProps | undefined,
): SdkworkUserSurfaceSlotProps | undefined {
  if (!currentValue && !nextValue) {
    return undefined;
  }

  return {
    content: mergeSlotContainerProps(currentValue?.content, nextValue?.content),
    hero: mergeSlotContainerProps(currentValue?.hero, nextValue?.hero),
    page: mergeSlotContainerProps(currentValue?.page, nextValue?.page),
    shell: mergeSlotContainerProps(currentValue?.shell, nextValue?.shell),
    standards: mergeSlotContainerProps(currentValue?.standards, nextValue?.standards),
  };
}

function mergeAppearanceValue(
  key: keyof SdkworkUserAppearanceConfig,
  currentValue: SdkworkUserAppearanceConfig[keyof SdkworkUserAppearanceConfig],
  nextValue: SdkworkUserAppearanceConfig[keyof SdkworkUserAppearanceConfig],
) {
  if (nextValue === undefined) {
    return currentValue;
  }

  if (key === "theme") {
    return {
      ...(currentValue as SdkworkUserThemeTokens | undefined),
      ...(nextValue as SdkworkUserThemeTokens | undefined),
    };
  }

  if (key === "slots") {
    return {
      ...(currentValue as SdkworkUserSurfaceSlots | undefined),
      ...(nextValue as SdkworkUserSurfaceSlots | undefined),
    };
  }

  if (key === "slotProps") {
    return mergeUserSurfaceSlotProps(
      currentValue as SdkworkUserSurfaceSlotProps | undefined,
      nextValue as SdkworkUserSurfaceSlotProps | undefined,
    );
  }

  if (String(key).endsWith("ClassName")) {
    return mergeSdkworkUserClassNames(
      currentValue as string | undefined,
      nextValue as string | undefined,
    ) || undefined;
  }

  if (String(key).endsWith("Style")) {
    return mergeSdkworkUserStyles(
      currentValue as CSSProperties | undefined,
      nextValue as CSSProperties | undefined,
    );
  }

  return nextValue;
}

export function mergeSdkworkUserAppearanceConfigs(
  ...configs: Array<SdkworkUserAppearanceConfig | null | undefined>
): SdkworkUserAppearanceConfig | undefined {
  const resolvedConfigs = configs.filter(Boolean) as SdkworkUserAppearanceConfig[];
  if (!resolvedConfigs.length) {
    return undefined;
  }

  const mergedConfig: SdkworkUserAppearanceConfig = {};
  for (const config of resolvedConfigs) {
    for (const key of Object.keys(config) as Array<keyof SdkworkUserAppearanceConfig>) {
      mergedConfig[key] = mergeAppearanceValue(key, mergedConfig[key], config[key]) as never;
    }
  }

  return mergedConfig;
}

export function resolveSdkworkUserAppearance(
  appearance?: null | SdkworkUserAppearanceConfig,
): SdkworkUserAppearanceConfig | undefined {
  if (!appearance) {
    return undefined;
  }

  return mergeSdkworkUserAppearanceConfigs(
    appearance.theme ? createSdkworkUserThemeAppearance(appearance.theme) : undefined,
    appearance,
  );
}

export function createSdkworkUserDarkPanelStyle(): CSSProperties {
  return {
    backgroundColor: "color-mix(in srgb, #09090b 94%, var(--sdk-color-brand-primary) 6%)",
    borderColor: "color-mix(in srgb, white 10%, transparent)",
    color: "var(--sdk-color-text-inverse)",
  };
}

export function createSdkworkUserDarkCardStyle(): CSSProperties {
  return {
    backgroundColor: "color-mix(in srgb, white 6%, transparent)",
    borderColor: "color-mix(in srgb, white 10%, transparent)",
  };
}

export function createSdkworkUserDarkIconWellStyle(): CSSProperties {
  return {
    backgroundColor: "color-mix(in srgb, white 10%, transparent)",
    color: "var(--sdk-color-text-inverse)",
  };
}

export function createSdkworkUserHeroIconStyle(): CSSProperties {
  return {
    backgroundColor: "color-mix(in srgb, #09090b 94%, var(--sdk-color-brand-primary) 6%)",
    color: "var(--sdk-color-text-inverse)",
  };
}

export function createSdkworkUserSectionSurfaceStyle(): CSSProperties {
  return {
    backgroundColor: "var(--sdk-color-surface-panel)",
    borderColor: "var(--sdk-color-border-default)",
  };
}

export function createSdkworkUserThemeAppearance(
  theme: SdkworkUserThemeTokens,
): SdkworkUserAppearanceConfig {
  return {
    contentStyle: theme.contentBackgroundColor
      ? { backgroundColor: theme.contentBackgroundColor }
      : undefined,
    heroBadgeStyle: mergeSdkworkUserStyles(
      theme.heroBadgeBackgroundColor || theme.heroBadgeTextColor
        ? {
            ...(theme.heroBadgeBackgroundColor ? { backgroundColor: theme.heroBadgeBackgroundColor } : {}),
            ...(theme.heroBadgeTextColor ? { color: theme.heroBadgeTextColor } : {}),
          }
        : undefined,
    ),
    heroDescriptionStyle: theme.heroDescriptionColor
      ? { color: theme.heroDescriptionColor }
      : undefined,
    heroIconWellStyle: mergeSdkworkUserStyles(
      theme.heroIconBackgroundColor || theme.heroIconColor
        ? {
            ...(theme.heroIconBackgroundColor ? { backgroundColor: theme.heroIconBackgroundColor } : {}),
            ...(theme.heroIconColor ? { color: theme.heroIconColor } : {}),
          }
        : undefined,
    ),
    heroPanelStyle: mergeSdkworkUserStyles(
      theme.heroPanelBackgroundColor || theme.heroPanelBorderColor
        ? {
            ...(theme.heroPanelBackgroundColor ? { backgroundColor: theme.heroPanelBackgroundColor } : {}),
            ...(theme.heroPanelBorderColor ? { borderColor: theme.heroPanelBorderColor } : {}),
          }
        : undefined,
    ),
    heroTitleStyle: theme.heroTitleColor
      ? { color: theme.heroTitleColor }
      : undefined,
    pageStyle: theme.pageBackgroundColor
      ? { backgroundColor: theme.pageBackgroundColor }
      : undefined,
    sectionSurfaceStyle: mergeSdkworkUserStyles(
      theme.sectionSurfaceBackgroundColor || theme.sectionSurfaceBorderColor
        ? {
            ...(theme.sectionSurfaceBackgroundColor ? { backgroundColor: theme.sectionSurfaceBackgroundColor } : {}),
            ...(theme.sectionSurfaceBorderColor ? { borderColor: theme.sectionSurfaceBorderColor } : {}),
          }
        : undefined,
    ),
    shellStyle: mergeSdkworkUserStyles(
      theme.shellBackgroundColor || theme.shellBorderColor || theme.shellShadow
        ? {
            ...(theme.shellBackgroundColor ? { backgroundColor: theme.shellBackgroundColor } : {}),
            ...(theme.shellBorderColor ? { borderColor: theme.shellBorderColor } : {}),
            ...(theme.shellShadow ? { boxShadow: theme.shellShadow } : {}),
          }
        : undefined,
    ),
    standardsCardStyle: mergeSdkworkUserStyles(
      theme.standardsCardBackgroundColor || theme.standardsCardBorderColor
        ? {
            ...(theme.standardsCardBackgroundColor ? { backgroundColor: theme.standardsCardBackgroundColor } : {}),
            ...(theme.standardsCardBorderColor ? { borderColor: theme.standardsCardBorderColor } : {}),
          }
        : undefined,
    ),
    standardsEyebrowStyle: theme.standardsEyebrowColor
      ? { color: theme.standardsEyebrowColor }
      : undefined,
    standardsIconWellStyle: mergeSdkworkUserStyles(
      theme.standardsIconBackgroundColor || theme.standardsIconColor
        ? {
            ...(theme.standardsIconBackgroundColor ? { backgroundColor: theme.standardsIconBackgroundColor } : {}),
            ...(theme.standardsIconColor ? { color: theme.standardsIconColor } : {}),
          }
        : undefined,
    ),
    standardsPanelStyle: mergeSdkworkUserStyles(
      theme.standardsPanelBackgroundColor || theme.standardsPanelBorderColor || theme.standardsPanelColor
        ? {
            ...(theme.standardsPanelBackgroundColor ? { backgroundColor: theme.standardsPanelBackgroundColor } : {}),
            ...(theme.standardsPanelBorderColor ? { borderColor: theme.standardsPanelBorderColor } : {}),
            ...(theme.standardsPanelColor ? { color: theme.standardsPanelColor } : {}),
          }
        : undefined,
    ),
  };
}

export function createSdkworkUserAppearancePreset(
  preset: SdkworkUserAppearancePreset = "sdkwork",
): SdkworkUserAppearanceConfig {
  if (preset === "sdkwork" || preset === "standard") {
    return {
      theme: {
        heroBadgeBackgroundColor: "rgba(var(--sdk-color-brand-primary-rgb, 59 130 246), 0.12)",
        heroBadgeTextColor: "var(--sdk-color-brand-primary)",
        heroDescriptionColor: "#52525b",
        heroIconBackgroundColor: "rgba(255,255,255,0.08)",
        heroIconColor: "#ffffff",
        heroPanelBackgroundColor: "rgba(255,255,255,0.98)",
        heroPanelBorderColor: "rgba(148,163,184,0.16)",
        heroTitleColor: "#09090b",
        pageBackgroundColor: "#f4f4f5",
        sectionSurfaceBackgroundColor: "rgba(255,255,255,0.98)",
        sectionSurfaceBorderColor: "rgba(148,163,184,0.16)",
        shellBackgroundColor: "rgba(255,255,255,0.92)",
        shellBorderColor: "rgba(255,255,255,0.36)",
        shellShadow: "0 28px 80px rgba(24,24,27,0.10)",
        standardsCardBackgroundColor: "rgba(255,255,255,0.06)",
        standardsCardBorderColor: "transparent",
        standardsEyebrowColor: "#d4d4d8",
        standardsIconBackgroundColor: "rgba(255,255,255,0.10)",
        standardsIconColor: "#ffffff",
        standardsPanelBackgroundColor: "#09090b",
        standardsPanelBorderColor: "transparent",
        standardsPanelColor: "#ffffff",
      },
    };
  }

  if (preset === "midnight") {
    return {
      theme: {
        contentBackgroundColor: "rgba(2,6,23,0.42)",
        heroBadgeBackgroundColor: "rgba(59,130,246,0.14)",
        heroBadgeTextColor: "#bfdbfe",
        heroDescriptionColor: "#94a3b8",
        heroPanelBackgroundColor: "rgba(15,23,42,0.82)",
        heroPanelBorderColor: "rgba(148,163,184,0.14)",
        heroTitleColor: "#ffffff",
        pageBackgroundColor: "#020617",
        sectionSurfaceBackgroundColor: "rgba(15,23,42,0.56)",
        sectionSurfaceBorderColor: "rgba(148,163,184,0.14)",
        shellBackgroundColor: "rgba(2,6,23,0.78)",
        shellBorderColor: "rgba(148,163,184,0.14)",
        shellShadow: "0 28px 80px rgba(2,6,23,0.40)",
        standardsCardBackgroundColor: "rgba(255,255,255,0.08)",
        standardsPanelBackgroundColor: "#020617",
        standardsPanelColor: "#ffffff",
      },
    };
  }

  if (preset === "paper") {
    return {
      theme: {
        heroBadgeBackgroundColor: "rgba(14,165,233,0.10)",
        heroBadgeTextColor: "#0369a1",
        heroDescriptionColor: "#475569",
        heroPanelBackgroundColor: "rgba(255,255,255,0.98)",
        heroPanelBorderColor: "rgba(148,163,184,0.18)",
        heroTitleColor: "#0f172a",
        pageBackgroundColor: "#f8fafc",
        sectionSurfaceBorderColor: "rgba(148,163,184,0.18)",
        shellBackgroundColor: "rgba(255,255,255,0.96)",
        shellBorderColor: "rgba(148,163,184,0.16)",
        shellShadow: "0 28px 80px rgba(15,23,42,0.10)",
      },
    };
  }

  return {
    theme: {
      heroBadgeBackgroundColor: "rgba(var(--sdk-color-brand-primary-rgb, 59 130 246), 0.12)",
      standardsCardBackgroundColor: "color-mix(in srgb, white 6%, transparent)",
    },
  };
}
