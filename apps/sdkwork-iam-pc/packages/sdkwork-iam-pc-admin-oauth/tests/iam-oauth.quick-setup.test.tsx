import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SdkworkI18nProvider } from "@sdkwork/i18n-pc-react";

import { createSdkworkIamOauthAdminController } from "../src/services/oauth-admin-controller";
import { OauthResourceDrawer } from "../src/components/oauth-admin-ui";
import { createOauthServiceMock } from "./fixtures/oauth-service-mock";
import {
  SdkworkIamOauthMiniProgramAccountsPage,
  SdkworkIamOauthOfficialAccountsPage,
  SdkworkIamOauthProviderConnectionsPage,
} from "../src";
import type { SdkworkIamOauthAdminController } from "../src/types/oauth-admin-types";



describe("SDKWork IAM OAuth quick setup controller", () => {
  it("creates a mini program login integration and resource account in one step", async () => {
    const service = createOauthServiceMock();
    const controller = createSdkworkIamOauthAdminController(service as never);

    await controller.createAccountSetup("mini_program", {
      appId: "wx-test-mini-001",
      appSecret: "secret-001",
      displayName: "My mini program",
      enabled: true,
      redirectUri: "https://app.example.com/auth/oauth/callback",
    });

    expect(service.iam.oauth.integrations.list).toHaveBeenCalledWith({ page_size: 200, q: "wechat_mini_program" });
    expect(service.iam.oauth.integrations.create).toHaveBeenCalledWith({
      integrationCode: "mini-program-wx-test-mini-001",
      displayName: "My mini program",
      providerCode: "wechat_mini_program",
      providerClientId: "wx-test-mini-001",
      providerClientSecret: "secret-001",
      redirectUri: "https://app.example.com/auth/oauth/callback",
      surfaceKind: "mini_program",
      enabled: true,
    });
    expect(service.iam.oauth.resourceAccounts.create).toHaveBeenCalledWith({
      integrationId: "iamoi-1",
      providerCode: "wechat_mini_program",
      resourceAccountCode: "mini-wx-test-mini-001",
      resourceAccountKind: "mini_program",
      displayName: "My mini program",
      providerAccountId: "wx-test-mini-001",
      accessMode: "operator_managed",
    });
  });

  it("creates an official account login integration and reuses an existing integration", async () => {
    const service = createOauthServiceMock();
    (service.iam.oauth.integrations.list as ReturnType<typeof vi.fn>).mockResolvedValue({
      items: [{
        id: "iamoi-existing",
        providerCode: "wechat",
        providerClientId: "wx-test-oa-001",
        displayName: "Existing WeChat",
      }],
    });
    const controller = createSdkworkIamOauthAdminController(service as never);

    await controller.createAccountSetup("official_account", {
      appId: "wx-test-oa-001",
      appSecret: "secret-002",
      displayName: "My official account",
      enabled: false,
      redirectUri: "https://app.example.com/auth/oauth/callback",
    });

    expect(service.iam.oauth.integrations.create).not.toHaveBeenCalled();
    expect(service.iam.oauth.integrations.update).toHaveBeenCalledWith("iamoi-existing", {
      enabled: false,
      redirectUri: "https://app.example.com/auth/oauth/callback",
    });
    expect(service.iam.oauth.resourceAccounts.create).toHaveBeenCalledWith(expect.objectContaining({
      integrationId: "iamoi-existing",
      providerCode: "wechat",
      resourceAccountKind: "official_account",
      providerAccountId: "wx-test-oa-001",
    }));
  });

  it("syncs the account and integration enabled state", async () => {
    const service = createOauthServiceMock();
    const controller = createSdkworkIamOauthAdminController(service as never);

    await controller.setResourceAccountEnabled("iamora-9", "iamoi-9", false);

    expect(service.iam.oauth.resourceAccounts.update).toHaveBeenCalledWith("iamora-9", { enabled: false });
    expect(service.iam.oauth.integrations.update).toHaveBeenCalledWith("iamoi-9", { enabled: false });
  });

  it("updates only the account when no integration is linked", async () => {
    const service = createOauthServiceMock();
    const controller = createSdkworkIamOauthAdminController(service as never);

    await controller.setResourceAccountEnabled("iamora-10", "", true);

    expect(service.iam.oauth.resourceAccounts.update).toHaveBeenCalledWith("iamora-10", { enabled: true });
    expect(service.iam.oauth.integrations.update).not.toHaveBeenCalled();
  });
});

