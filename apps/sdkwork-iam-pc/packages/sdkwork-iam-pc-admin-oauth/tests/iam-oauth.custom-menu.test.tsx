import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SdkworkI18nProvider } from "@sdkwork/i18n-pc-react";

import { createSdkworkIamOauthAdminController } from "../src/services/oauth-admin-controller";
import { createOauthServiceMock } from "./fixtures/oauth-service-mock";
import {
  SdkworkIamOauthOfficialAccountCustomMenuPage,
  SdkworkIamOauthOfficialAccountsPage,
} from "../src";
import {
  CUSTOM_MENU_MAX_SUB_BUTTONS,
  clampCustomMenuName,
  createCustomMenuKey,
  menuNameUnitLength,
  validateCustomMenuDraft,
  validateCustomMenuName,
  validateMenuButtonAction,
} from "../src/components/custom-menu/custom-menu-validators";
import { CUSTOM_MENU_DEVICE_PRESETS } from "../src/components/custom-menu/custom-menu-device-presets";
import type {
  SdkworkIamOauthCustomMenuButton,
  SdkworkIamOauthCustomMenuDraft,
} from "../src/types/oauth-admin-types";

function accountWithMenu(menu: SdkworkIamOauthCustomMenuDraft): Record<string, unknown> {
  return {
    id: "iamora-menu-1",
    displayName: "My official account",
    providerAccountType: "service",
    resourceAccountKind: "official_account",
    provider_config_json: JSON.stringify({
      logoUrl: "https://example.com/logo.png",
      customMenu: menu,
    }),
  };
}

function serviceWithAccount(service: ReturnType<typeof createOauthServiceMock>, account: unknown) {
  (service.iam.oauth.resourceAccounts.list as ReturnType<typeof vi.fn>)
    .mockResolvedValue({ items: [account] });
  const accountRecord = account as Record<string, unknown>;
  const config = typeof accountRecord.provider_config_json === "string"
    ? JSON.parse(accountRecord.provider_config_json) as Record<string, unknown>
    : {};
  const initialMenu = (config.customMenu as SdkworkIamOauthCustomMenuDraft | undefined) ?? { buttons: [] };
  const retrieve = service.iam.oauth.resourceAccounts.customMenus.retrieve as ReturnType<typeof vi.fn>;
  const update = service.iam.oauth.resourceAccounts.customMenus.update as ReturnType<typeof vi.fn>;
  retrieve.mockImplementation(() => {
    const latestBody = update.mock.calls.at(-1)?.[1] as SdkworkIamOauthCustomMenuDraft | undefined;
    return Promise.resolve({
      displayName: typeof accountRecord.displayName === "string" ? accountRecord.displayName : "My official account",
      logoUrl: typeof config.logoUrl === "string" ? config.logoUrl : undefined,
      menu: latestBody ?? initialMenu,
      source: latestBody ? "database" : initialMenu.buttons.length > 0 ? "database" : "empty",
    });
  });
  return service;
}

function enableCustomMenuApi(service: ReturnType<typeof createOauthServiceMock>) {
  const retrieve = vi.fn();
  const update = vi.fn();
  Object.assign(service.iam.oauth.resourceAccounts.customMenus, { retrieve, update });
  return {
    publish: service.iam.oauth.resourceAccounts.customMenus.publish,
    retrieve,
    update,
  };
}

function customMenuUpdate(service: ReturnType<typeof createOauthServiceMock>) {
  return service.iam.oauth.resourceAccounts.customMenus.update as ReturnType<typeof vi.fn>;
}

function renderMenuPage(controller: Parameters<typeof createSdkworkIamOauthAdminController>[0]) {
  return render(
    <SdkworkI18nProvider locale="zh-CN">
      <SdkworkIamOauthOfficialAccountCustomMenuPage
        controller={createSdkworkIamOauthAdminController(controller as never)}
        resourceAccountId="iamora-menu-1"
      />
    </SdkworkI18nProvider>,
  );
}

function confirmMenuPublish(): void {
  fireEvent.click(
    within(screen.getByTestId("custom-menu-publish-confirmation"))
      .getByRole("button", { name: "确认发布" }),
  );
}

describe("custom menu validators", () => {
  it("defines stable logical viewports for every supported iPhone simulator", () => {
    expect(CUSTOM_MENU_DEVICE_PRESETS).toEqual([
      { id: "iphone-16", label: "iPhone 16", width: 393, height: 852 },
      { id: "iphone-16-pro-max", label: "iPhone 16 Pro Max", width: 440, height: 956 },
      { id: "iphone-17-pro", label: "iPhone 17 Pro", width: 402, height: 874 },
    ]);
    expect(new Set(CUSTOM_MENU_DEVICE_PRESETS.map((device) => device.id)).size).toBe(CUSTOM_MENU_DEVICE_PRESETS.length);
  });

  it("measures names in WeChat display units (non-ASCII counts as two)", () => {
    expect(menuNameUnitLength("菜单")).toBe(4);
    expect(menuNameUnitLength("menu")).toBe(4);
    expect(menuNameUnitLength("菜单a")).toBe(5);
    expect(menuNameUnitLength("メニュー")).toBe(8);
    expect(menuNameUnitLength("菜单✓")).toBe(6);
    expect(clampCustomMenuName("菜单名称一", 8)).toBe("菜单名称");
    expect(clampCustomMenuName("abcdefghijk", 8)).toBe("abcdefgh");
  });

  it("limits top-level names to 4 CJK chars and sub-menu names to 7", () => {
    expect(validateCustomMenuName("菜单名称", "top")).toBeUndefined();
    expect(validateCustomMenuName("菜单名称一", "top")).toBe("nameTooLongTop");
    expect(validateCustomMenuName("二级菜单名称一", "sub")).toBeUndefined();
    expect(validateCustomMenuName("二级菜单名称一二", "sub")).toBe("nameTooLongSub");
    expect(validateCustomMenuName("", "top")).toBe("nameRequired");
  });

  it("requires an action and its fields on leaf buttons", () => {
    const empty: SdkworkIamOauthCustomMenuButton = { key: "k1", name: "菜单" };
    expect(validateMenuButtonAction(empty)).toBe("actionRequired");
    expect(validateMenuButtonAction({ ...empty, type: "click" })).toBe("messageRequired");
    expect(validateMenuButtonAction({ ...empty, type: "click", message: "中".repeat(43) })).toBe("messageTooLong");
    expect(validateMenuButtonAction({ ...empty, type: "click", message: "A".repeat(128) })).toBeUndefined();
    expect(validateMenuButtonAction({
      ...empty,
      unsupportedType: "media_id",
      providerAction: { type: "media_id", media_id: "MEDIA_123" },
    })).toBe("unsupportedAction");
    expect(validateMenuButtonAction({ ...empty, type: "view" })).toBe("urlRequired");
    expect(validateMenuButtonAction({ ...empty, type: "view", url: "example.com" })).toBe("urlInvalid");
    expect(validateMenuButtonAction({ ...empty, type: "view", url: "https://" })).toBe("urlInvalid");
    expect(validateMenuButtonAction({ ...empty, type: "view", url: "https://example.com" })).toBeUndefined();
    expect(validateMenuButtonAction({
      ...empty,
      type: "view",
      url: `https://example.com/${"a".repeat(1005)}`,
    })).toBe("urlTooLong");
    expect(validateMenuButtonAction({ ...empty, type: "miniprogram" })).toBe("appIdRequired");
    expect(validateMenuButtonAction({ ...empty, type: "miniprogram", appId: "wx123" })).toBe("pagePathRequired");
    expect(validateMenuButtonAction({ ...empty, type: "miniprogram", appId: "wx123", pagePath: "pages/index/index" })).toBe("urlRequired");
    expect(
      validateMenuButtonAction({
        ...empty,
        type: "miniprogram",
        appId: "wx123",
        pagePath: "pages/index/index",
        url: "https://example.com/fallback",
      }),
    ).toBeUndefined();
  });

  it("validates the full draft tree", () => {
    expect(validateCustomMenuDraft({ buttons: [] })).toEqual([{ path: "", kind: "atLeastOneTop" }]);

    const fourTops: SdkworkIamOauthCustomMenuButton[] = Array.from({ length: 4 }, (_, index) => ({
      key: `k${index}`,
      name: `菜单${index}`,
      type: "click",
      message: "hi",
    }));
    expect(validateCustomMenuDraft({ buttons: fourTops })).toContainEqual({ path: "", kind: "tooManyTop" });

    const parentWithSubs: SdkworkIamOauthCustomMenuButton = {
      key: "p",
      name: "菜单",
      subButtons: Array.from({ length: CUSTOM_MENU_MAX_SUB_BUTTONS + 1 }, (_, index) => ({
        key: `s${index}`,
        name: `子菜单${index}`,
        type: "click",
        message: "hi",
      })),
    };
    const issues = validateCustomMenuDraft({ buttons: [parentWithSubs] });
    expect(issues).toContainEqual({ path: "0", kind: "tooManySub" });
    // A parent with sub-menus is display-only; it never needs an action itself.
    expect(issues.some((issue) => issue.kind === "actionRequired")).toBe(false);

    expect(validateCustomMenuDraft({
      buttons: [{ key: "empty-parent", name: "", subButtons: [{ key: "child", name: "子菜单", type: "click", message: "hi" }] }],
    })).toContainEqual({ path: "0", kind: "nameRequired" });

    expect(validateCustomMenuDraft({
      buttons: [{
        key: "parent",
        name: "菜单",
        subButtons: [{
          key: "child",
          name: "子菜单",
          subButtons: [{ key: "third-level", name: "三级", type: "click", message: "hi" }],
        }],
      }],
    })).toContainEqual({ path: "0.0", kind: "nestedSubMenuNotAllowed" });
  });

  it("generates unique button keys", () => {
    expect(createCustomMenuKey()).not.toBe(createCustomMenuKey());
  });
});

