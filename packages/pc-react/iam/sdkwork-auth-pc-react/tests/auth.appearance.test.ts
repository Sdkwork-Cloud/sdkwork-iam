import { describe, expect, it } from "vitest";
import {
  SDKWORK_AUTH_SURFACE_THEME_STYLE,
  createSdkworkAuthAppearancePreset,
  resolveSdkworkAuthAppearance,
} from "../src";

describe("sdkwork-auth-pc-react appearance", () => {
  it("uses the SDKWork auth surface as the canonical appbase baseline", () => {
    const sdkworkAppearance = resolveSdkworkAuthAppearance(
      createSdkworkAuthAppearancePreset("sdkwork"),
    );
    const standardAppearance = resolveSdkworkAuthAppearance(
      createSdkworkAuthAppearancePreset("standard"),
    );

    expect(sdkworkAppearance?.theme).toMatchObject({
      asidePanelBackgroundColor: "#09090b",
      asideGlowPrimaryColor: "rgba(51, 156, 255, 0.100)",
      asideGlowSecondaryColor: "rgba(255, 255, 255, 0.400)",
      asideIconWellColor: "#ffffff",
      asidePanelColor: "#FFFFFF",
      badgeBackgroundColor: "rgba(51, 156, 255, 0.100)",
      badgeTextColor: "#0369a1",
      callbackBackgroundColor: "#09090b",
      callbackTextColor: "#ffffff",
      contentBackgroundColor: "transparent",
      contentTextColor: "#09090b",
      fieldBackgroundColor: "#f4f4f5",
      oauthProviderCardBackgroundColor: "#f4f4f5",
      pageBackgroundColor: "#fafafa",
      qrFrameBackgroundColor: "rgba(24, 24, 27, 0.700)",
      shellBackgroundColor: "#ffffff",
      tabBackgroundColor: "transparent",
      titleColor: "#09090b",
    });
    expect(sdkworkAppearance?.pageStyle?.backgroundColor).toBeUndefined();
    expect(sdkworkAppearance?.shellStyle?.backgroundColor).toBeUndefined();
    expect(sdkworkAppearance?.contentContainerStyle?.color).toBeUndefined();
    expect(sdkworkAppearance?.bodyStyle?.color).toBeUndefined();
    expect(sdkworkAppearance?.descriptionStyle?.color).toBeUndefined();
    expect(sdkworkAppearance?.titleStyle?.color).toBeUndefined();
    expect(sdkworkAppearance?.shellStyle?.backgroundImage).toBeUndefined();
    expect(sdkworkAppearance?.shellStyle?.boxShadow).toBeUndefined();
    expect(sdkworkAppearance?.slotProps?.background?.style?.background).toBeUndefined();
    expect(sdkworkAppearance?.slotProps?.contentContainer?.style).toMatchObject({
      backgroundColor: "transparent",
    });
    expect(sdkworkAppearance?.slotProps?.contentContainer?.style?.borderLeft).toBeUndefined();
    expect(sdkworkAppearance?.slotProps?.contentContainer?.style?.boxShadow).toBeUndefined();

    expect(standardAppearance?.theme?.pageBackgroundColor).toBe(
      sdkworkAppearance?.theme?.pageBackgroundColor,
    );
    expect(standardAppearance?.shellStyle).toEqual(sdkworkAppearance?.shellStyle);
    expect(standardAppearance?.theme?.qrFrameBackgroundColor).toBe(
      sdkworkAppearance?.theme?.qrFrameBackgroundColor,
    );
  });

  it("keeps browser autofill from repainting login inputs with a gray fill", () => {
    expect(SDKWORK_AUTH_SURFACE_THEME_STYLE).toContain(".sdkwork-auth-surface input:-webkit-autofill");
    expect(SDKWORK_AUTH_SURFACE_THEME_STYLE).toContain(".sdkwork-auth-surface input:autofill");
    expect(SDKWORK_AUTH_SURFACE_THEME_STYLE).toContain(
      "-webkit-text-fill-color: var(--sdkwork-auth-field-text-color, #09090b);",
    );
    expect(SDKWORK_AUTH_SURFACE_THEME_STYLE).toContain(
      "box-shadow: 0 0 0 1000px var(--sdkwork-auth-field-background-color, #ffffff) inset;",
    );
    expect(SDKWORK_AUTH_SURFACE_THEME_STYLE).toContain(
      "caret-color: var(--sdkwork-auth-field-text-color, #09090b);",
    );
  });

  it("hides browser-native password reveal controls so the app renders one eye icon", () => {
    expect(SDKWORK_AUTH_SURFACE_THEME_STYLE).toContain(".sdkwork-auth-surface input[data-sdkwork-auth-secret-field=\"true\"]::-ms-reveal");
    expect(SDKWORK_AUTH_SURFACE_THEME_STYLE).toContain(".sdkwork-auth-surface input[data-sdkwork-auth-secret-field=\"true\"]::-ms-clear");
    expect(SDKWORK_AUTH_SURFACE_THEME_STYLE).toContain(".sdkwork-auth-surface input[data-sdkwork-auth-secret-field=\"true\"]::-webkit-credentials-auto-fill-button");
    expect(SDKWORK_AUTH_SURFACE_THEME_STYLE).toContain("display: none;");
    expect(SDKWORK_AUTH_SURFACE_THEME_STYLE).toContain("visibility: hidden;");
    expect(SDKWORK_AUTH_SURFACE_THEME_STYLE).toContain("pointer-events: none;");
    expect(SDKWORK_AUTH_SURFACE_THEME_STYLE).not.toContain("type=\"password\"");
  });
});
