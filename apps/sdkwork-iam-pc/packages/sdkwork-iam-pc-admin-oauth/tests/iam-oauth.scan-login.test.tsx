import { fireEvent, render, screen } from "@testing-library/react";
import { SdkworkI18nProvider } from "@sdkwork/i18n-pc-react";
import { describe, expect, it, vi } from "vitest";

import type {
  SdkworkIamOauthAdminController,
  SdkworkIamOauthScanLoginSettings,
} from "../src/types/oauth-admin-types";
import {
  OauthOfficialAccountScanLoginSection,
  OauthUrlScanLoginSection,
} from "../src/components/oauth-scan-login-sections";
import { SdkworkIamOauthScanLoginSettingsPage } from "../src/pages/OauthScanLoginSettingsPage";

const SETTINGS: SdkworkIamOauthScanLoginSettings = {
  defaultQrMode: "auto",
  modes: [],
  officialAccounts: [],
  urlLogin: {
    enabled: true,
    h5LoginOrigin: "https://m.example.com",
  },
};

describe("SDKWork IAM OAuth scan login sections", () => {
  it("edits the H5 origin as protocol + domain and assembles the login URL", async () => {
    const updateScanLoginSettings = vi.fn().mockResolvedValue(SETTINGS);
    const controller = {
      updateScanLoginSettings,
      generateScanLoginPreview: vi.fn().mockResolvedValue({ qrContent: "url", qrMode: "url" }),
    } as unknown as SdkworkIamOauthAdminController;
    const onChanged = vi.fn();
    const onNotice = vi.fn();
    const { unmount } = render(
      <SdkworkI18nProvider locale="zh-CN">
        <OauthUrlScanLoginSection
          busy={false}
          controller={controller}
          onChanged={onChanged}
          onError={() => undefined}
          onNotice={onNotice}
          onPreview={() => undefined}
          settings={SETTINGS}
        />
      </SdkworkI18nProvider>,
    );

    // The stored origin is split back into protocol + domain.
    const protocol = screen.getByLabelText("协议") as HTMLSelectElement;
    expect(protocol.value).toBe("https");
    expect((screen.getByLabelText("登录域名") as HTMLInputElement).value).toBe("m.example.com");
    // The assembled login URL preview is rendered with a copy action.
    expect(screen.getByText("拼接后的登录 URL")).toBeTruthy();
    expect(screen.getByText(/https:\/\/m\.example\.com\/auth\/login\?session_key=/u)).toBeTruthy();
    expect(screen.getByRole("button", { name: "复制" })).toBeTruthy();

    // Switch to http + a new domain and save: the backend receives the origin.
    fireEvent.change(protocol, { target: { value: "http" } });
    fireEvent.change(screen.getByLabelText("登录域名"), { target: { value: "h5.example.org" } });
    fireEvent.click(screen.getByText("保存 URL 配置"));
    await vi.waitFor(() => {
      expect(updateScanLoginSettings).toHaveBeenCalledWith({
        urlLogin: { enabled: true, h5LoginOrigin: "http://h5.example.org" },
      });
    });
    expect(onNotice).toHaveBeenCalledWith("已保存");
    unmount();
  });

  it("lists service accounts as mutually exclusive radios and offers an add action", () => {
    const setResourceAccountQrLogin = vi.fn().mockResolvedValue({});
    const controller = {
      setResourceAccountQrLogin,
      generateScanLoginPreview: vi.fn().mockResolvedValue({ qrContent: "qr", qrMode: "official_account" }),
    } as unknown as SdkworkIamOauthAdminController;
    const { unmount } = render(
      <SdkworkI18nProvider locale="zh-CN">
        <OauthOfficialAccountScanLoginSection
          accounts={[
            {
              accountId: "iamora-1",
              appId: "wx-oa-1",
              displayName: "Service A",
              enabled: true,
              integrationId: "iamoi-1",
              qrLoginEnabled: true,
              verificationStatus: "pending",
              webhook: { enabled: true },
            },
            {
              accountId: "iamora-2",
              appId: "wx-oa-2",
              displayName: "Service B",
              enabled: true,
              integrationId: "iamoi-2",
              qrLoginEnabled: false,
              verificationStatus: "pending",
              webhook: { enabled: false },
            },
          ]}
          busy={false}
          controller={controller}
          onChanged={() => undefined}
          onError={() => undefined}
          onPreview={() => undefined}
        />
      </SdkworkI18nProvider>,
    );

    // Exactly one radio is checked; switching to the other account calls the
    // controller so the backend clears the previous account's flag. The
    // active account carries the "current active" badge and a stop action.
    const radios = screen.getAllByRole("radio") as HTMLInputElement[];
    expect(radios).toHaveLength(2);
    expect(radios[0].checked).toBe(true);
    expect(radios[1].checked).toBe(false);
    expect(screen.getAllByText("当前生效")).toHaveLength(1);
    expect(screen.getByText("停用扫码登录")).toBeTruthy();
    fireEvent.click(radios[1]);
    expect(setResourceAccountQrLogin).toHaveBeenCalledWith("iamora-2", true);

    // Clicking the already-active radio disables scan login for that account
    // (radios cannot be unchecked natively).
    fireEvent.click(radios[0]);
    expect(setResourceAccountQrLogin).toHaveBeenCalledWith("iamora-1", false);

    // The explicit stop button also disables the active account.
    fireEvent.click(screen.getByText("停用扫码登录"));
    expect(setResourceAccountQrLogin).toHaveBeenLastCalledWith("iamora-1", false);
    expect(screen.getByText("同一时刻仅一个服务号可用于扫码登录；启用一个服务号后，其他服务号将自动关闭。")).toBeTruthy();
    unmount();
  });

  it("shows an add action when no service account exists", () => {
    const controller = {
      setResourceAccountQrLogin: vi.fn(),
      generateScanLoginPreview: vi.fn(),
    } as unknown as SdkworkIamOauthAdminController;
    const { unmount } = render(
      <SdkworkI18nProvider locale="zh-CN">
        <OauthOfficialAccountScanLoginSection
          accounts={[]}
          busy={false}
          controller={controller}
          onChanged={() => undefined}
          onError={() => undefined}
          onPreview={() => undefined}
        />
      </SdkworkI18nProvider>,
    );
    expect(screen.getByText("暂无已配置的服务号账号")).toBeTruthy();
    const addButton = screen.getByText("添加服务号");
    expect(addButton).toBeTruthy();
    unmount();
  });

  it("selects scan login modes with radios and adds service accounts in a drawer", async () => {
    const settings: SdkworkIamOauthScanLoginSettings = {
      defaultQrMode: "auto",
      modes: [{ enabled: true, mode: "official_account", qrMode: "official_account", sortOrder: 10 }],
      officialAccounts: [],
      urlLogin: { enabled: true, h5LoginOrigin: "" },
    };
    const updateScanLoginSettings = vi.fn().mockResolvedValue(settings);
    const createAccountSetup = vi.fn().mockResolvedValue({});
    const controller = {
      loadScanLoginSettings: vi.fn().mockResolvedValue(settings),
      load: vi.fn().mockResolvedValue({ providerCatalog: [] }),
      updateScanLoginSettings,
      createAccountSetup,
      setResourceAccountQrLogin: vi.fn().mockResolvedValue({}),
      generateScanLoginPreview: vi.fn().mockResolvedValue({ qrContent: "url", qrMode: "url" }),
    } as unknown as SdkworkIamOauthAdminController;
    const { unmount } = render(
      <SdkworkI18nProvider locale="zh-CN">
        <SdkworkIamOauthScanLoginSettingsPage controller={controller} />
      </SdkworkI18nProvider>,
    );

    // Three mode radios are rendered (official account / H5 / provider); the
    // official-account mode is active from the backend modes.
    const modeRadios = await screen.findAllByRole("radio") as HTMLInputElement[];
    expect(modeRadios.length).toBe(3);
    expect(modeRadios.filter((radio) => radio.checked)).toHaveLength(1);
    expect(screen.getByText("当前生效")).toBeTruthy();

    // Selecting the H5 mode saves it as the only enabled mode and renders the
    // H5 form (protocol + domain on one row).
    const urlRadio = modeRadios.find((radio) =>
      radio.closest("label")?.textContent?.includes("H5 扫码"));
    expect(urlRadio).toBeTruthy();
    fireEvent.click(urlRadio!);
    await vi.waitFor(() => {
      expect(updateScanLoginSettings).toHaveBeenCalledWith({
        modes: [{ enabled: true, mode: "url", qrMode: "url", sortOrder: 10 }],
      });
    });
    expect(screen.getByLabelText("协议")).toBeTruthy();
    expect(screen.getByLabelText("登录域名")).toBeTruthy();

    // Back to the official-account mode: the empty state opens an add drawer
    // right on this page; saving creates the service account and refreshes.
    fireEvent.click(screen.getAllByRole("radio")[0]);
    const addButton = await screen.findByText("添加服务号");
    fireEvent.click(addButton);
    fireEvent.change(screen.getByPlaceholderText("我的公众号"), { target: { value: "My service" } });
    fireEvent.change(screen.getByPlaceholderText("wx1234567890abcdef"), { target: { value: "wx-oa-001" } });
    fireEvent.change(screen.getByPlaceholderText("输入公众号 AppSecret"), { target: { value: "secret-1" } });
    const drawerFooter = document.querySelector('[data-sdk-ui="drawer-footer"]');
    const confirmButton = drawerFooter?.querySelector("button:last-child") as HTMLButtonElement | null;
    expect(confirmButton?.disabled).toBe(false);
    fireEvent.click(confirmButton!);
    await vi.waitFor(() => {
      expect(createAccountSetup).toHaveBeenCalledWith(
        "official_account",
        expect.objectContaining({
          accountType: "service",
          appId: "wx-oa-001",
          displayName: "My service",
        }),
      );
    });
    unmount();
  });
});
