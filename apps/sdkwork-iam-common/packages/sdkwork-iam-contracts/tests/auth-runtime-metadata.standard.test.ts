import { describe, expect, it } from "vitest";

import { resolveSdkworkAuthRuntimeConfigFromMetadata } from "../src/auth-runtime-metadata.ts";

describe("SDKWork IAM auth runtime metadata", () => {
  it("preserves OAuth provider region from canonical auth metadata", () => {
    expect(
      resolveSdkworkAuthRuntimeConfigFromMetadata({
        oauthLoginEnabled: true,
        oauthProviderRegion: "overseas",
        supportsLocalCredentials: true,
      }),
    ).toMatchObject({
      oauthLoginEnabled: true,
      oauthProviderRegion: "overseas",
      oauthProviders: [],
    });
  });

  it("derives login methods from supportsLocalCredentials and supportsSessionExchange", () => {
    expect(
      resolveSdkworkAuthRuntimeConfigFromMetadata({
        supportsLocalCredentials: false,
        supportsSessionExchange: true,
        oauthLoginEnabled: true,
      }),
    ).toMatchObject({
      loginMethods: ["sessionBridge"],
      oauthLoginEnabled: true,
      registerMethods: [],
    });
  });

  it("uses metadata verification policy to hide disabled verification-code login tabs", () => {
    expect(
      resolveSdkworkAuthRuntimeConfigFromMetadata({
        loginMethods: ["password", "emailCode", "phoneCode"],
        verificationPolicy: {
          emailCodeLoginEnabled: true,
          phoneCodeLoginEnabled: false,
        },
      }).loginMethods,
    ).toEqual([
      "password",
      "emailCode",
    ]);
  });

  it("exposes sdkwork OAuth provider enablement from relying-party metadata", () => {
    expect(
      resolveSdkworkAuthRuntimeConfigFromMetadata({
        sdkworkOAuthProviderEnabled: true,
        oauthLoginEnabled: false,
      }),
    ).toMatchObject({
      sdkworkOAuthProviderEnabled: true,
      oauthLoginEnabled: false,
    });
  });
});
