import { describe, expect, it } from "vitest";

import { isSdkworkMobileAuthViewport } from "../src/index";

describe("@sdkwork/iam-h5-auth viewport detection", () => {
  it("detects phone browsers through the user agent", () => {
    expect(isSdkworkMobileAuthViewport({
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
    })).toBe(true);

    expect(isSdkworkMobileAuthViewport({
      userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Mobile Safari/537.36",
    })).toBe(true);

    expect(isSdkworkMobileAuthViewport({
      userAgent: "Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.0.0 Mobile MicroMessenger/8.0.47",
    })).toBe(true);
  });

  it("keeps desktop browsers on the desktop surface even in narrow windows", () => {
    expect(isSdkworkMobileAuthViewport({
      matchMedia: () => ({ matches: true }),
      maxTouchPoints: 0,
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
    })).toBe(false);
  });

  it("uses touch + narrow viewport as an assist for hybrid shells", () => {
    expect(isSdkworkMobileAuthViewport({
      matchMedia: (query) => ({ matches: query === "(max-width: 768px)" }),
      maxTouchPoints: 5,
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
    })).toBe(true);

    // Touch device on a wide window stays on the desktop surface.
    expect(isSdkworkMobileAuthViewport({
      matchMedia: () => ({ matches: false }),
      maxTouchPoints: 5,
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
    })).toBe(false);
  });

  it("fails closed when no environment information is available", () => {
    expect(isSdkworkMobileAuthViewport({})).toBe(false);
  });
});
