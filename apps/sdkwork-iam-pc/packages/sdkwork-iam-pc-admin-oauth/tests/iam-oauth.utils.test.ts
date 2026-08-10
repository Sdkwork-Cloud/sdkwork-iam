import { describe, expect, it } from "vitest";

import {
  buildProviderPlatforms,
  formatResourceLabel,
  readAuthorizationStatus,
  readEnabled,
  readProviderClientSecret,
  templateMessage,
} from "../src/utils/oauth-admin-utils";
import {
  collectConfiguredDomains,
  generateWechatEncodingAesKey,
  generateWechatToken,
} from "../src/components/oauth-account-setup-section";

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

  describe("readEnabled", () => {
    it("reads JSON booleans", () => {
      expect(readEnabled({ enabled: true })).toBe(true);
      expect(readEnabled({ enabled: false })).toBe(false);
      expect(readEnabled({ is_enabled: true })).toBe(true);
    });

    it("reads the PostgreSQL integer 0/1 shape returned by the backend", () => {
      // iam_oauth_resource_account.enabled is an INTEGER column; list
      // responses carry it as a JSON number (the actual wire shape).
      expect(readEnabled({ enabled: 0, status: "active" })).toBe(false);
      expect(readEnabled({ enabled: 1, status: "active" })).toBe(true);
      expect(readEnabled({ is_enabled: 1 })).toBe(true);
    });

    it("falls back to status only when the enabled column is absent", () => {
      expect(readEnabled({ status: "active" })).toBe(true);
      expect(readEnabled({ status: "inactive" })).toBe(false);
      expect(readEnabled({})).toBeUndefined();
    });
  });

  describe("collectConfiguredDomains", () => {
    it("collects the web authorization domain and business domains for official accounts", () => {
      const domains = collectConfiguredDomains({
        webDomain: "app.example.com",
        domains: {
          // Mini-program legal domains are not official-account concepts.
          request: ["https://api.example.com"],
          business: ["https://open.example.com"],
        },
      }, "official_account");
      expect(domains.map((item) => item.domain)).toEqual([
        "app.example.com",
        "open.example.com",
      ]);
      const app = domains.find((item) => item.domain === "app.example.com");
      expect(app?.kinds).toEqual(["web"]);
    });

    it("normalizes scheme and trailing slashes", () => {
      const domains = collectConfiguredDomains({
        webDomain: "https://app.example.com/",
        domains: { request: ["https://api.example.com"] },
      }, "official_account");
      expect(domains[0].domain).toBe("app.example.com");
    });

    it("collects official account JS secure and business domains", () => {
      const domains = collectConfiguredDomains({
        webDomain: "app.example.com",
        jsSecureDomains: ["js.example.com", "app.example.com"],
        businessDomains: ["open.example.com"],
      }, "official_account");
      expect(domains.map((item) => item.domain)).toEqual([
        "app.example.com",
        "js.example.com",
        "open.example.com",
      ]);
      const app = domains.find((item) => item.domain === "app.example.com");
      expect(app?.kinds).toContain("web");
      expect(app?.kinds).toContain("jsSecure");
      const js = domains.find((item) => item.domain === "js.example.com");
      expect(js?.kinds).toEqual(["jsSecure"]);
    });

    it("keeps legacy mini-program-shaped business domains visible", () => {
      const domains = collectConfiguredDomains({
        webDomain: "app.example.com",
        domains: { business: ["open.example.com"] },
      }, "official_account");
      const open = domains.find((item) => item.domain === "open.example.com");
      expect(open?.kinds).toEqual(["business"]);
    });

    it("returns an empty list without configured domains", () => {
      expect(collectConfiguredDomains({}, "official_account")).toEqual([]);
    });

    it("collects mini program legal domains without the web authorization domain", () => {
      const domains = collectConfiguredDomains({
        webDomain: "app.example.com",
        domains: {
          request: ["https://api.example.com"],
          socket: ["wss://ws.example.com"],
          business: ["https://open.example.com"],
        },
      }, "mini_program");
      expect(domains.map((item) => item.domain)).toEqual([
        "api.example.com",
        "ws.example.com",
        "open.example.com",
      ]);
      expect(domains.some((item) => item.domain === "app.example.com")).toBe(false);
    });
  });

  describe("wechat secret generation", () => {
    it("generates a 32-character alphanumeric token", () => {
      const token = generateWechatToken();
      expect(token).toHaveLength(32);
      expect(/^[A-Za-z0-9]{32}$/u.test(token)).toBe(true);
    });

    it("generates a 43-character alphanumeric EncodingAESKey", () => {
      const key = generateWechatEncodingAesKey();
      expect(key).toHaveLength(43);
      expect(/^[A-Za-z0-9]{43}$/u.test(key)).toBe(true);
    });
  });

  describe("readAuthorizationStatus", () => {
    it("reads the authorization status from the account row", () => {
      expect(readAuthorizationStatus({ authorizationStatus: "authorized" })).toBe("authorized");
      expect(readAuthorizationStatus({ authorization_status: "pending" })).toBe("pending");
      expect(readAuthorizationStatus({})).toBe("");
    });
  });

  describe("readProviderClientSecret", () => {
    it("reads the echoed provider client secret from the account row", () => {
      expect(readProviderClientSecret({ providerClientSecret: "wx-secret-1" })).toBe("wx-secret-1");
      expect(readProviderClientSecret({ provider_client_secret: "wx-secret-2" })).toBe("wx-secret-2");
      expect(readProviderClientSecret({ providerClientSecret: "  " })).toBe("");
      expect(readProviderClientSecret({})).toBe("");
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
