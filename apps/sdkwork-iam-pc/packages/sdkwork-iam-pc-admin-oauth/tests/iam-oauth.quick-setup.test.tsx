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
      enabled: true,
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
      enabled: false,
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
    providerAccountType: "service",
    providerAccountOriginalId: "gh_oa001",
    authorizationStatus: "authorized",
    providerConfigJson: JSON.stringify({ logoUrl: "data:image/png;base64,AAAA" }),
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
    // Name column shows the account type badge and the WeChat original id.
    expect(html).toContain("服务号");
    expect(html).toContain("gh_oa001");
    // Search input and filter selects are rendered in the header row.
    expect(html).toContain("搜索账号名称、AppID 或原始ID");
    expect(html).toContain("全部");
  });

  it("renders the account list search box, filters, and delete actions", () => {
    const { unmount } = render(
      <SdkworkI18nProvider locale="zh-CN">
        <SdkworkIamOauthOfficialAccountsPage controller={controller} />
      </SdkworkI18nProvider>,
    );
    expect(screen.getByPlaceholderText("搜索账号名称、AppID 或原始ID")).toBeTruthy();
    // Type / connection / enabled filter selects.
    expect(screen.getAllByRole("combobox")).toHaveLength(3);
    // Row actions include a delete button (with confirm dialog).
    const deleteButton = screen.getByTitle("删除");
    expect(deleteButton).toBeTruthy();
    fireEvent.click(deleteButton);
    expect(screen.getByText("确定删除账号 My official account 吗？删除后该账号的登录入口将立即失效。")).toBeTruthy();
    unmount();
  });

  it("generates and previews the official account follow QR from the row action", async () => {
    const service = createOauthServiceMock();
    (service.iam.oauth.resourceAccounts.list as ReturnType<typeof vi.fn>).mockResolvedValue({
      items: [{
        id: "iamora-2",
        integrationId: "iamoi-2",
        providerCode: "wechat",
        resourceAccountCode: "oa-wx-test",
        resourceAccountKind: "official_account",
        displayName: "My official account",
        providerAccountId: "wx-test-oa-001",
        enabled: true,
      }],
    });
    (service.iam.oauth.resourceAccounts.followQrCodes.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      expireSeconds: 0,
      permanent: true,
      qrCode: "https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=abc",
      qrContent: "https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=abc",
      qrMode: "official_account",
      scene: "follow:iamora-2",
      ticket: "abc",
    });
    const liveController = createSdkworkIamOauthAdminController(service as never);
    const { unmount } = render(
      <SdkworkI18nProvider locale="zh-CN">
        <SdkworkIamOauthOfficialAccountsPage controller={liveController} />
      </SdkworkI18nProvider>,
    );

    // Row action opens the follow QR dialog and renders the WeChat image.
    await screen.findByText("My official account");
    fireEvent.click(await screen.findByTitle("生成带参数二维码"));
    await screen.findByText("关注二维码");
    const image = await screen.findByAltText("My official account");
    expect(image.getAttribute("src"))
      .toBe("https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=abc");
    expect(screen.getByText("场景值: follow:iamora-2")).toBeTruthy();
    expect(screen.getByText("该二维码为永久有效，可长期投放使用。")).toBeTruthy();
    unmount();
  });

  it("renders the connection status column per account authorization", () => {
    const html = renderToStaticMarkup(
      <SdkworkI18nProvider locale="zh-CN">
        <SdkworkIamOauthOfficialAccountsPage controller={controller} />
      </SdkworkI18nProvider>,
    );
    // The official account fixture is authorized -> connected.
    expect(html).toContain("已接通");
    // The mini program page shows the not-yet-authorized account -> not connected.
    const miniHtml = renderToStaticMarkup(
      <SdkworkI18nProvider locale="zh-CN">
        <SdkworkIamOauthMiniProgramAccountsPage controller={controller} />
      </SdkworkI18nProvider>,
    );
    expect(miniHtml).toContain("未接通");
  });

  it("renders the official account AppID column and the uploaded logo icon", () => {
    const html = renderToStaticMarkup(
      <SdkworkI18nProvider locale="zh-CN">
        <SdkworkIamOauthOfficialAccountsPage controller={controller} />
      </SdkworkI18nProvider>,
    );
    // The dedicated AppID column carries the provider account id.
    expect(html).toContain("wx-test-oa-001");
    // The logo column renders the stored account logo (config.logoUrl).
    expect(html).toContain('data:image/png;base64,AAAA');
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
        providerAccountType: "enterprise",
        providerClientSecret: "mini-secret-1",
        enabled: true,
        domainVerifyStatus: "pending",
        providerConfigJson: JSON.stringify({
          webDomain: "app.example.com",
          redirectUri: "https://app.example.com/auth/oauth/callback",
          domains: { request: ["https://api.example.com"] },
          verifyFiles: [
            { domain: "api.example.com", fileName: "MP_verify_api.txt", content: "wx-api" },
          ],
          notify: { url: "https://app.example.com/wechat/notify", token: "t", encodingAesKey: "k", encryptMode: "safe", dataFormat: "json" },
        }),
      }],
    };
    const updateAccountCredentials = vi.fn();
    const configuredController = {
      getState: () => configuredState,
      load: () => Promise.resolve(configuredState),
      updateAccountConfig: () => Promise.resolve({}),
      updateAccountCredentials,
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

    // Mini programs have no server-config tab: basic / developer config / status.
    expect(await screen.findByRole("tab", { name: "基础信息" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "开发配置" })).toBeTruthy();
    expect(screen.queryByRole("tab", { name: "服务器配置" })).toBeNull();
    expect(screen.getByRole("tab", { name: "状态信息" })).toBeTruthy();

    // Basic info tab: editable name, subject type, original id, AppID/AppSecret.
    expect(screen.getByDisplayValue("My mini program")).toBeTruthy();
    // The saved subject type is echoed back into the edit form (not the
    // default personal fallback).
    expect(screen.getByRole("option", { name: "个人主体" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "企业主体" }).selected).toBe(true);
    expect(screen.getByPlaceholderText("gh_xxxxxxxx")).toBeTruthy();
    const appIdField = screen.getByDisplayValue("wx-test-mini-001");
    expect(appIdField).not.toBeDisabled();
    // The saved AppSecret is echoed back and prefilled so the edit drawer
    // shows the complete record.
    const secretInput = screen.getByDisplayValue("mini-secret-1") as HTMLInputElement;
    expect(secretInput).toBeTruthy();
    expect(secretInput.type).toBe("password");
    // The eye toggle reveals the secret in plain text.
    fireEvent.click(screen.getByTitle("显示明文"));
    expect((screen.getByDisplayValue("mini-secret-1") as HTMLInputElement).type).toBe("text");
    expect(screen.getByPlaceholderText("留空则保留原密钥")).toBeTruthy();

    // Developer config tab: server domains (dynamic rows), login callback and
    // the per-domain verification files (only the request legal domain).
    fireEvent.mouseDown(screen.getByRole("tab", { name: "开发配置" }));
    expect(screen.getByText("自定义域名")).toBeTruthy();
    expect(screen.getByText("域名校验文件")).toBeTruthy();
    expect(screen.getByDisplayValue("https://api.example.com")).toBeTruthy();
    // One dynamic add button per domain category (5 server-domain lists).
    expect(screen.getAllByText("添加域名").length).toBeGreaterThan(0);
    expect(screen.getByText(/MP_verify_api\.txt/)).toBeTruthy();
    expect(screen.getByDisplayValue("https://app.example.com/auth/oauth/callback")).toBeTruthy();

    // Status tab: read-only connection/verification/enabled badges.
    fireEvent.mouseDown(screen.getByRole("tab", { name: "状态信息" }));
    // The same labels also appear in the account list columns.
    expect(screen.getAllByText("未接通").length).toBeGreaterThan(0);
    expect(screen.getAllByText("已启用").length).toBeGreaterThan(0);
    expect(screen.getByText("保存配置")).toBeTruthy();

    // Saving with untouched credentials never re-submits the secret — the
    // prefilled value would otherwise rotate the AppSecret on every save.
    fireEvent.click(screen.getByText("保存配置"));
    await screen.findByText("账号开发配置已保存。");
    expect(updateAccountCredentials).not.toHaveBeenCalled();
    unmount();
  });

  it("renders official account domain rows with dynamic add inputs", async () => {
    const configuredState = {
      ...EMPTY_STATE,
      resourceAccounts: [{
        id: "iamora-2",
        integrationId: "iamoi-2",
        providerCode: "wechat",
        resourceAccountCode: "oa-wx-test",
        resourceAccountKind: "official_account",
        displayName: "My official account",
        providerAccountId: "wx-test-oa-001",
        providerAccountType: "subscription",
        providerClientSecret: "oa-secret-1",
        enabled: true,
        providerConfigJson: JSON.stringify({
          webDomain: "app.example.com",
          jsSecureDomains: ["js.example.com"],
          businessDomains: ["open.example.com"],
          verifyFiles: [
            { domain: "app.example.com", fileName: "MP_verify_app.txt", content: "wx-app" },
            { domain: "js.example.com", fileName: "MP_verify_js.txt", content: "wx-js" },
          ],
        }),
      }],
    };
    const configuredController = {
      getState: () => configuredState,
      load: () => Promise.resolve(configuredState),
      updateAccountConfig: () => Promise.resolve({}),
      runResourceAccountVerification: () => Promise.resolve({}),
      setResourceAccountEnabled: () => Promise.resolve({}),
      deleteResourceAccount: () => Promise.resolve({}),
      listPageResource: () => Promise.resolve([]),
    } as SdkworkIamOauthAdminController;
    const { unmount } = render(
      <SdkworkI18nProvider locale="zh-CN">
        <SdkworkIamOauthOfficialAccountsPage controller={configuredController} />
      </SdkworkI18nProvider>,
    );
    await screen.findByText("My official account");
    fireEvent.click(screen.getByTitle("操作"));

    // Official accounts keep the server config tab with generate/copy links.
    expect(await screen.findByRole("tab", { name: "服务器配置" })).toBeTruthy();
    // The saved AppID, AppSecret and account type are prefilled in the edit
    // drawer (type echoes the saved subscription value, not the service
    // default).
    expect(screen.getByDisplayValue("wx-test-oa-001")).toBeTruthy();
    expect(screen.getByDisplayValue("oa-secret-1")).toBeTruthy();
    expect(screen.getByRole("option", { name: "订阅号" }).selected).toBe(true);
    fireEvent.mouseDown(screen.getByRole("tab", { name: "服务器配置" }));
    expect(screen.getAllByText("生成令牌").length).toBeGreaterThan(0);
    expect(screen.getAllByText("生成密钥").length).toBeGreaterThan(0);
    // Copy links appear for both secret fields.
    expect(screen.getAllByText("复制").length).toBeGreaterThan(0);
    // Generate fills the token input with a 32-char value.
    fireEvent.click(screen.getAllByText("生成令牌")[0]);
    const tokenInputs = screen.getAllByDisplayValue(/^[A-Za-z0-9]{32}$/u);
    expect(tokenInputs.length).toBeGreaterThan(0);
    fireEvent.mouseDown(screen.getByRole("tab", { name: "开发配置" }));

    // Official account domains: JS SDK secure + business domains, dynamic rows.
    fireEvent.mouseDown(screen.getByRole("tab", { name: "开发配置" }));
    expect(screen.getByText("域名配置")).toBeTruthy();
    // The label also appears as the kind badge on the verification file rows.
    expect(screen.getAllByText("JS 接口安全域名").length).toBeGreaterThan(0);
    expect(screen.getAllByText("业务域名").length).toBeGreaterThan(0);
    expect(screen.getByDisplayValue("js.example.com")).toBeTruthy();
    expect(screen.getByDisplayValue("open.example.com")).toBeTruthy();
    expect(screen.getAllByText("添加域名").length).toBe(2);
    // Per-domain verification rows cover the official domains.
    expect(screen.getByText(/MP_verify_js\.txt/)).toBeTruthy();
    unmount();
  });

  it("renders the add drawer with the same tabs as the edit drawer (mini: three tabs)", async () => {
    const { unmount } = render(
      <SdkworkI18nProvider locale="zh-CN">
        <SdkworkIamOauthMiniProgramAccountsPage controller={controller} />
      </SdkworkI18nProvider>,
    );
    await screen.findByText("添加小程序账号");
    fireEvent.click(screen.getAllByText("添加小程序账号")[0]);

    expect(await screen.findByRole("tab", { name: "基础信息" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "开发配置" })).toBeTruthy();
    expect(screen.queryByRole("tab", { name: "服务器配置" })).toBeNull();
    expect(screen.getByRole("tab", { name: "状态信息" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "个人主体" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "企业主体" })).toBeTruthy();
    expect(screen.getByPlaceholderText("gh_xxxxxxxx")).toBeTruthy();

    fireEvent.mouseDown(screen.getByRole("tab", { name: "开发配置" }));
    expect(screen.getAllByText("登录回调地址").length).toBeGreaterThan(0);
    expect(screen.getByText("自定义域名")).toBeTruthy();
    expect(screen.getAllByText("添加域名").length).toBeGreaterThan(0);

    // Status is not available before the account exists.
    fireEvent.mouseDown(screen.getByRole("tab", { name: "状态信息" }));
    expect(screen.getByText("创建并保存后展示账号状态。")).toBeTruthy();
    unmount();
  });

  it("creates a mini program account without a callback URL (optional field)", async () => {
    const { unmount } = render(
      <SdkworkI18nProvider locale="zh-CN">
        <SdkworkIamOauthMiniProgramAccountsPage controller={controller} />
      </SdkworkI18nProvider>,
    );
    await screen.findByText("添加小程序账号");
    fireEvent.click(screen.getAllByText("添加小程序账号")[0]);
    await screen.findByRole("tab", { name: "基础信息" });

    const fill = (placeholder: string, value: string) => {
      fireEvent.change(screen.getByPlaceholderText(placeholder), { target: { value } });
    };
    fill("我的小程序", "My mini program");
    fill("wx1234567890abcdef", "wx-mini-001");
    fill("输入小程序 AppSecret", "secret-001");

    // The callback URL is optional for mini programs.
    fireEvent.mouseDown(screen.getByRole("tab", { name: "开发配置" }));
    expect(screen.getByText("小程序登录通过 jscode2session 换取会话，不经过 OAuth 回调；回调地址为可选项，仅按需填写。")).toBeTruthy();

    // Confirm becomes enabled without any callback URL configured.
    const footer = document.querySelector('[data-sdk-ui="drawer-footer"]');
    const confirmButton = footer?.querySelector("button:last-child") as HTMLButtonElement | null;
    expect(confirmButton).toBeTruthy();
    expect(confirmButton?.disabled).toBe(false);
    unmount();
  });
});
