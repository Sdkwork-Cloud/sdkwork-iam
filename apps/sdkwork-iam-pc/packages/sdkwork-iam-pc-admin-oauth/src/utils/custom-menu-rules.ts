import type {
  SdkworkIamOauthCustomMenuButton,
  SdkworkIamOauthCustomMenuDraft,
} from "../types/oauth-admin-types";

export const CUSTOM_MENU_MAX_TOP_BUTTONS = 3;
export const CUSTOM_MENU_MAX_SUB_BUTTONS = 5;
export const CUSTOM_MENU_TOP_NAME_UNIT_LIMIT = 8;
export const CUSTOM_MENU_SUB_NAME_UNIT_LIMIT = 14;
export const CUSTOM_MENU_URL_BYTE_LIMIT = 1024;

export type SdkworkIamOauthCustomMenuValidationKind =
  | "atLeastOneTop"
  | "tooManyTop"
  | "tooManySub"
  | "nestedSubMenuNotAllowed"
  | "nameRequired"
  | "nameTooLongTop"
  | "nameTooLongSub"
  | "actionRequired"
  | "unsupportedAction"
  | "messageRequired"
  | "messageTooLong"
  | "urlRequired"
  | "urlInvalid"
  | "urlTooLong"
  | "appIdRequired"
  | "pagePathRequired";

export interface SdkworkIamOauthCustomMenuValidationIssue {
  path: string;
  kind: SdkworkIamOauthCustomMenuValidationKind;
}

export function menuNameUnitLength(name: string): number {
  let units = 0;
  for (const char of name) {
    units += (char.codePointAt(0) ?? 0) > 0x7F ? 2 : 1;
  }
  return units;
}

export function clampCustomMenuName(name: string, limit: number): string {
  let units = 0;
  let result = "";
  for (const char of name) {
    const charUnits = (char.codePointAt(0) ?? 0) > 0x7F ? 2 : 1;
    if (units + charUnits > limit) {
      break;
    }
    result += char;
    units += charUnits;
  }
  return result;
}

export function hasSubMenu(button: SdkworkIamOauthCustomMenuButton): boolean {
  return Boolean(button.subButtons?.length);
}

export function validateCustomMenuName(
  name: string,
  level: "top" | "sub",
): SdkworkIamOauthCustomMenuValidationKind | undefined {
  if (!name.trim()) {
    return "nameRequired";
  }
  const limit = level === "top" ? CUSTOM_MENU_TOP_NAME_UNIT_LIMIT : CUSTOM_MENU_SUB_NAME_UNIT_LIMIT;
  if (menuNameUnitLength(name.trim()) > limit) {
    return level === "top" ? "nameTooLongTop" : "nameTooLongSub";
  }
  return undefined;
}

export function validateMenuButtonAction(
  button: SdkworkIamOauthCustomMenuButton,
): SdkworkIamOauthCustomMenuValidationKind | undefined {
  if (button.unsupportedType) {
    return "unsupportedAction";
  }
  if (!button.type) {
    return "actionRequired";
  }
  switch (button.type) {
    case "click":
      if (!button.message?.trim()) {
        return "messageRequired";
      }
      return utf8ByteLength(button.message.trim()) <= 128 ? undefined : "messageTooLong";
    case "view":
      if (!button.url?.trim()) {
        return "urlRequired";
      }
      if (!isHttpUrl(button.url.trim())) {
        return "urlInvalid";
      }
      return utf8ByteLength(button.url.trim()) <= CUSTOM_MENU_URL_BYTE_LIMIT
        ? undefined
        : "urlTooLong";
    case "miniprogram":
      if (!button.appId?.trim()) {
        return "appIdRequired";
      }
      if (!button.pagePath?.trim()) {
        return "pagePathRequired";
      }
      if (!button.url?.trim()) {
        return "urlRequired";
      }
      if (!isHttpUrl(button.url.trim())) {
        return "urlInvalid";
      }
      return utf8ByteLength(button.url.trim()) <= CUSTOM_MENU_URL_BYTE_LIMIT
        ? undefined
        : "urlTooLong";
    default:
      return "actionRequired";
  }
}

function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

export function validateCustomMenuDraft(
  draft: SdkworkIamOauthCustomMenuDraft,
): SdkworkIamOauthCustomMenuValidationIssue[] {
  const issues: SdkworkIamOauthCustomMenuValidationIssue[] = [];
  if (draft.buttons.length === 0) {
    return [{ path: "", kind: "atLeastOneTop" }];
  }
  if (draft.buttons.length > CUSTOM_MENU_MAX_TOP_BUTTONS) {
    issues.push({ path: "", kind: "tooManyTop" });
  }
  draft.buttons.forEach((button, index) => {
    const path = String(index);
    pushNameIssue(issues, path, button.name, "top");
    if (!hasSubMenu(button)) {
      pushActionIssue(issues, path, button);
      return;
    }
    if (button.subButtons!.length > CUSTOM_MENU_MAX_SUB_BUTTONS) {
      issues.push({ path, kind: "tooManySub" });
    }
    button.subButtons!.forEach((subButton, subIndex) => {
      const subPath = `${path}.${subIndex}`;
      pushNameIssue(issues, subPath, subButton.name, "sub");
      if (hasSubMenu(subButton)) {
        issues.push({ path: subPath, kind: "nestedSubMenuNotAllowed" });
      } else {
        pushActionIssue(issues, subPath, subButton);
      }
    });
  });
  return issues;
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function pushNameIssue(
  issues: SdkworkIamOauthCustomMenuValidationIssue[],
  path: string,
  name: string,
  level: "top" | "sub",
): void {
  const kind = validateCustomMenuName(name, level);
  if (kind) {
    issues.push({ path, kind });
  }
}

function pushActionIssue(
  issues: SdkworkIamOauthCustomMenuValidationIssue[],
  path: string,
  button: SdkworkIamOauthCustomMenuButton,
): void {
  const kind = validateMenuButtonAction(button);
  if (kind) {
    issues.push({ path, kind });
  }
}

let menuKeyCounter = 0;

export function createCustomMenuKey(): string {
  menuKeyCounter += 1;
  return `menu-${Date.now().toString(36)}-${menuKeyCounter.toString(36)}`;
}