const EMPTY_STATE = {
  accountLinks: [],
  callbackEvents: [],
  claimMappings: [],
  clients: [],
  diagnosticRuns: [],
  flowConfigs: [],
  grants: [],
  integrations: [],
  operationalResources: [],
  operatorPlatforms: [],
  policies: [],
  providerCatalog: [{
    id: "iamopc-1",
    providerCode: "google",
    providerName: "Google",
    providerDisplayName: "Google",
  }, {
    id: "iamopc-2",
    providerCode: "wechat",
    providerName: "WeChat",
    providerDisplayName: "WeChat",
  }],
  resourceAccounts: [{
    id: "iamora-1",
    integrationId: "iamoi-1",
    providerCode: "wechat_mini_program",
    resourceAccountCode: "mini-wx-test",
    resourceAccountKind: "mini_program",
    displayName: "My mini program",
    providerAccountId: "wx-test-mini-001",
    enabled: true,
  }, {
    id: "iamora-2",
    integrationId: "iamoi-2",
    providerCode: "wechat",
    resourceAccountCode: "oa-wx-test",
    resourceAccountKind: "official_account",
    displayName: "My official account",
    providerAccountId: "wx-test-oa-001",
    enabled: false,
  }],
  scopeProfiles: [],
  secrets: [],
  status: "ready",
  surfaces: [],
  tenantBindings: [],
  webhookConfigs: [],
};

const controller = {
  getState: () => EMPTY_STATE,
  load: () => Promise.resolve(EMPTY_STATE),
} as SdkworkIamOauthAdminController;

