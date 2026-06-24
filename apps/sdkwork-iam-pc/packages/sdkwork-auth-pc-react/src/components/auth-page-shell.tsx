import {
  createElement,
  type ReactNode,
} from "react";
import {
  createSdkworkAuthDarkPanelStyle,
  createSdkworkAuthLightShellStyle,
  SDKWORK_AUTH_SURFACE_THEME_STYLE,
  mergeSdkworkAuthClassNames,
  mergeSdkworkAuthStyles,
  resolveSdkworkAuthAppearance,
  type SdkworkAuthAppearanceConfig,
  type SdkworkAuthAsideContainerSlotProps,
  type SdkworkAuthHeaderSlotProps,
  type SdkworkAuthSlotContainerProps,
} from "../auth-appearance.ts";

export interface SdkworkAuthPageShellProps {
  appearance?: SdkworkAuthAppearanceConfig;
  aside: ReactNode;
  asidePresentation?: "panel" | "raw";
  badge?: ReactNode;
  children: ReactNode;
  description: ReactNode;
  showAside?: boolean;
  title: ReactNode;
}

function DefaultContainer({
  children,
  className,
  style,
}: SdkworkAuthSlotContainerProps) {
  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}

function DefaultAsideContainer({
  children,
  className,
  style,
}: SdkworkAuthAsideContainerSlotProps) {
  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}

function DefaultHeader({
  badge,
  className,
  description,
  style,
  title,
}: SdkworkAuthHeaderSlotProps) {
  return (
    <div className={className} style={style}>
      {badge}
      {title}
      {description}
    </div>
  );
}

