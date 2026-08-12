import { fireEvent, render, screen, within } from "@testing-library/react";
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
  createCustomMenuKey,
  menuNameUnitLength,
  validateCustomMenuDraft,
  validateCustomMenuName,
  validateMenuButtonAction,
} from "../src/components/custom-menu/custom-menu-validators";
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
  return service;
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

describe("custom menu validators", () => {
  it("measures names in WeChat display units (CJK counts as two)", () => {
    expect(menuNameUnitLength("菜单")).toBe(4);
    expect(menuNameUnitLength("menu")).toBe(4);
    expect(menuNameUnitLength("菜单a")).toBe(5);
  });

  it("limits top-level names to 4 CJK chars and sub-menu names to 8", () => {
    expect(validateCustomMenuName("菜单名称", "top")).toBeUndefined();
    expect(validateCustomMenuName("菜单名称一", "top")).toBe("nameTooLongTop");
    expect(validateCustomMenuName("二级菜单名称", "sub")).toBeUndefined();
    expect(validateCustomMenuName("二级菜单名称一二三", "sub")).toBe("nameTooLongSub");
    expect(validateCustomMenuName("", "top")).toBe("nameRequired");
  });

  it("requires an action and its fields on leaf buttons", () => {
    const empty: SdkworkIamOauthCustomMenuButton = { key: "k1", name: "菜单" };
    expect(validateMenuButtonAction(empty)).toBe("actionRequired");
    expect(validateMenuButtonAction({ ...empty, type: "click" })).toBe("messageRequired");
    expect(validateMenuButtonAction({ ...empty, type: "view" })).toBe("urlRequired");
    expect(validateMenuButtonAction({ ...empty, type: "view", url: "example.com" })).toBe("urlInvalid");
    expect(validateMenuButtonAction({ ...empty, type: "view", url: "https://example.com" })).toBeUndefined();
    expect(validateMenuButtonAction({ ...empty, type: "miniprogram" })).toBe("appIdRequired");
    expect(validateMenuButtonAction({ ...empty, type: "miniprogram", appId: "wx123" })).toBe("pagePathRequired");
    expect(
      validateMenuButtonAction({ ...empty, type: "miniprogram", appId: "wx123", pagePath: "pages/index/index" }),
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
  });

  it("generates unique button keys", () => {
    expect(createCustomMenuKey()).not.toBe(createCustomMenuKey());
  });
});

describe("custom menu controller", () => {
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

  it("saves the draft into the account config preserving existing fields", async () => {
    const service = serviceWithAccount(createOauthServiceMock(), accountWithMenu({
      buttons: [{ key: "k1", name: "旧菜单", type: "click", message: "hi" }],
    }));
    const controller = createSdkworkIamOauthAdminController(service as never);

    const draft: SdkworkIamOauthCustomMenuDraft = {
      buttons: [{ key: "k1", name: "新菜单", type: "view", url: "https://example.com" }],
    };
    await controller.saveAccountCustomMenu("iamora-menu-1", draft);

    const calls = (service.iam.oauth.resourceAccounts.update as ReturnType<typeof vi.fn>).mock.calls;
    const patch = calls.at(-1)![1] as { config: Record<string, unknown> };
    expect(patch.config.customMenu).toMatchObject({ buttons: draft.buttons });
    // Existing config fields survive the merge.
    expect(patch.config.logoUrl).toBe("https://example.com/logo.png");
    // The quick-setup lists reload after the mutation.
    expect(service.iam.oauth.resourceAccounts.list).toHaveBeenCalledTimes(2);
  });

  it("publishes through the backend custom menu capability when available", async () => {
    const service = createOauthServiceMock();
    (service.iam.oauth.resourceAccounts.customMenus.publish as ReturnType<typeof vi.fn>)
      .mockResolvedValue({ ok: true });
    const controller = createSdkworkIamOauthAdminController(service as never);

    const draft: SdkworkIamOauthCustomMenuDraft = {
      buttons: [{ key: "k1", name: "菜单", type: "view", url: "https://example.com" }],
    };
    const result = await controller.publishAccountCustomMenu("iamora-menu-1", draft);

    expect(result).toEqual({ saved: true, published: true });
    expect(service.iam.oauth.resourceAccounts.customMenus.publish).toHaveBeenCalledWith(
      "iamora-menu-1",
      { buttons: draft.buttons },
    );
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
    expect(service.iam.oauth.resourceAccounts.update).toHaveBeenCalled();
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
    // Phone simulator renders the top-level menu bar once the draft loads.
    expect(await screen.findByText("菜单一")).toBeTruthy();
    expect(screen.getByText("菜单二")).toBeTruthy();

    // Selecting the parent with sub-menus pops its sub-menus and shows the
    // sub-menu list in the editor.
    fireEvent.click(screen.getByText("菜单二"));
    const subMenu = screen.getByTestId("wechat-sub-menu");
    expect(within(subMenu).getByRole("button", { name: "子菜单一" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "iPhone 15 Pro" })).toBeNull();
  });

  it("adds a top-level menu from the simulator and renames it live", async () => {
    const service = serviceWithAccount(createOauthServiceMock(), accountWithMenu({ buttons: [] }));
    renderMenuPage(service);

    expect(await screen.findByText("点击下方「+」添加一级菜单")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "+" }));

    const nameInput = await screen.findByLabelText("菜单名称");
    fireEvent.change(nameInput, { target: { value: "新菜单" } });
    expect(screen.getByText("新菜单")).toBeTruthy();
  });

  it("blocks publish and shows the first validation issue for an incomplete draft", async () => {
    const service = serviceWithAccount(createOauthServiceMock(), accountWithMenu({
      buttons: [{ key: "k1", name: "菜单一", type: "click", message: "" }],
    }));
    renderMenuPage(service);

    await screen.findByText("菜单一");
    fireEvent.click(screen.getByText("菜单一"));
    expect(await screen.findByText("请输入消息内容")).toBeTruthy();
    fireEvent.click(screen.getByText("保存并发布"));

    expect(await screen.findByText("保存并发布")).toBeTruthy();
    expect(service.iam.oauth.resourceAccounts.customMenus.publish).not.toHaveBeenCalled();
    expect(service.iam.oauth.resourceAccounts.update).not.toHaveBeenCalled();
  });

  it("saves a draft through the controller with a success notice", async () => {
    const service = serviceWithAccount(createOauthServiceMock(), accountWithMenu({ buttons: [] }));
    renderMenuPage(service);

    await screen.findByText("点击下方「+」添加一级菜单");
    fireEvent.click(screen.getByText("保存草稿"));

    expect(await screen.findByText("草稿已保存。")).toBeTruthy();
    expect(service.iam.oauth.resourceAccounts.update).toHaveBeenCalled();
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
    expect(modal.className).toContain("bg-white");
    expect(modal.style.backgroundColor).toBe("var(--sdk-color-surface-panel, #ffffff)");
    expect(document.body.querySelector('[data-slot="modal-overlay"]')).toBeTruthy();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByText("自定义菜单")).toBeNull();
  });
});