describe("SDKWork IAM OAuth quick setup pages", () => {
  it("shows only added platforms as rows and offers an add action", () => {
    const html = renderToStaticMarkup(
      <SdkworkI18nProvider locale="zh-CN">
        <SdkworkIamOauthProviderConnectionsPage controller={controller} />
      </SdkworkI18nProvider>,
    );
    expect(html).toContain("尚未添加平台");
    expect(html).toContain("添加平台");
    // Catalog platforms stay hidden until the operator adds them.
    expect(html).not.toContain("Google");
    expect(html).not.toContain("wechat");
  });

  it("renders added platforms as rows with enable/disable and delete actions", () => {
    const configuredState = {
      ...EMPTY_STATE,
      integrations: [{
        id: "iamoi-google-1",
        integrationCode: "google-google-1",
        providerCode: "google",
        displayName: "Google Login",
        enabled: true,
      }],
    };
    const configuredController = {
      getState: () => configuredState,
      load: () => Promise.resolve(configuredState),
    } as SdkworkIamOauthAdminController;
    const html = renderToStaticMarkup(
      <SdkworkI18nProvider locale="zh-CN">
        <SdkworkIamOauthProviderConnectionsPage controller={configuredController} />
      </SdkworkI18nProvider>,
    );
    expect(html).toContain("已配置平台（1）");
    expect(html).toContain("Google");
    expect(html).toContain("google");
    expect(html).toContain("已开启");
    expect(html).not.toContain("尚未添加平台");
  });

  it("renders the mini program accounts page as a list with a top add action", () => {
    const html = renderToStaticMarkup(
      <SdkworkI18nProvider locale="zh-CN">
        <SdkworkIamOauthMiniProgramAccountsPage controller={controller} />
      </SdkworkI18nProvider>,
    );
    expect(html).toContain("小程序账号");
    expect(html).toContain("添加小程序账号");
    expect(html).toContain("My mini program");
    expect(html).toContain("已启用");
    expect(html).not.toContain("My official account");
  });

  it("renders the official accounts page as a list with a top add action", () => {
    const html = renderToStaticMarkup(
      <SdkworkI18nProvider locale="zh-CN">
        <SdkworkIamOauthOfficialAccountsPage controller={controller} />
      </SdkworkI18nProvider>,
    );
    expect(html).toContain("公众号账号");
    expect(html).toContain("添加公众号账号");
    expect(html).toContain("My official account");
    expect(html).toContain("未启用");
    expect(html).not.toContain("My mini program");
  });

  it("renders drawer forms with a bottom action bar (cancel + confirm)", async () => {
    const { findByText } = render(
      <SdkworkI18nProvider locale="zh-CN">
        <OauthResourceDrawer
          confirmDisabled={false}
          confirmLabel="保存并开启"
          description="测试抽屉"
          onConfirm={() => undefined}
          open
          triggerLabel="添加平台"
        >
          <div>表单字段</div>
        </OauthResourceDrawer>
      </SdkworkI18nProvider>,
    );
    // The footer action bar keeps cancel and confirm together at the bottom.
    expect(await findByText("保存并开启")).toBeTruthy();
    const footer = document.querySelector('[data-sdk-ui="drawer-footer"]');
    expect(footer).toBeTruthy();
    expect(footer?.textContent).toContain("取消");
    expect(footer?.textContent).toContain("保存并开启");
  });

  it("opens the full developer configuration drawer from an account row", async () => {
    const configuredState = {
      ...EMPTY_STATE,
      resourceAccounts: [{
        id: "iamora-1",
        integrationId: "iamoi-1",
        providerCode: "wechat_mini_program",
        resourceAccountCode: "mini-wx-test",
        resourceAccountKind: "mini_program",
        displayName: "My mini program",
        providerAccountId: "wx-test-mini-001",
        enabled: true,
        domainVerifyStatus: "pending",
        providerConfigJson: JSON.stringify({
          webDomain: "app.example.com",
          redirectUri: "https://app.example.com/auth/oauth/callback",
          domains: { request: ["https://api.example.com"] },
          verifyFile: { fileName: "MP_verify_abc.txt", content: "wx-content" },
          notify: { url: "https://app.example.com/wechat/notify", token: "t", encodingAesKey: "k", encryptMode: "safe", dataFormat: "json" },
        }),
      }],
    };
    const configuredController = {
      getState: () => configuredState,
      load: () => Promise.resolve(configuredState),
      updateAccountConfig: () => Promise.resolve({}),
      runResourceAccountVerification: () => Promise.resolve({}),
      setResourceAccountEnabled: () => Promise.resolve({}),
      listPageResource: () => Promise.resolve([]),
    } as SdkworkIamOauthAdminController;
    const { unmount } = render(
      <SdkworkI18nProvider locale="zh-CN">
        <SdkworkIamOauthMiniProgramAccountsPage controller={configuredController} />
      </SdkworkI18nProvider>,
    );
    await screen.findByText("My mini program");

    // Row actions: edit button opens the developer configuration drawer.
    const editButton = screen.getByTitle("操作");
    fireEvent.click(editButton);

    expect(await screen.findByText("开发配置")).toBeTruthy();
    expect(screen.getByText("自定义域名")).toBeTruthy();
    expect(screen.getByText("域名校验文件")).toBeTruthy();
    expect(screen.getByText("消息通知")).toBeTruthy();
    expect(screen.getByDisplayValue("MP_verify_abc.txt")).toBeTruthy();
    expect(screen.getByDisplayValue("https://app.example.com/auth/oauth/callback")).toBeTruthy();
    expect(screen.getByText("保存配置")).toBeTruthy();
    unmount();
  });
});