describe("custom menu controller", () => {
  it("loads the backend canonical menu without falling back to the account list", async () => {
    const service = createOauthServiceMock();
    const customMenus = enableCustomMenuApi(service);
    customMenus.retrieve.mockResolvedValue({
      displayName: "Synced official account",
      logoUrl: "https://example.com/synced-logo.png",
      menu: {
        buttons: [{ name: "微信菜单", type: "view", url: "https://example.com/wechat" }],
      },
      source: "wechat",
    });
    const controller = createSdkworkIamOauthAdminController(service as never);

    const context = await controller.loadAccountCustomMenu(" iamora-menu-1 ");

    expect(customMenus.retrieve).toHaveBeenCalledWith("iamora-menu-1");
    expect(service.iam.oauth.resourceAccounts.list).not.toHaveBeenCalled();
    expect(context).toMatchObject({
      displayName: "Synced official account",
      logoUrl: "https://example.com/synced-logo.png",
      source: "wechat",
      draft: {
        buttons: [{
          key: "imported-menu-0",
          name: "微信菜单",
          type: "view",
          url: "https://example.com/wechat",
        }],
      },
    });
  });

  it("saves through the custom-menu SDK resource and reads back the canonical draft", async () => {
    const service = createOauthServiceMock();
    const customMenus = enableCustomMenuApi(service);
    customMenus.update.mockResolvedValue({});
    customMenus.retrieve.mockResolvedValue({
      displayName: "My official account",
      menu: {
        buttons: [{ key: "server-key", name: "服务端菜单", type: "click", message: "server-event" }],
        updatedAt: "2026-08-13T08:00:00Z",
      },
      source: "database",
    });
    const controller = createSdkworkIamOauthAdminController(service as never);

    const context = await controller.saveAccountCustomMenu("iamora-menu-1", {
      buttons: [{ key: "local-key", name: " 本地菜单 ", type: "click", message: " local-event " }],
    });

    expect(customMenus.update).toHaveBeenCalledWith("iamora-menu-1", {
      buttons: [{ key: "local-key", name: "本地菜单", type: "click", message: " local-event " }],
    });
    expect(customMenus.retrieve).toHaveBeenCalledTimes(1);
    expect(customMenus.update.mock.invocationCallOrder[0]).toBeLessThan(customMenus.retrieve.mock.invocationCallOrder[0]);
    expect(service.iam.oauth.resourceAccounts.list).not.toHaveBeenCalled();
    expect(service.iam.oauth.resourceAccounts.update).not.toHaveBeenCalled();
    expect(context.draft).toMatchObject({
      buttons: [{ key: "server-key", name: "服务端菜单" }],
      updatedAt: "2026-08-13T08:00:00Z",
    });
  });

  it("propagates custom-menu retrieval failures instead of showing a stale fallback", async () => {
    const service = createOauthServiceMock();
    const customMenus = enableCustomMenuApi(service);
    customMenus.retrieve.mockRejectedValue(new Error("WeChat menu synchronization failed"));
    const controller = createSdkworkIamOauthAdminController(service as never);

    await expect(controller.loadAccountCustomMenu("iamora-menu-1"))
      .rejects.toThrow("WeChat menu synchronization failed");
    expect(service.iam.oauth.resourceAccounts.list).not.toHaveBeenCalled();
    expect(controller.getState()).toMatchObject({
      lastError: "WeChat menu synchronization failed",
      status: "error",
    });
  });

  it("loads the draft and account context from the account config", async () => {
    const service = serviceWithAccount(createOauthServiceMock(), accountWithMenu({
      buttons: [{ key: "k1", name: "菜单一", type: "view", url: "https://example.com/page" }],
    }));
    const controller = createSdkworkIamOauthAdminController(service as never);

    const context = await controller.loadAccountCustomMenu("iamora-menu-1");

    expect(context.displayName).toBe("My official account");
    expect(context.logoUrl).toBe("https://example.com/logo.png");
    expect(context.draft.buttons).toHaveLength(1);
    expect(context.draft.buttons[0]).toMatchObject({ key: "k1", name: "菜单一", type: "view" });
  });

  it("imports external menu documents that do not contain UI keys", async () => {
    const service = serviceWithAccount(createOauthServiceMock(), accountWithMenu({
      buttons: [{
        name: "菜单一",
        subButtons: [{ name: "网页", type: "view", url: "https://example.com" }],
      } as SdkworkIamOauthCustomMenuButton],
    }));
    const controller = createSdkworkIamOauthAdminController(service as never);

    const context = await controller.loadAccountCustomMenu("iamora-menu-1");

    expect(context.draft.buttons[0]).toMatchObject({
      key: "imported-menu-0",
      name: "菜单一",
      subButtons: [{ key: "imported-menu-0-0", name: "网页", type: "view" }],
    });
  });

  it("preserves unsupported WeChat actions until the operator explicitly converts them", async () => {
    const service = createOauthServiceMock();
    const customMenus = enableCustomMenuApi(service);
    customMenus.retrieve.mockResolvedValue({
      displayName: "My official account",
      menu: {
        buttons: [{
          key: "wechat-media",
          name: "图文",
          unsupportedType: "media_id",
          providerAction: { name: "图文", type: "media_id", media_id: "MEDIA_123" },
        }],
      },
      source: "wechat",
    });
    customMenus.update.mockResolvedValue({});
    const controller = createSdkworkIamOauthAdminController(service as never);

    const loaded = await controller.loadAccountCustomMenu("iamora-menu-1");
    expect(loaded.draft.buttons[0]).toMatchObject({
      unsupportedType: "media_id",
      providerAction: { media_id: "MEDIA_123" },
    });
    await controller.saveAccountCustomMenu("iamora-menu-1", loaded.draft);
    expect(customMenus.update).toHaveBeenCalledWith("iamora-menu-1", {
      buttons: [{
        key: "wechat-media",
        name: "图文",
        unsupportedType: "media_id",
        providerAction: { name: "图文", type: "media_id", media_id: "MEDIA_123" },
      }],
    });
  });

  it("returns an empty draft when the account has no menu config", async () => {
    const service = serviceWithAccount(createOauthServiceMock(), {
      id: "iamora-menu-1",
      displayName: "My official account",
      provider_config_json: "{}",
    });
    const controller = createSdkworkIamOauthAdminController(service as never);

    const context = await controller.loadAccountCustomMenu("iamora-menu-1");

    expect(context.draft).toEqual({ buttons: [] });
  });

  it("saves the draft only through the dedicated custom-menu resource", async () => {
    const service = serviceWithAccount(createOauthServiceMock(), accountWithMenu({
      buttons: [{ key: "k1", name: "旧菜单", type: "click", message: "hi" }],
    }));
    const controller = createSdkworkIamOauthAdminController(service as never);

    const draft: SdkworkIamOauthCustomMenuDraft = {
      buttons: [{ key: "k1", name: "新菜单", type: "view", url: "https://example.com" }],
    };
    await controller.saveAccountCustomMenu("iamora-menu-1", draft);

    expect(customMenuUpdate(service)).toHaveBeenCalledWith("iamora-menu-1", {
      buttons: draft.buttons,
    });
    expect(service.iam.oauth.resourceAccounts.update).not.toHaveBeenCalled();
    expect(service.iam.oauth.resourceAccounts.list).not.toHaveBeenCalled();
  });

  it("normalizes parent and leaf action fields before saving", async () => {
    const service = serviceWithAccount(createOauthServiceMock(), accountWithMenu({ buttons: [] }));
    const controller = createSdkworkIamOauthAdminController(service as never);

    await controller.saveAccountCustomMenu("iamora-menu-1", {
      buttons: [
        {
          key: "parent",
          name: " 菜单 ",
          type: "view",
          url: "https://stale.example.com",
          subButtons: [{
            key: "child",
            name: " 网页 ",
            type: "view",
            url: " https://example.com/page ",
            message: "stale message",
          }],
        },
      ],
    });

    const calls = customMenuUpdate(service).mock.calls;
    const body = calls.at(-1)![1] as SdkworkIamOauthCustomMenuDraft;
    const parent = body.buttons[0];
    expect(parent).toEqual({
      key: "parent",
      name: "菜单",
      subButtons: [{ key: "child", name: "网页", type: "view", url: "https://example.com/page" }],
    });
  });

  it("publishes through the backend custom menu capability when available", async () => {
    const service = createOauthServiceMock();
    const customMenus = enableCustomMenuApi(service);
    customMenus.update.mockResolvedValue({});
    customMenus.publish.mockResolvedValue({ published: true });
    customMenus.retrieve
      .mockResolvedValueOnce({
        displayName: "My official account",
        menu: { buttons: [{ key: "k1", name: "菜单", type: "view", url: "https://example.com" }] },
        source: "database",
      })
      .mockResolvedValueOnce({
        displayName: "My official account",
        menu: {
          buttons: [{ key: "k1", name: "菜单", type: "view", url: "https://example.com" }],
          updatedAt: "2026-08-13T09:00:00Z",
        },
        source: "wechat",
      });
    const controller = createSdkworkIamOauthAdminController(service as never);

    const draft: SdkworkIamOauthCustomMenuDraft = {
      buttons: [{ key: "k1", name: "菜单", type: "view", url: "https://example.com" }],
    };
    const result = await controller.publishAccountCustomMenu("iamora-menu-1", draft);

    expect(result).toMatchObject({
      context: { source: "wechat", draft: { updatedAt: "2026-08-13T09:00:00Z" } },
      saved: true,
      published: true,
    });
    expect(customMenus.publish).toHaveBeenCalledWith(
      "iamora-menu-1",
      { buttons: draft.buttons },
    );
    expect(customMenus.update).toHaveBeenCalledTimes(1);
    expect(customMenus.retrieve).toHaveBeenCalledTimes(2);
    expect(customMenus.update.mock.invocationCallOrder[0]).toBeLessThan(customMenus.retrieve.mock.invocationCallOrder[0]);
    expect(customMenus.retrieve.mock.invocationCallOrder[0]).toBeLessThan(customMenus.publish.mock.invocationCallOrder[0]);
    expect(customMenus.publish.mock.invocationCallOrder[0]).toBeLessThan(customMenus.retrieve.mock.invocationCallOrder[1]);
    expect(service.iam.oauth.resourceAccounts.list).not.toHaveBeenCalled();
  });

  it("degrades gracefully when the backend publish capability is missing", async () => {
    const service = createOauthServiceMock();
    (service.iam.oauth.resourceAccounts.customMenus.publish as ReturnType<typeof vi.fn>)
      .mockRejectedValue(new Error("Missing SDKWork IAM SDK resource: iam.oauth.resourceAccounts.customMenus.publish"));
    const controller = createSdkworkIamOauthAdminController(service as never);

    const result = await controller.publishAccountCustomMenu("iamora-menu-1", {
      buttons: [{ key: "k1", name: "菜单", type: "click", message: "hi" }],
    });

    expect(result.saved).toBe(true);
    expect(result.published).toBe(false);
    expect(result.reason).toBe("backend_unavailable");
    // The draft was still persisted before the publish attempt.
    expect(customMenuUpdate(service)).toHaveBeenCalled();
  });

  it("reports real publish failures with the error detail", async () => {
    const service = createOauthServiceMock();
    (service.iam.oauth.resourceAccounts.customMenus.publish as ReturnType<typeof vi.fn>)
      .mockRejectedValue(new Error("WeChat API timeout"));
    const controller = createSdkworkIamOauthAdminController(service as never);

    const result = await controller.publishAccountCustomMenu("iamora-menu-1", {
      buttons: [{ key: "k1", name: "菜单", type: "click", message: "hi" }],
    });

    expect(result.saved).toBe(true);
    expect(result.published).toBe(false);
    expect(result.reason).toBe("publish_failed");
    expect(result.errorMessage).toBe("WeChat API timeout");
  });

  it("reloads the latest database draft after a publish conflict", async () => {
    const service = createOauthServiceMock();
    const customMenus = enableCustomMenuApi(service);
    customMenus.update.mockResolvedValue({});
    customMenus.retrieve
      .mockResolvedValueOnce({
        displayName: "My official account",
        menu: { buttons: [{ key: "old", name: "旧草稿", type: "click", message: "OLD" }] },
        source: "database",
      })
      .mockResolvedValueOnce({
        displayName: "My official account",
        menu: { buttons: [{ key: "new", name: "并发新草稿", type: "click", message: "NEW" }] },
        source: "database",
      });
    customMenus.publish.mockRejectedValue(new Error("newer database draft now exists"));
    const controller = createSdkworkIamOauthAdminController(service as never);

    const result = await controller.publishAccountCustomMenu("iamora-menu-1", {
      buttons: [{ key: "old", name: "旧草稿", type: "click", message: "OLD" }],
    });

    expect(result).toMatchObject({
      context: { draft: { buttons: [{ key: "new", name: "并发新草稿" }] } },
      saved: true,
      published: false,
      reason: "publish_failed",
    });
    expect(customMenus.retrieve).toHaveBeenCalledTimes(2);
  });

  it("rejects invalid menus at the controller publish boundary", async () => {
    const service = createOauthServiceMock();
    const controller = createSdkworkIamOauthAdminController(service as never);

    await expect(controller.publishAccountCustomMenu("iamora-menu-1", {
      buttons: [{
        key: "parent",
        name: "菜单",
        subButtons: [{
          key: "child",
          name: "子菜单",
          subButtons: [{ key: "third", name: "三级", type: "click", message: "hi" }],
        }],
      }],
    })).rejects.toThrow("nestedSubMenuNotAllowed at 0.0");

    expect(service.iam.oauth.resourceAccounts.update).not.toHaveBeenCalled();
    expect(service.iam.oauth.resourceAccounts.customMenus.publish).not.toHaveBeenCalled();
  });
});

