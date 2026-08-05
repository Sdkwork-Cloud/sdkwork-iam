import { describe, expect, it } from "vitest";

import {
  buildProviderPlatforms,
  formatResourceLabel,
  templateMessage,
} from "../src/utils/oauth-admin-utils";

describe("SDKWork IAM OAuth admin utils", () => {
  describe("templateMessage", () => {
    it("replaces {key} placeholders", () => {
      expect(templateMessage("Configured integrations ({count})", { count: "3" }))
        .toBe("Configured integrations (3)");
      expect(templateMessage("登录 {name} 账号", { name: "微信" })).toBe("登录 微信 账号");
    });
  });

  describe("formatResourceLabel", () => {
    it("falls back to the default copy when none is provided", () => {
      expect(formatResourceLabel({ displayName: "WeChat login", providerCode: "wechat", enabled: true }))
        .toBe("WeChat login (wechat) [enabled]");
      expect(formatResourceLabel({}))
        .toBe("Resource");
    });

    it("localizes status markers with the provided copy", () => {
      const copy = { disabled: "已禁用", enabled: "已启用", resource: "资源" };
      expect(formatResourceLabel({ displayName: "微信登录", providerCode: "wechat", enabled: true }, copy))
        .toBe("微信登录 (wechat) [已启用]");
      expect(formatResourceLabel({ displayName: "微信登录", enabled: false }, copy))
        .toBe("微信登录 [已禁用]");
      expect(formatResourceLabel({}, copy)).toBe("资源");
    });
  });

  describe("buildProviderPlatforms", () => {
    it("deduplicates catalog entries with the tenant entry winning", () => {
      const catalog = [
        { id: "global", providerCode: "wechat", providerName: "WeChat", ownerTenantId: "0" },
        { id: "tenant", providerCode: "wechat", providerName: "Tenant WeChat", ownerTenantId: "t1" },
      ];
      const platforms = buildProviderPlatforms(catalog, [], "en-US");
      expect(platforms).toHaveLength(1);
      expect(platforms[0].providerCode).toBe("wechat");
      expect(platforms[0].displayName).toBe("Tenant WeChat");
    });

    it("resolves display names by locale", () => {
      const catalog = [
        { providerCode: "wechat", providerName: "WeChat", providerDisplayName: "微信" },
      ];
      expect(buildProviderPlatforms(catalog, [], "zh-CN")[0].displayName).toBe("微信");
      expect(buildProviderPlatforms(catalog, [], "en-US")[0].displayName).toBe("WeChat");
    });

    it("keeps configured providers that are missing from the catalog", () => {
      const integrations = [
        { id: "iamoi-1", providerCode: "custom_oidc", enabled: true },
      ];
      const platforms = buildProviderPlatforms([], integrations, "en-US");
      expect(platforms).toHaveLength(1);
      expect(platforms[0].providerCode).toBe("custom_oidc");
      expect(platforms[0].integrations[0].integrationId).toBe("iamoi-1");
      expect(platforms[0].integrations[0].enabled).toBe(true);
    });

    it("groups integrations by provider code", () => {
      const catalog = [{ providerCode: "github", providerName: "GitHub" }];
      const integrations = [
        { id: "iamoi-1", providerCode: "github", enabled: false },
        { id: "iamoi-2", providerCode: "github", enabled: true },
      ];
      const platforms = buildProviderPlatforms(catalog, integrations, "en-US");
      expect(platforms[0].integrations).toHaveLength(2);
    });

    it("ignores integrations without a provider code", () => {
      const platforms = buildProviderPlatforms([], [{ id: "iamoi-1" }], "en-US");
      expect(platforms).toHaveLength(0);
    });
  });
});