export function SdkworkAuthPageShell({
  appearance,
  aside,
  asidePresentation = "panel",
  badge,
  children,
  description,
  showAside = true,
  title,
}: SdkworkAuthPageShellProps) {
  const resolvedAppearance = resolveSdkworkAuthAppearance(appearance);
  const slots = resolvedAppearance?.slots;
  const slotProps = resolvedAppearance?.slotProps;
  const PageSlot = slots?.Page ?? DefaultContainer;
  const BackgroundSlot = slots?.Background ?? DefaultContainer;
  const ShellSlot = slots?.Shell ?? DefaultContainer;
  const AsideContainerSlot = slots?.AsideContainer ?? DefaultAsideContainer;
  const AsidePanelSlot = slots?.AsidePanel ?? DefaultContainer;
  const ContentContainerSlot = slots?.ContentContainer ?? DefaultContainer;
  const HeaderSlot = slots?.Header ?? DefaultHeader;
  const BodySlot = slots?.Body ?? DefaultContainer;
  const badgeNode = badge ? (
    <div
      className={mergeSdkworkAuthClassNames(
        "inline-flex rounded-md px-2.5 py-1 text-xs font-medium uppercase tracking-[0.18em] text-primary-700 dark:text-primary-200",
        resolvedAppearance?.badgeClassName,
      )}
      style={resolvedAppearance?.badgeStyle}
    >
      {badge}
    </div>
  ) : undefined;
  const titleNode = (
    <h1
      className={mergeSdkworkAuthClassNames(
        badge ? "mt-4" : undefined,
        "text-3xl font-semibold tracking-tight text-[var(--sdkwork-auth-content-text-color,#09090b)] sm:text-4xl",
        resolvedAppearance?.titleClassName,
      )}
      style={resolvedAppearance?.titleStyle}
    >
      {title}
    </h1>
  );
  const descriptionNode = description ? (
    <p
      className={mergeSdkworkAuthClassNames(
        "mt-3 text-sm leading-7 text-[var(--sdkwork-auth-muted-color,#52525b)]",
        resolvedAppearance?.descriptionClassName,
      )}
      style={resolvedAppearance?.descriptionStyle}
    >
      {description}
    </p>
  ) : undefined;

  return createElement(
    PageSlot,
    {
      className: mergeSdkworkAuthClassNames(
        "sdkwork-auth-surface relative flex min-h-[100dvh] w-full items-center justify-center overflow-x-hidden overflow-y-auto bg-[var(--sdkwork-auth-page-background-color,#fafafa)] p-4 text-[var(--sdkwork-auth-content-text-color,#09090b)] dark:bg-zinc-950 sm:p-8",
        resolvedAppearance?.pageClassName,
        slotProps?.page?.className,
      ),
      style: mergeSdkworkAuthStyles(
        resolvedAppearance?.pageStyle,
        slotProps?.page?.style,
      ),
    },
    <>
      <style>{SDKWORK_AUTH_SURFACE_THEME_STYLE}</style>
      {createElement(
        BackgroundSlot,
        {
          className: mergeSdkworkAuthClassNames(
            "pointer-events-none absolute inset-0 overflow-hidden",
            slotProps?.background?.className,
          ),
          style: slotProps?.background?.style,
        },
        <>
          <div
            className={mergeSdkworkAuthClassNames(
              "absolute left-[8%] top-[10%] h-56 w-56 rounded-full bg-primary-500/6 blur-3xl dark:bg-primary-500/10",
              resolvedAppearance?.asideGlowPrimaryClassName,
            )}
            style={resolvedAppearance?.asideGlowPrimaryStyle}
          />
          <div
            className={mergeSdkworkAuthClassNames(
              "absolute bottom-[8%] right-[10%] h-64 w-64 rounded-full bg-zinc-300/20 blur-3xl dark:bg-zinc-900/60",
              resolvedAppearance?.asideGlowSecondaryClassName,
            )}
            style={resolvedAppearance?.asideGlowSecondaryStyle}
          />
        </>,
      )}

      {createElement(
        ShellSlot,
        {
          className: mergeSdkworkAuthClassNames(
            "sdkwork-auth-shell relative z-10 flex w-full flex-col overflow-hidden rounded-xl bg-white dark:bg-zinc-950",
            showAside ? "max-w-[920px] md:min-h-[560px] md:flex-row" : "max-w-md",
            resolvedAppearance?.shellClassName,
            slotProps?.shell?.className,
          ),
          style: mergeSdkworkAuthStyles(
            createSdkworkAuthLightShellStyle(),
            resolvedAppearance?.shellStyle,
            slotProps?.shell?.style,
          ),
        },
        <>
          {showAside ? createElement(
            AsideContainerSlot,
            {
              className: mergeSdkworkAuthClassNames(
                "w-full p-4 md:w-[40%] md:p-6",
                slotProps?.asideContainer?.className,
              ),
              presentation: asidePresentation,
              style: slotProps?.asideContainer?.style,
            },
            asidePresentation === "raw"
              ? aside
              : createElement(
                  AsidePanelSlot,
                  {
                    className: mergeSdkworkAuthClassNames(
                      "relative flex h-full flex-col justify-between overflow-hidden rounded-lg bg-zinc-950 p-8 text-white",
                      resolvedAppearance?.asidePanelClassName,
                      slotProps?.asidePanel?.className,
                    ),
                    style: mergeSdkworkAuthStyles(
                      createSdkworkAuthDarkPanelStyle(),
                      resolvedAppearance?.asidePanelStyle,
                      slotProps?.asidePanel?.style,
                    ),
                  },
                  <>
                    <div className="relative z-10 flex h-full min-h-full flex-col justify-between gap-6">
                      {aside}
                    </div>
                  </>,
                ),
          ) : null}

          {createElement(
            ContentContainerSlot,
            {
              className: mergeSdkworkAuthClassNames(
                "w-full p-8 text-[var(--sdkwork-auth-content-text-color,#09090b)] md:px-10 md:py-12",
                showAside ? "md:w-[60%]" : undefined,
                resolvedAppearance?.contentContainerClassName,
                slotProps?.contentContainer?.className,
              ),
              style: mergeSdkworkAuthStyles(
                resolvedAppearance?.contentContainerStyle,
                slotProps?.contentContainer?.style,
              ),
            },
            <div className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center">
              {createElement(
                HeaderSlot,
                {
                  badge: badgeNode,
                  className: mergeSdkworkAuthClassNames(
                    "mb-6",
                    resolvedAppearance?.headerClassName,
                    slotProps?.header?.className,
                  ),
                  description: descriptionNode,
                  style: mergeSdkworkAuthStyles(
                    resolvedAppearance?.headerStyle,
                    slotProps?.header?.style,
                  ),
                  title: titleNode,
                },
              )}
              {createElement(
                BodySlot,
                {
                  className: mergeSdkworkAuthClassNames(
                    resolvedAppearance?.bodyClassName,
                    slotProps?.body?.className,
                  ),
                  style: mergeSdkworkAuthStyles(
                    resolvedAppearance?.bodyStyle,
                    slotProps?.body?.style,
                  ),
                },
                children,
              )}
            </div>,
          )}
        </>,
      )}
    </>,
  );
}
