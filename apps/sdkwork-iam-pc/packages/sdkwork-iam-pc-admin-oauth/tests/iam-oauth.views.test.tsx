import { renderToStaticMarkup } from "react-dom/server";
import { SdkworkI18nProvider } from "@sdkwork/i18n-pc-react";
import { describe, expect, it } from "vitest";

import { SdkworkIamOauthAdminSettings } from "../src/pages/OauthAdminSettings";
import type {
  SdkworkIamOauthAdminController,
  SdkworkIamOauthAdminState,
  SdkworkIamOauthAdminView,
} from "../src/types/oauth-admin-types";

const EMPTY_STATE: SdkworkIamOauthAdminState = {
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
  providerCatalog: [],
  resourceAccounts: [],
  resourceAuthorizations: [],
  scopeProfiles: [],
  secrets: [],
  status: "ready",
  surfaces: [],
  tenantBindings: [],
  webhookConfigs: [],
};

const controller = {
  getState: () => EMPTY_STATE,
} as SdkworkIamOauthAdminController;

function renderView(view: SdkworkIamOauthAdminView): string {
  return renderToStaticMarkup(
    <SdkworkI18nProvider locale="zh-CN">
      <SdkworkIamOauthAdminSettings
        controller={controller}
        view={view}
      />
    </SdkworkI18nProvider>,
  );
}

describe("SDKWork IAM OAuth focused admin views", () => {
  it("separates provider, application, and login configuration workflows", () => {
    const providers = renderView("providers");
    expect(providers).toContain("提供方目录");
    expect(providers).toContain("添加提供方连接");
    expect(providers).not.toContain("OAuth 客户端");

    const applications = renderView("applications");
    expect(applications).toContain("SDKWork OAuth 依赖方");
    expect(applications).toContain("OAuth 客户端");
    expect(applications).toContain("OAuth 密钥");
    expect(applications).toContain("只写输入");
    expect(applications).not.toContain("提供方目录");

    const loginConfiguration = renderView("login-configuration");
    for (const title of ["作用域配置", "声明映射", "流程配置", "OAuth 载体"]) {
      expect(loginConfiguration).toContain(title);
    }
    expect(loginConfiguration).not.toContain("OAuth 密钥");
    expect(loginConfiguration).not.toContain("Webhook 配置");
  });

  it("separates governance, authorization, resources, and operations", () => {
    const governance = renderView("governance");
    expect(governance).toContain("OAuth 策略");
    expect(governance).toContain("租户绑定");
    expect(governance).not.toContain("运营平台");

    const authorizations = renderView("authorizations");
    expect(authorizations).toContain("OAuth 账号关联");
    expect(authorizations).toContain("OAuth 授权");
    expect(authorizations).not.toContain("租户绑定");

    const resources = renderView("resources");
    expect(resources).toContain("运营平台");
    expect(resources).toContain("OAuth 资源账号");
    expect(resources).toContain("OAuth 运营资源");
    expect(resources).not.toContain("OAuth 策略");

    const activity = renderView("activity");
    expect(activity).toContain("Webhook 配置");
    expect(activity).toContain("诊断任务");
    expect(activity).toContain("OAuth 回调事件");
    expect(activity).not.toContain("OAuth 授权");
  });
});