describe("custom menu management page", () => {
  it("renders the phone simulator and editor from a saved draft", async () => {
    const service = serviceWithAccount(createOauthServiceMock(), accountWithMenu({
      buttons: [
        { key: "k1", name: "菜单一", type: "view", url: "https://example.com/page" },
        {
          key: "k2",
          name: "菜单二",
          subButtons: [{ key: "s1", name: "子菜单一", type: "click", message: "hi" }],
        },
      ],
    }));
    renderMenuPage(service);

    expect(await screen.findByText("自定义菜单")).toBeTruthy();
    expect(screen.getAllByText("My official account").length).toBeGreaterThan(0);
    const preview = await screen.findByTestId("wechat-menu-preview");
    // Phone simulator renders the top-level menu bar once the draft loads.
    expect(await within(preview).findByRole("button", { name: "菜单一" })).toBeTruthy();
    expect(within(preview).getByRole("button", { name: "菜单二" })).toBeTruthy();

    // Selecting the parent with sub-menus pops its sub-menus and shows the
    // sub-menu list in the editor.
    fireEvent.click(within(preview).getByRole("button", { name: "菜单二" }));
    const subMenu = screen.getByTestId("wechat-sub-menu");
    expect(within(subMenu).getByRole("button", { name: "子菜单一" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "iPhone 15 Pro" })).toBeNull();
  });

  it("adds a top-level menu from the simulator and renames it live", async () => {
    const service = serviceWithAccount(createOauthServiceMock(), accountWithMenu({ buttons: [] }));
    renderMenuPage(service);

    expect(await screen.findByText("点击下方「+」添加一级菜单")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "添加一级菜单" }));

    const nameInput = await screen.findByLabelText("菜单名称");
    fireEvent.change(nameInput, { target: { value: "新菜单名称一" } });
    expect(nameInput).toHaveValue("新菜单名");
    expect(within(screen.getByTestId("wechat-menu-preview")).getByRole("button", { name: "新菜单名" })).toBeTruthy();
  });

  it("requires and persists the mini-program fallback webpage", async () => {
    const service = serviceWithAccount(createOauthServiceMock(), accountWithMenu({
      buttons: [{
        key: "mini",
        name: "小程序",
        type: "miniprogram",
        appId: "wx123",
        pagePath: "pages/index/index",
      }],
    }));
    renderMenuPage(service);

    const fallbackInput = await screen.findByLabelText("备用网页");
    expect(screen.getByText("请输入网页地址")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "保存并发布" }));
    expect(service.iam.oauth.resourceAccounts.customMenus.publish).not.toHaveBeenCalled();

    fireEvent.change(fallbackInput, { target: { value: "https://example.com/fallback" } });
    expect(fallbackInput).toHaveAttribute("aria-invalid", "false");
    fireEvent.click(screen.getByRole("button", { name: "保存并发布" }));
    confirmMenuPublish();

    await waitFor(() => {
      expect(service.iam.oauth.resourceAccounts.customMenus.publish).toHaveBeenCalledWith(
        "iamora-menu-1",
        { buttons: [{
          key: "mini",
          name: "小程序",
          type: "miniprogram",
          appId: "wx123",
          pagePath: "pages/index/index",
          url: "https://example.com/fallback",
        }] },
      );
    });
  });

  it("clears fields that do not belong to the selected action type", async () => {
    const service = serviceWithAccount(createOauthServiceMock(), accountWithMenu({
      buttons: [{ key: "action", name: "菜单一", type: "view", url: "https://example.com/page" }],
    }));
    renderMenuPage(service);

    await screen.findByLabelText("网页地址");
    fireEvent.click(screen.getByRole("radio", { name: "跳转小程序" }));
    expect(screen.getByLabelText("备用网页")).toHaveValue("https://example.com/page");
    fireEvent.change(screen.getByLabelText("小程序 AppID"), { target: { value: "wx123" } });
    fireEvent.change(screen.getByLabelText("小程序页面路径"), { target: { value: "pages/index/index" } });

    fireEvent.click(screen.getByRole("radio", { name: "点击事件" }));
    fireEvent.change(screen.getByLabelText("事件键值"), { target: { value: "hello" } });
    fireEvent.click(screen.getByRole("button", { name: "保存草稿" }));

    await waitFor(() => expect(customMenuUpdate(service)).toHaveBeenCalled());
    const calls = customMenuUpdate(service).mock.calls;
    const body = calls.at(-1)![1] as SdkworkIamOauthCustomMenuDraft;
    expect(body.buttons[0]).toEqual({
      key: "action",
      name: "菜单一",
      type: "click",
      message: "hello",
    });
  });

  it("restores per-action input when switching back but saves only the active action", async () => {
    const service = serviceWithAccount(createOauthServiceMock(), accountWithMenu({
      buttons: [{ key: "action", name: "菜单一", type: "view", url: "https://example.com/page" }],
    }));
    renderMenuPage(service);

    await screen.findByLabelText("网页地址");
    fireEvent.click(screen.getByRole("radio", { name: "跳转小程序" }));
    fireEvent.change(screen.getByLabelText("小程序 AppID"), { target: { value: "wx123" } });
    fireEvent.change(screen.getByLabelText("小程序页面路径"), { target: { value: "pages/home/index" } });
    fireEvent.change(screen.getByLabelText("备用网页"), { target: { value: "https://example.com/fallback" } });

    fireEvent.click(screen.getByRole("radio", { name: "点击事件" }));
    fireEvent.change(screen.getByLabelText("事件键值"), { target: { value: "hello" } });
    fireEvent.click(screen.getByRole("radio", { name: "跳转小程序" }));

    expect(screen.getByLabelText("小程序 AppID")).toHaveValue("wx123");
    expect(screen.getByLabelText("小程序页面路径")).toHaveValue("pages/home/index");
    expect(screen.getByLabelText("备用网页")).toHaveValue("https://example.com/fallback");

    fireEvent.click(screen.getByRole("button", { name: "保存草稿" }));
    await waitFor(() => expect(customMenuUpdate(service)).toHaveBeenCalled());
    const calls = customMenuUpdate(service).mock.calls;
    const body = calls.at(-1)![1] as SdkworkIamOauthCustomMenuDraft;
    expect(body.buttons[0]).toEqual({
      key: "action",
      name: "菜单一",
      type: "miniprogram",
      appId: "wx123",
      pagePath: "pages/home/index",
      url: "https://example.com/fallback",
    });
  });

  it("supports undo and redo while preserving the saved baseline", async () => {
    const service = serviceWithAccount(createOauthServiceMock(), accountWithMenu({
      buttons: [{ key: "action", name: "菜单一", type: "click", message: "hello" }],
    }));
    renderMenuPage(service);

    const nameInput = await screen.findByLabelText("菜单名称");
    expect(screen.getByText("已保存")).toBeTruthy();
    fireEvent.change(nameInput, { target: { value: "新名称" } });
    expect(screen.getByText("有未保存更改")).toBeTruthy();
    expect(screen.getByRole("button", { name: "撤销" })).not.toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "撤销" }));
    expect(nameInput).toHaveValue("菜单一");
    expect(screen.getByText("已保存")).toBeTruthy();
    expect(screen.getByRole("button", { name: "重做" })).not.toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "重做" }));
    expect(nameInput).toHaveValue("新名称");
    expect(screen.getByText("有未保存更改")).toBeTruthy();
  });

  it("supports standard keyboard shortcuts for undo and redo outside editable fields", async () => {
    const service = serviceWithAccount(createOauthServiceMock(), accountWithMenu({
      buttons: [{ key: "action", name: "菜单一", type: "click", message: "hello" }],
    }));
    renderMenuPage(service);

    const nameInput = await screen.findByLabelText("菜单名称");
    const editor = screen.getByTestId("custom-menu-editor");
    fireEvent.change(nameInput, { target: { value: "新名称" } });

    fireEvent.keyDown(editor, { key: "z", ctrlKey: true });
    expect(nameInput).toHaveValue("菜单一");
    expect(screen.getByText("已保存")).toBeTruthy();

    fireEvent.keyDown(editor, { key: "z", ctrlKey: true, shiftKey: true });
    expect(nameInput).toHaveValue("新名称");
    fireEvent.keyDown(editor, { key: "z", ctrlKey: true });
    fireEvent.keyDown(editor, { key: "y", ctrlKey: true });
    expect(nameInput).toHaveValue("新名称");
  });

  it("opens an opaque publish confirmation and cancels without saving or publishing", async () => {
    const service = serviceWithAccount(createOauthServiceMock(), accountWithMenu({
      buttons: [{ key: "menu", name: "菜单一", type: "click", message: "hi" }],
    }));
    renderMenuPage(service);

    await screen.findByLabelText("菜单名称");
    fireEvent.click(screen.getByRole("button", { name: "保存并发布" }));

    const confirmation = screen.getByTestId("custom-menu-publish-confirmation");
    expect(confirmation.className).toContain("!bg-white");
    expect(confirmation.className).toContain("dark:!bg-[#27272a]");
    expect(confirmation.style.opacity).toBe("1");
    expect(screen.getByText("发布后将立即替换当前线上菜单，用户端可能因微信缓存存在短暂延迟。请确认菜单名称、顺序和跳转内容均已检查无误。")).toBeTruthy();
    expect(customMenuUpdate(service)).not.toHaveBeenCalled();
    expect(service.iam.oauth.resourceAccounts.customMenus.publish).not.toHaveBeenCalled();

    fireEvent.click(within(confirmation).getByRole("button", { name: "取消" }));
    expect(screen.queryByTestId("custom-menu-publish-confirmation")).toBeNull();
    expect(customMenuUpdate(service)).not.toHaveBeenCalled();
    expect(service.iam.oauth.resourceAccounts.customMenus.publish).not.toHaveBeenCalled();
  });

  it("uses Escape to close only the publish confirmation", async () => {
    const service = serviceWithAccount(createOauthServiceMock(), accountWithMenu({
      buttons: [{ key: "menu", name: "菜单一", type: "click", message: "hi" }],
    }));
    renderMenuPage(service);

    await screen.findByLabelText("菜单名称");
    fireEvent.click(screen.getByRole("button", { name: "保存并发布" }));
    expect(screen.getByTestId("custom-menu-publish-confirmation")).toBeTruthy();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByTestId("custom-menu-publish-confirmation")).toBeNull();
    expect(screen.getByTestId("custom-menu-editor")).toBeTruthy();
    expect(screen.getByLabelText("菜单名称")).toHaveValue("菜单一");
  });

  it("focuses the exact invalid field when publish validation fails", async () => {
    const service = serviceWithAccount(createOauthServiceMock(), accountWithMenu({
      buttons: [{ key: "action", name: "菜单一", type: "click", message: "" }],
    }));
    renderMenuPage(service);

    await screen.findByLabelText("事件键值");
    fireEvent.click(screen.getByRole("button", { name: "保存并发布" }));

    await waitFor(() => expect(screen.getByLabelText("事件键值")).toHaveFocus());
    expect(screen.getByLabelText("事件键值")).toHaveAttribute("aria-invalid", "true");
  });

  it("blocks publish and shows the first validation issue for an incomplete draft", async () => {
    const service = serviceWithAccount(createOauthServiceMock(), accountWithMenu({
      buttons: [{ key: "k1", name: "菜单一", type: "click", message: "" }],
    }));
    renderMenuPage(service);

    const preview = await screen.findByTestId("wechat-menu-preview");
    fireEvent.click(within(preview).getByRole("button", { name: "菜单一" }));
    expect(await screen.findByText("请输入事件键值")).toBeTruthy();
    fireEvent.click(screen.getByText("保存并发布"));

    expect(await screen.findByText("保存并发布")).toBeTruthy();
    expect(service.iam.oauth.resourceAccounts.customMenus.publish).not.toHaveBeenCalled();
    expect(customMenuUpdate(service)).not.toHaveBeenCalled();
  });

  it("recovers the publish controls when saving before publish fails", async () => {
    const service = serviceWithAccount(createOauthServiceMock(), accountWithMenu({
      buttons: [{ key: "menu", name: "菜单一", type: "click", message: "hi" }],
    }));
    customMenuUpdate(service)
      .mockRejectedValueOnce(new Error("保存菜单失败"));
    renderMenuPage(service);

    await screen.findByLabelText("菜单名称");
    const publishButton = screen.getByRole("button", { name: "保存并发布" });
    fireEvent.click(publishButton);
    confirmMenuPublish();

    expect(await screen.findByText("保存菜单失败")).toBeTruthy();
    expect(publishButton).not.toBeDisabled();
    expect(service.iam.oauth.resourceAccounts.customMenus.publish).not.toHaveBeenCalled();
  });

  it("keeps editing the nearest sibling after deleting a sub-menu", async () => {
    const service = serviceWithAccount(createOauthServiceMock(), accountWithMenu({
      buttons: [{
        key: "parent",
        name: "菜单一",
        subButtons: [
          { key: "first", name: "子菜单一", type: "click", message: "one" },
          { key: "second", name: "子菜单二", type: "click", message: "two" },
        ],
      }],
    }));
    renderMenuPage(service);

    const preview = await screen.findByTestId("wechat-menu-preview");
    fireEvent.click(within(preview).getByRole("button", { name: "菜单一" }));
    fireEvent.click(within(preview).getByRole("button", { name: "子菜单一" }));
    const editor = screen.getByTestId("custom-menu-editor");
    fireEvent.click(within(editor).getByRole("button", { name: "删除子菜单" }));
    const confirmation = screen.getByTestId("custom-menu-delete-confirmation");
    expect(confirmation.className).toContain("!bg-white");
    expect(confirmation.className).toContain("dark:!bg-[#27272a]");
    expect(confirmation.style.opacity).toBe("1");
    fireEvent.click(within(confirmation).getByRole("button", { name: "删除子菜单" }));

    expect(await screen.findByLabelText("菜单名称")).toHaveValue("子菜单二");
  });

  it("turns a parent into an unconfigured leaf after its last sub-menu is deleted", async () => {
    const service = serviceWithAccount(createOauthServiceMock(), accountWithMenu({
      buttons: [{
        key: "parent",
        name: "菜单一",
        subButtons: [{ key: "only-child", name: "唯一子菜单", type: "click", message: "hi" }],
      }],
    }));
    renderMenuPage(service);

    const preview = await screen.findByTestId("wechat-menu-preview");
    fireEvent.click(within(preview).getByRole("button", { name: "菜单一" }));
    fireEvent.click(within(preview).getByRole("button", { name: "唯一子菜单" }));
    fireEvent.click(within(screen.getByTestId("custom-menu-editor")).getByRole("button", { name: "删除子菜单" }));
    fireEvent.click(within(screen.getByTestId("custom-menu-delete-confirmation")).getByRole("button", { name: "删除子菜单" }));

    expect(await screen.findByLabelText("菜单名称")).toHaveValue("菜单一");
    expect(screen.getByRole("radiogroup", { name: "菜单内容" })).toBeTruthy();
    expect(screen.getByText("请选择点击菜单后的响应动作")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "保存并发布" }));
    expect((await screen.findAllByText("请设置菜单动作")).length).toBeGreaterThan(0);
    expect(service.iam.oauth.resourceAccounts.customMenus.publish).not.toHaveBeenCalled();
  });

  it("keeps the menu when deletion is cancelled", async () => {
    const service = serviceWithAccount(createOauthServiceMock(), accountWithMenu({
      buttons: [{ key: "menu", name: "菜单一", type: "click", message: "hi" }],
    }));
    renderMenuPage(service);

    const preview = await screen.findByTestId("wechat-menu-preview");
    expect(preview.className).toContain("dark:bg-[#111113]");
    const simulator = preview.parentElement!;
    expect(simulator).toHaveAttribute("data-device-model", "iphone-16");
    expect(simulator).toHaveAttribute("data-viewport-width", "393");
    expect(simulator).toHaveAttribute("data-viewport-height", "852");
    expect(simulator.style.aspectRatio).toBe("393 / 852");
    expect(simulator.className).toContain("h-[min(100cqh,205cqw)]");
    expect(screen.getByRole("group", { name: "预览设备" })).toBeTruthy();
    const editor = screen.getByTestId("custom-menu-editor");
    fireEvent.click(within(editor).getByRole("button", { name: "删除菜单" }));
    fireEvent.click(within(screen.getByTestId("custom-menu-delete-confirmation")).getByRole("button", { name: "取消" }));

    expect(within(preview).getByRole("button", { name: "菜单一" })).toBeTruthy();
    expect(screen.getByLabelText("菜单名称")).toHaveValue("菜单一");
  });

  it("switches between iPhone simulator sizes while keeping the WeChat menu interactive", async () => {
    const service = serviceWithAccount(createOauthServiceMock(), accountWithMenu({
      buttons: [{ key: "menu", name: "菜单一", type: "click", message: "hi" }],
    }));
    renderMenuPage(service);

    const selector = await screen.findByRole("group", { name: "预览设备" });
    expect(within(selector).getByRole("button", { name: "iPhone 16" })).toHaveAttribute("aria-pressed", "true");
    expect(within(selector).getByRole("button", { name: "iPhone 16 Pro Max" })).toBeTruthy();
    expect(within(selector).getByRole("button", { name: "iPhone 17 Pro" })).toBeTruthy();

    fireEvent.click(within(selector).getByRole("button", { name: "iPhone 16 Pro Max" }));
    const preview = screen.getByTestId("wechat-menu-preview");
    const simulator = preview.parentElement!;
    expect(simulator).toHaveAttribute("data-device-model", "iphone-16-pro-max");
    expect(simulator).toHaveAttribute("data-viewport-width", "440");
    expect(simulator).toHaveAttribute("data-viewport-height", "956");
    expect(simulator.style.aspectRatio).toBe("440 / 956");
    expect(screen.getByText("440 × 956 pt")).toBeTruthy();
    fireEvent.click(within(preview).getByRole("button", { name: "菜单一" }));
    expect(screen.getByLabelText("菜单名称")).toHaveValue("菜单一");

    fireEvent.click(within(selector).getByRole("button", { name: "iPhone 17 Pro" }));
    expect(simulator).toHaveAttribute("data-device-model", "iphone-17-pro");
    expect(simulator).toHaveAttribute("data-viewport-width", "402");
    expect(simulator).toHaveAttribute("data-viewport-height", "874");
    expect(screen.getByText("402 × 874 pt")).toBeTruthy();
  });

  it("adds a sub-menu from the official preview column and edits it on the right", async () => {
    const service = serviceWithAccount(createOauthServiceMock(), accountWithMenu({
      buttons: [{ key: "parent", name: "菜单一", type: "view", url: "https://example.com" }],
    }));
    renderMenuPage(service);

    const preview = await screen.findByTestId("wechat-menu-preview");
    fireEvent.click(within(preview).getByRole("button", { name: "菜单一" }));
    fireEvent.click(within(preview).getByRole("button", { name: "添加子菜单" }));

    const nameInput = await screen.findByLabelText("菜单名称");
    expect(nameInput).toHaveValue("");
    expect(within(screen.getByTestId("custom-menu-editor")).getAllByText("子菜单").length).toBeGreaterThan(0);
    fireEvent.change(nameInput, { target: { value: "服务中心" } });
    expect(within(preview).getByRole("button", { name: "服务中心" })).toBeTruthy();
    expect(screen.getByRole("radiogroup", { name: "菜单内容" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "保存草稿" }));
    const updateCalls = customMenuUpdate(service).mock.calls;
    const savedDraft = updateCalls.at(-1)![1] as SdkworkIamOauthCustomMenuDraft;
    const savedParent = savedDraft.buttons[0];
    expect(savedParent).toMatchObject({
      name: "菜单一",
      subButtons: [{ name: "服务中心" }],
    });
    expect(savedParent.type).toBeUndefined();
    expect(savedParent.url).toBeUndefined();
  });

  it("clears an imported unsupported action when converting its button into a parent menu", async () => {
    const service = serviceWithAccount(createOauthServiceMock(), accountWithMenu({
      buttons: [{
        key: "wechat-media",
        name: "图文",
        unsupportedType: "media_id",
        providerAction: { name: "图文", type: "media_id", media_id: "MEDIA_123" },
      }],
    }));
    renderMenuPage(service);

    const preview = await screen.findByTestId("wechat-menu-preview");
    fireEvent.click(within(preview).getByRole("button", { name: "图文" }));
    fireEvent.click(within(preview).getByRole("button", { name: "添加子菜单" }));
    fireEvent.change(await screen.findByLabelText("菜单名称"), { target: { value: "服务中心" } });
    fireEvent.click(screen.getByRole("button", { name: "保存草稿" }));

    const updateCalls = customMenuUpdate(service).mock.calls;
    const savedDraft = updateCalls.at(-1)![1] as SdkworkIamOauthCustomMenuDraft;
    const savedParent = savedDraft.buttons[0];
    expect(savedParent).toMatchObject({
      name: "图文",
      subButtons: [{ name: "服务中心" }],
    });
    expect(savedParent.unsupportedType).toBeUndefined();
    expect(savedParent.providerAction).toBeUndefined();
  });

  it("selects the first invalid menu when publish validation fails", async () => {
    const service = serviceWithAccount(createOauthServiceMock(), accountWithMenu({
      buttons: [
        { key: "valid", name: "菜单一", type: "click", message: "hi" },
        {
          key: "invalid-parent",
          name: "",
          subButtons: [{ key: "child", name: "服务中心", type: "click", message: "hi" }],
        },
      ],
    }));
    renderMenuPage(service);

    const preview = await screen.findByTestId("wechat-menu-preview");
    expect(await screen.findByLabelText("菜单名称")).toHaveValue("菜单一");
    fireEvent.click(screen.getByRole("button", { name: "保存并发布" }));

    expect(screen.getByLabelText("菜单名称")).toHaveValue("");
    expect(within(preview).getByRole("button", { name: "一级菜单 2" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByTestId("custom-menu-publish-confirmation")).toBeNull();
    expect(service.iam.oauth.resourceAccounts.customMenus.publish).not.toHaveBeenCalled();
  });

  it("does not show a child validation error on its valid parent", async () => {
    const service = serviceWithAccount(createOauthServiceMock(), accountWithMenu({
      buttons: [{
        key: "parent",
        name: "菜单一",
        subButtons: [{ key: "invalid-child", name: "", type: "click", message: "hi" }],
      }],
    }));
    renderMenuPage(service);

    const nameInput = await screen.findByLabelText("菜单名称");
    expect(nameInput).toHaveValue("菜单一");
    expect(nameInput).toHaveAttribute("aria-invalid", "false");

    fireEvent.click(screen.getByRole("button", { name: "保存并发布" }));
    expect(screen.getByLabelText("菜单名称")).toHaveValue("");
    expect(screen.getByLabelText("菜单名称")).toHaveAttribute("aria-invalid", "true");
  });

  it("hides the sub-menu add action at the five-item WeChat limit", async () => {
    const service = serviceWithAccount(createOauthServiceMock(), accountWithMenu({
      buttons: [{
        key: "parent",
        name: "菜单一",
        subButtons: Array.from({ length: 5 }, (_, index) => ({
          key: `child-${index}`,
          name: `子菜单${index + 1}`,
          type: "click" as const,
          message: "hi",
        })),
      }],
    }));
    renderMenuPage(service);

    const preview = await screen.findByTestId("wechat-menu-preview");
    fireEvent.click(within(preview).getByRole("button", { name: "菜单一" }));
    expect(within(preview).queryByRole("button", { name: "添加子菜单" })).toBeNull();
  });

  it("saves a draft through the controller with a success notice", async () => {
    const service = serviceWithAccount(createOauthServiceMock(), accountWithMenu({ buttons: [] }));
    renderMenuPage(service);

    await screen.findByText("点击下方「+」添加一级菜单");
    fireEvent.click(screen.getByText("保存草稿"));

    expect(await screen.findByText("草稿已保存。")).toBeTruthy();
    expect(customMenuUpdate(service)).toHaveBeenCalled();
  });

  it("prevents duplicate draft saves before the first request finishes", async () => {
    let finishSave!: () => void;
    const service = serviceWithAccount(createOauthServiceMock(), accountWithMenu({ buttons: [] }));
    customMenuUpdate(service).mockImplementationOnce(
      () => new Promise<void>((resolve) => { finishSave = resolve; }),
    );
    renderMenuPage(service);

    await screen.findByText("点击下方「+」添加一级菜单");
    const saveButton = screen.getByRole("button", { name: "保存草稿" });
    fireEvent.click(saveButton);
    fireEvent.click(saveButton);

    expect(customMenuUpdate(service)).toHaveBeenCalledTimes(1);
    expect(saveButton).toHaveAttribute("data-loading", "true");
    expect(screen.getByRole("button", { name: "保存并发布" })).toBeDisabled();

    finishSave();
    expect(await screen.findByText("草稿已保存。")).toBeTruthy();
    expect(saveButton).not.toBeDisabled();
  });

  it("prevents duplicate publish requests before the first save finishes", async () => {
    let finishSave!: () => void;
    const service = serviceWithAccount(createOauthServiceMock(), accountWithMenu({
      buttons: [{ key: "menu", name: "菜单一", type: "click", message: "hi" }],
    }));
    customMenuUpdate(service).mockImplementationOnce(
      () => new Promise<void>((resolve) => { finishSave = resolve; }),
    );
    renderMenuPage(service);

    await screen.findByLabelText("菜单名称");
    const publishButton = screen.getByRole("button", { name: "保存并发布" });
    fireEvent.click(publishButton);
    const confirmation = screen.getByTestId("custom-menu-publish-confirmation");
    const confirmButton = within(confirmation).getByRole("button", { name: "确认发布" });
    fireEvent.click(confirmButton);
    fireEvent.click(confirmButton);

    expect(customMenuUpdate(service)).toHaveBeenCalledTimes(1);
    expect(publishButton).toHaveAttribute("data-loading", "true");
    expect(confirmButton).toBeDisabled();
    expect(within(confirmation).getByRole("button", { name: "取消" })).toBeDisabled();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getByTestId("custom-menu-publish-confirmation")).toBeTruthy();

    finishSave();
    await waitFor(() => expect(service.iam.oauth.resourceAccounts.customMenus.publish).toHaveBeenCalledTimes(1));
    expect(screen.queryByTestId("custom-menu-publish-confirmation")).toBeNull();
    expect(publishButton).not.toBeDisabled();
  });
});

