import {
  createElement,
  type ReactNode,
} from "react";
import {
  createSdkworkUserDarkPanelStyle,
  createSdkworkUserHeroIconStyle,
  mergeSdkworkUserClassNames,
  resolveSdkworkUserAppearance,
  mergeSdkworkUserStyles,
  type SdkworkUserAppearanceConfig,
  type SdkworkUserHeroSlotProps,
  type SdkworkUserSlotContainerProps,
  type SdkworkUserStandardsSlotProps,
} from "../user-appearance.ts";

export interface SdkworkUserPageShellProps {
  appearance?: SdkworkUserAppearanceConfig;
  badge?: ReactNode;
  children: ReactNode;
  description: ReactNode;
  heroIcon?: ReactNode;
  standardsContent: ReactNode;
  standardsEyebrow?: ReactNode;
  title: ReactNode;
}

function DefaultContainer({
  children,
  className,
  style,
}: SdkworkUserSlotContainerProps) {
  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}

function DefaultHero({
  badge,
  className,
  description,
  icon,
  style,
  title,
}: SdkworkUserHeroSlotProps) {
  return (
    <section className={className} style={style}>
      {badge}
      <div className="mt-5 flex items-start gap-4">
        {icon}
        <div className="min-w-0">
          {title}
          {description}
        </div>
      </div>
    </section>
  );
}

function DefaultStandards({
  className,
  eyebrow,
  items,
  style,
}: SdkworkUserStandardsSlotProps) {
  return (
    <aside className={className} style={style}>
      {eyebrow}
      {items}
    </aside>
  );
}

export function SdkworkUserPageShell({
  appearance,
  badge,
  children,
  description,
  heroIcon,
  standardsContent,
  standardsEyebrow,
  title,
}: SdkworkUserPageShellProps) {
  const resolvedAppearance = resolveSdkworkUserAppearance(appearance);
  const slots = resolvedAppearance?.slots;
  const slotProps = resolvedAppearance?.slotProps;
  const PageSlot = slots?.Page ?? DefaultContainer;
  const ShellSlot = slots?.Shell ?? DefaultContainer;
  const HeroSlot = slots?.Hero ?? DefaultHero;
  const StandardsSlot = slots?.Standards ?? DefaultStandards;
  const ContentSlot = slots?.Content ?? DefaultContainer;
  const badgeNode = badge ? (
    <div
      className={mergeSdkworkUserClassNames(
        "inline-flex rounded-full border border-[var(--sdk-color-border-default)] bg-[var(--sdk-color-surface-panel-muted)] px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--sdk-color-brand-primary)]",
        resolvedAppearance?.heroBadgeClassName,
      )}
      style={resolvedAppearance?.heroBadgeStyle}
    >
      {badge}
    </div>
  ) : undefined;
  const heroIconNode = heroIcon ? (
    <div
      className={mergeSdkworkUserClassNames(
        "flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.2rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
        resolvedAppearance?.heroIconWellClassName,
      )}
      style={mergeSdkworkUserStyles(
        createSdkworkUserHeroIconStyle(),
        resolvedAppearance?.heroIconWellStyle,
      )}
    >
      {heroIcon}
    </div>
  ) : undefined;
  const titleNode = (
    <h1
      className={mergeSdkworkUserClassNames(
        "text-3xl font-semibold tracking-tight text-[var(--sdk-color-text-primary)] sm:text-4xl",
        resolvedAppearance?.heroTitleClassName,
      )}
      style={resolvedAppearance?.heroTitleStyle}
    >
      {title}
    </h1>
  );
  const descriptionNode = (
    <p
      className={mergeSdkworkUserClassNames(
        "mt-3 max-w-3xl text-sm leading-7 text-[var(--sdk-color-text-secondary)]",
        resolvedAppearance?.heroDescriptionClassName,
      )}
      style={resolvedAppearance?.heroDescriptionStyle}
    >
      {description}
    </p>
  );
  const eyebrowNode = standardsEyebrow ? (
    <div
      className={mergeSdkworkUserClassNames(
        "mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300",
        resolvedAppearance?.standardsEyebrowClassName,
      )}
      style={resolvedAppearance?.standardsEyebrowStyle}
    >
      {standardsEyebrow}
    </div>
  ) : undefined;

  return createElement(
    PageSlot,
    {
      className: mergeSdkworkUserClassNames(
        "relative flex min-h-full justify-center bg-[var(--sdk-color-surface-canvas)] px-4 py-4 sm:px-8 sm:py-8",
        resolvedAppearance?.pageClassName,
        slotProps?.page?.className,
      ),
      style: mergeSdkworkUserStyles(
        resolvedAppearance?.pageStyle,
        slotProps?.page?.style,
      ),
    },
    createElement(
      ShellSlot,
      {
        className: mergeSdkworkUserClassNames(
          "relative w-full max-w-7xl overflow-hidden rounded-[2rem] border border-[var(--sdk-color-border-default)] bg-[color-mix(in_srgb,var(--sdk-color-surface-panel)_96%,white)] p-4 shadow-[0_28px_80px_rgba(24,24,27,0.10)] sm:p-6 lg:min-h-[720px] lg:p-8",
          resolvedAppearance?.shellClassName,
          slotProps?.shell?.className,
        ),
        style: mergeSdkworkUserStyles(
          resolvedAppearance?.shellStyle,
          slotProps?.shell?.style,
        ),
      },
      <>
        <div className="mb-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
          {createElement(
            HeroSlot,
            {
              badge: badgeNode,
              className: mergeSdkworkUserClassNames(
                "rounded-[1.75rem] border border-[var(--sdk-color-border-default)] bg-[var(--sdk-color-surface-panel)] px-6 py-6 shadow-[var(--sdk-shadow-sm)] sm:px-8 sm:py-8",
                resolvedAppearance?.heroPanelClassName,
                slotProps?.hero?.className,
              ),
              description: descriptionNode,
              icon: heroIconNode,
              style: mergeSdkworkUserStyles(
                resolvedAppearance?.heroPanelStyle,
                slotProps?.hero?.style,
              ),
              title: titleNode,
            },
          )}

          {createElement(
            StandardsSlot,
            {
              className: mergeSdkworkUserClassNames(
                "rounded-[1.75rem] border px-6 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
                resolvedAppearance?.standardsPanelClassName,
                slotProps?.standards?.className,
              ),
              eyebrow: eyebrowNode,
              items: standardsContent,
              style: mergeSdkworkUserStyles(
                createSdkworkUserDarkPanelStyle(),
                resolvedAppearance?.standardsPanelStyle,
                slotProps?.standards?.style,
              ),
            },
          )}
        </div>

        {createElement(
          ContentSlot,
          {
            className: mergeSdkworkUserClassNames(
              resolvedAppearance?.contentClassName,
              slotProps?.content?.className,
            ),
            style: mergeSdkworkUserStyles(
              resolvedAppearance?.contentStyle,
              slotProps?.content?.style,
            ),
          },
          children,
        )}
      </>,
    ),
  );
}
