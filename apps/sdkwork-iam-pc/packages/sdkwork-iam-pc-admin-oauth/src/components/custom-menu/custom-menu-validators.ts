import type {
  SdkworkIamOauthCustomMenuButton,
  SdkworkIamOauthCustomMenuDraft,
} from "../../types/oauth-admin-types";

/**
 * Pure validation rules for the official account custom menu editor, aligned
 * with the WeChat custom menu limits shown in the MP console:
 *
 * - 1-3 top-level menus, each expanding into 1-5 sub-menus;
 * - top-level names: up to 4 Chinese characters (8 letters/digits), sub-menu
 *   names: up to 8 Chinese characters (16 letters/digits) — measured in
 *   display units where one CJK character counts as two;
 * - leaf buttons must carry an action with its required fields (message for
 *   `click`, URL for `view`, AppID + page path for `miniprogram`);
 * - buttons that open a sub-menu are display-only and carry no action.
 */

export const CUSTOM_MENU_MAX_TOP_BUTTONS = 3;
export const CUSTOM_MENU_MAX_SUB_BUTTONS = 5;
export const CUSTOM_MENU_TOP_NAME_UNIT_LIMIT = 8; // 4 CJK chars
export const CUSTOM_MENU_SUB_NAME_UNIT_LIMIT = 16; // 8 CJK chars

export type SdkworkIamOauthCustomMenuValidationKind =
  | "atLeastOneTop"
  | "tooManyTop"
  | "tooManySub"
  | "nameRequired"
  | "nameTooLongTop"
  | "nameTooLongSub"
  | "actionRequired"
  | "messageRequired"
  | "urlRequired"
  | "urlInvalid"
  | "appIdRequired"
  | "pagePathRequired";

export interface SdkworkIamOauthCustomMenuValidationIssue {
  /** Path to the offending button: "0" or "0.2" (top index, sub index). */
  path: string;
  kind: SdkworkIamOauthCustomMenuValidationKind;
}

/**
 * Display-unit length of a menu name: CJK characters count as two units,
 * everything else as one, matching the WeChat MP console counter
 * ("4 个汉字或 8 个字母").
 */
export function menuNameUnitLength(name: string): number {
  let units = 0;
  for (const char of name) {
    units += isCjkChar(char) ? 2 : 1;
  }
  return units;
}

export function hasSubMenu(button: SdkworkIamOauthCustomMenuButton): boolean {
  return Boolean(button.subButtons && button.subButtons.length > 0);
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

const URL_PATTERN = /^https?:\/\/.+/iu;

export function validateMenuButtonAction(
  button: SdkworkIamOauthCustomMenuButton,
): SdkworkIamOauthCustomMenuValidationKind | undefined {
  if (!button.type) {
    return "actionRequired";
  }
  switch (button.type) {
    case "click":
      return button.message && button.message.trim() ? undefined : "messageRequired";
    case "view":
      if (!button.url || !button.url.trim()) {
        return "urlRequired";
      }
      return URL_PATTERN.test(button.url.trim()) ? undefined : "urlInvalid";
    case "miniprogram":
      if (!button.appId || !button.appId.trim()) {
        return "appIdRequired";
      }
      return button.pagePath && button.pagePath.trim() ? undefined : "pagePathRequired";
    default:
      return "actionRequired";
  }
}

/**
 * Validates the full draft tree. Returns issues sorted by tree position; the
 * UI maps each `kind` to a localized message and highlights the button.
 */
export function validateCustomMenuDraft(
  draft: SdkworkIamOauthCustomMenuDraft,
): SdkworkIamOauthCustomMenuValidationIssue[] {
  const issues: SdkworkIamOauthCustomMenuValidationIssue[] = [];
  if (draft.buttons.length === 0) {
    issues.push({ path: "", kind: "atLeastOneTop" });
    return issues;
  }
  if (draft.buttons.length > CUSTOM_MENU_MAX_TOP_BUTTONS) {
    issues.push({ path: "", kind: "tooManyTop" });
  }
  draft.buttons.forEach((button, index) => {
    const path = String(index);
    if (hasSubMenu(button)) {
      if (button.subButtons!.length > CUSTOM_MENU_MAX_SUB_BUTTONS) {
        issues.push({ path, kind: "tooManySub" });
      }
      button.subButtons!.forEach((subButton, subIndex) => {
        const subPath = `${path}.${subIndex}`;
        pushNameIssue(issues, subPath, subButton.name, "sub");
        pushActionIssue(issues, subPath, subButton);
      });
    } else {
      pushNameIssue(issues, path, button.name, "top");
      pushActionIssue(issues, path, button);
    }
  });
  return issues;
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

function isCjkChar(char: string): boolean {
  const code = char.codePointAt(0) ?? 0;
  return (
    (code >= 0x4E00 && code <= 0x9FFF)
    || (code >= 0x3400 && code <= 0x4DBF)
    || (code >= 0xF900 && code <= 0xFAFF)
    || (code >= 0x20000 && code <= 0x2FFFF)
  );
}

let menuKeyCounter = 0;

/**
 * Stable-ish unique key for new menu buttons; deterministic and dependency
 * free so tests can assert the tree shape without a UUID polyfill.
 */
export function createCustomMenuKey(): string {
  menuKeyCounter += 1;
  return `menu-${Date.now().toString(36)}-${menuKeyCounter.toString(36)}`;
}