describe("official accounts list custom menu action", () => {
  it("opens the custom menu manager from the row actions when provided", async () => {
    const service = serviceWithAccount(createOauthServiceMock(), accountWithMenu({ buttons: [] }));
    const onOpenCustomMenu = vi.fn();
    const controller = createSdkworkIamOauthAdminController(service as never);
    render(
      <SdkworkI18nProvider locale="zh-CN">
        <SdkworkIamOauthOfficialAccountsPage controller={controller} onOpenCustomMenu={onOpenCustomMenu} />
      </SdkworkI18nProvider>,
    );

    const menuAction = await screen.findByTitle("菜单管理");
    fireEvent.click(menuAction);

    expect(onOpenCustomMenu).toHaveBeenCalledWith("iamora-menu-1");
  });

  it("opens the full-screen modal and closes it on Escape when no host navigation is provided", async () => {
    const service = serviceWithAccount(createOauthServiceMock(), accountWithMenu({ buttons: [] }));
    const controller = createSdkworkIamOauthAdminController(service as never);
    render(
      <SdkworkI18nProvider locale="zh-CN">
        <SdkworkIamOauthOfficialAccountsPage controller={controller} />
      </SdkworkI18nProvider>,
    );

    const menuAction = await screen.findByTitle("菜单管理");
    fireEvent.click(menuAction);

    // The full-screen modal renders the custom menu manager for the account.
    expect(await screen.findByText("自定义菜单")).toBeTruthy();
    expect(screen.getAllByText("My official account").length).toBeGreaterThan(0);
    const modal = screen.getByTestId("custom-menu-modal");
    expect(modal.parentElement).toBe(document.body);
    expect(screen.getByRole("button", { name: "关闭自定义菜单" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "返回公众号账号列表" })).toBeNull();
    expect(modal.className).toContain("!bg-white");
    expect(modal.className).toContain("dark:!bg-[#18181b]");
    expect(modal.className).toContain("sm:h-[min(94dvh,68rem)]");
    expect(modal.className).toContain("sm:w-[min(96vw,100rem)]");
    expect(modal.style.opacity).toBe("1");
    expect(document.body.querySelector('[data-slot="modal-overlay"]')).toBeTruthy();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByText("自定义菜单")).toBeNull();
  });

  it("treats simulator device changes as preview-only state", async () => {
    const service = serviceWithAccount(createOauthServiceMock(), accountWithMenu({
      buttons: [{ key: "menu", name: "菜单一", type: "click", message: "hi" }],
    }));
    const controller = createSdkworkIamOauthAdminController(service as never);
    render(
      <SdkworkI18nProvider locale="zh-CN">
        <SdkworkIamOauthOfficialAccountsPage controller={controller} />
      </SdkworkI18nProvider>,
    );

    fireEvent.click(await screen.findByTitle("菜单管理"));
    const selector = await screen.findByRole("group", { name: "预览设备" });
    fireEvent.click(within(selector).getByRole("button", { name: "iPhone 17 Pro" }));
    expect(screen.getByTestId("wechat-menu-preview").parentElement).toHaveAttribute("data-device-model", "iphone-17-pro");

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByTestId("custom-menu-unsaved-confirmation")).toBeNull();
    expect(screen.queryByTestId("custom-menu-modal")).toBeNull();
  });

  it("protects unsaved menu changes before closing the modal", async () => {
    const service = serviceWithAccount(createOauthServiceMock(), accountWithMenu({ buttons: [] }));
    const controller = createSdkworkIamOauthAdminController(service as never);
    render(
      <SdkworkI18nProvider locale="zh-CN">
        <SdkworkIamOauthOfficialAccountsPage controller={controller} />
      </SdkworkI18nProvider>,
    );

    fireEvent.click(await screen.findByTitle("菜单管理"));
    fireEvent.click(await screen.findByRole("button", { name: "添加一级菜单" }));
    fireEvent.change(screen.getByLabelText("菜单名称"), { target: { value: "菜单一" } });
    fireEvent.click(screen.getByRole("button", { name: "关闭自定义菜单" }));

    const confirmation = screen.getByTestId("custom-menu-unsaved-confirmation");
    expect(confirmation.className).toContain("!bg-white");
    expect(confirmation.className).toContain("dark:!bg-[#27272a]");
    expect(confirmation.style.opacity).toBe("1");
    fireEvent.click(within(confirmation).getByRole("button", { name: "取消" }));
    expect(screen.queryByTestId("custom-menu-unsaved-confirmation")).toBeNull();
    expect(screen.getByTestId("custom-menu-modal")).toBeTruthy();
    expect(screen.getByLabelText("菜单名称")).toHaveValue("菜单一");

    fireEvent.click(screen.getByRole("button", { name: "关闭自定义菜单" }));
    fireEvent.click(within(screen.getByTestId("custom-menu-unsaved-confirmation")).getByRole("button", { name: "放弃更改" }));
    expect(screen.queryByText("自定义菜单")).toBeNull();
  });

  it("requires an explicit conversion before publishing an unsupported WeChat action", async () => {
    const service = serviceWithAccount(createOauthServiceMock(), accountWithMenu({
      buttons: [{
        key: "wechat-media",
        name: "图文",
        unsupportedType: "media_id",
        providerAction: { name: "图文", type: "media_id", media_id: "MEDIA_123" },
      }],
    }));
    const controller = createSdkworkIamOauthAdminController(service as never);
    render(
      <SdkworkI18nProvider locale="zh-CN">
        <SdkworkIamOauthOfficialAccountsPage controller={controller} />
      </SdkworkI18nProvider>,
    );

    fireEvent.click(await screen.findByTitle("菜单管理"));
    expect(await screen.findByText(/动作类型“media_id”暂不支持无损编辑/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "保存并发布" }));
    expect(screen.queryByTestId("custom-menu-publish-confirmation")).toBeNull();
    expect(screen.getByText("该微信菜单动作暂不支持发布，请先转换动作类型")).toBeTruthy();

    fireEvent.click(screen.getByRole("radio", { name: "点击事件" }));
    fireEvent.change(screen.getByLabelText("事件键值"), { target: { value: "MEDIA_CONVERTED" } });
    fireEvent.click(screen.getByRole("button", { name: "保存并发布" }));
    expect(screen.getByTestId("custom-menu-publish-confirmation")).toBeTruthy();
  });

  it("intercepts Escape when the menu contains unsaved changes", async () => {
    const service = serviceWithAccount(createOauthServiceMock(), accountWithMenu({ buttons: [] }));
    const controller = createSdkworkIamOauthAdminController(service as never);
    render(
      <SdkworkI18nProvider locale="zh-CN">
        <SdkworkIamOauthOfficialAccountsPage controller={controller} />
      </SdkworkI18nProvider>,
    );

    fireEvent.click(await screen.findByTitle("菜单管理"));
    fireEvent.click(await screen.findByRole("button", { name: "添加一级菜单" }));
    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.getByTestId("custom-menu-unsaved-confirmation")).toBeTruthy();
    expect(screen.getByText("自定义菜单")).toBeTruthy();
  });

  it("uses a second Escape to cancel the unsaved confirmation without closing the workspace", async () => {
    const service = serviceWithAccount(createOauthServiceMock(), accountWithMenu({ buttons: [] }));
    const controller = createSdkworkIamOauthAdminController(service as never);
    render(
      <SdkworkI18nProvider locale="zh-CN">
        <SdkworkIamOauthOfficialAccountsPage controller={controller} />
      </SdkworkI18nProvider>,
    );

    fireEvent.click(await screen.findByTitle("菜单管理"));
    fireEvent.click(await screen.findByRole("button", { name: "添加一级菜单" }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getByTestId("custom-menu-unsaved-confirmation")).toBeTruthy();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByTestId("custom-menu-unsaved-confirmation")).toBeNull();
    expect(screen.getByTestId("custom-menu-modal")).toBeTruthy();
    expect(screen.getByLabelText("菜单名称")).toHaveValue("");
  });

  it("uses Escape to close only the nested delete confirmation", async () => {
    const service = serviceWithAccount(createOauthServiceMock(), accountWithMenu({
      buttons: [{ key: "menu", name: "菜单一", type: "click", message: "hi" }],
    }));
    const controller = createSdkworkIamOauthAdminController(service as never);
    render(
      <SdkworkI18nProvider locale="zh-CN">
        <SdkworkIamOauthOfficialAccountsPage controller={controller} />
      </SdkworkI18nProvider>,
    );

    fireEvent.click(await screen.findByTitle("菜单管理"));
    const editor = await screen.findByTestId("custom-menu-editor");
    fireEvent.click(within(editor).getByRole("button", { name: "删除菜单" }));
    expect(screen.getByTestId("custom-menu-delete-confirmation")).toBeTruthy();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByTestId("custom-menu-delete-confirmation")).toBeNull();
    expect(screen.queryByTestId("custom-menu-unsaved-confirmation")).toBeNull();
    expect(screen.getByTestId("custom-menu-modal")).toBeTruthy();
    expect(screen.getByLabelText("菜单名称")).toHaveValue("菜单一");
  });

  it("uses Escape to close only the nested publish confirmation", async () => {
    const service = serviceWithAccount(createOauthServiceMock(), accountWithMenu({
      buttons: [{ key: "menu", name: "菜单一", type: "click", message: "hi" }],
    }));
    const controller = createSdkworkIamOauthAdminController(service as never);
    render(
      <SdkworkI18nProvider locale="zh-CN">
        <SdkworkIamOauthOfficialAccountsPage controller={controller} />
      </SdkworkI18nProvider>,
    );

    fireEvent.click(await screen.findByTitle("菜单管理"));
    await screen.findByLabelText("菜单名称");
    fireEvent.click(screen.getByRole("button", { name: "保存并发布" }));
    expect(screen.getByTestId("custom-menu-publish-confirmation")).toBeTruthy();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByTestId("custom-menu-publish-confirmation")).toBeNull();
    expect(screen.getByTestId("custom-menu-modal")).toBeTruthy();
    expect(screen.getByLabelText("菜单名称")).toHaveValue("菜单一");
    expect(customMenuUpdate(service)).not.toHaveBeenCalled();
    expect(service.iam.oauth.resourceAccounts.customMenus.publish).not.toHaveBeenCalled();
  });

  it("closes without an unsaved warning after the draft is saved", async () => {
    const service = serviceWithAccount(createOauthServiceMock(), accountWithMenu({ buttons: [] }));
    const controller = createSdkworkIamOauthAdminController(service as never);
    render(
      <SdkworkI18nProvider locale="zh-CN">
        <SdkworkIamOauthOfficialAccountsPage controller={controller} />
      </SdkworkI18nProvider>,
    );

    fireEvent.click(await screen.findByTitle("菜单管理"));
    fireEvent.click(await screen.findByRole("button", { name: "添加一级菜单" }));
    fireEvent.click(screen.getByRole("button", { name: "保存草稿" }));
    expect(await screen.findByText("草稿已保存。")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "关闭自定义菜单" }));

    expect(screen.queryByTestId("custom-menu-unsaved-confirmation")).toBeNull();
    expect(screen.queryByText("自定义菜单")).toBeNull();
  });

  it("keeps the workspace open while a draft save is in progress", async () => {
    let finishSave!: () => void;
    const service = serviceWithAccount(createOauthServiceMock(), accountWithMenu({ buttons: [] }));
    customMenuUpdate(service).mockImplementationOnce(
      () => new Promise<void>((resolve) => { finishSave = resolve; }),
    );
    const controller = createSdkworkIamOauthAdminController(service as never);
    render(
      <SdkworkI18nProvider locale="zh-CN">
        <SdkworkIamOauthOfficialAccountsPage controller={controller} />
      </SdkworkI18nProvider>,
    );

    fireEvent.click(await screen.findByTitle("菜单管理"));
    fireEvent.click(await screen.findByRole("button", { name: "添加一级菜单" }));
    fireEvent.click(screen.getByRole("button", { name: "保存草稿" }));
    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.getByTestId("custom-menu-modal")).toBeTruthy();
    expect(screen.queryByTestId("custom-menu-unsaved-confirmation")).toBeNull();
    expect(screen.getByRole("button", { name: "关闭自定义菜单" })).toBeDisabled();

    finishSave();
    expect(await screen.findByText("草稿已保存。")).toBeTruthy();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByTestId("custom-menu-modal")).toBeNull();
  });

  it("keeps newer edits dirty when an older save request finishes", async () => {
    let finishSave!: () => void;
    const service = serviceWithAccount(createOauthServiceMock(), accountWithMenu({
      buttons: [{ key: "menu", name: "菜单一", type: "click", message: "hi" }],
    }));
    customMenuUpdate(service).mockImplementationOnce(
      () => new Promise<void>((resolve) => { finishSave = resolve; }),
    );
    const controller = createSdkworkIamOauthAdminController(service as never);
    render(
      <SdkworkI18nProvider locale="zh-CN">
        <SdkworkIamOauthOfficialAccountsPage controller={controller} />
      </SdkworkI18nProvider>,
    );

    fireEvent.click(await screen.findByTitle("菜单管理"));
    const nameInput = await screen.findByLabelText("菜单名称");
    fireEvent.change(nameInput, { target: { value: "旧名称" } });
    fireEvent.click(screen.getByRole("button", { name: "保存草稿" }));
    fireEvent.change(nameInput, { target: { value: "新名称" } });
    finishSave();
    expect(await screen.findByText("草稿已保存。")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "关闭自定义菜单" }));
    expect(screen.getByTestId("custom-menu-unsaved-confirmation")).toBeTruthy();
    expect(screen.getByLabelText("菜单名称")).toHaveValue("新名称");
  });

  it("recognizes content restored to the in-flight save as saved", async () => {
    let finishSave!: () => void;
    const service = serviceWithAccount(createOauthServiceMock(), accountWithMenu({
      buttons: [{ key: "menu", name: "菜单一", type: "click", message: "hi" }],
    }));
    customMenuUpdate(service).mockImplementationOnce(
      () => new Promise<void>((resolve) => { finishSave = resolve; }),
    );
    const controller = createSdkworkIamOauthAdminController(service as never);
    render(
      <SdkworkI18nProvider locale="zh-CN">
        <SdkworkIamOauthOfficialAccountsPage controller={controller} />
      </SdkworkI18nProvider>,
    );

    fireEvent.click(await screen.findByTitle("菜单管理"));
    const nameInput = await screen.findByLabelText("菜单名称");
    fireEvent.change(nameInput, { target: { value: "保存版本" } });
    fireEvent.click(screen.getByRole("button", { name: "保存草稿" }));
    fireEvent.change(nameInput, { target: { value: "临时版本" } });
    fireEvent.change(nameInput, { target: { value: "保存版本" } });
    finishSave();

    expect(await screen.findByText("草稿已保存。")).toBeTruthy();
    expect(screen.getByText("已保存")).toBeTruthy();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByTestId("custom-menu-unsaved-confirmation")).toBeNull();
    expect(screen.queryByTestId("custom-menu-modal")).toBeNull();
  });
});
