import { Keyboard, Plus } from "lucide-react";

import type { SdkworkIamOauthCustomMenuButton } from "../../types/oauth-admin-types";
import { CUSTOM_MENU_MAX_TOP_BUTTONS, hasSubMenu } from "./custom-menu-validators";

const PREVIEW_WIDTH = 320;
const KEYBOARD_SLOT_WIDTH = 44;
const MENU_BAR_HEIGHT = 51;

export interface SdkworkIamOauthCustomMenuPhonePreviewProps {
  buttons: SdkworkIamOauthCustomMenuButton[];
  displayName: string;
  emptyHint: string;
  onAddTopMenu: () => void;
  onSelect: (path: string) => void;
  previewTitle: string;
  selectedPath: string;
}

/**
 * Fixed WeChat Official Accounts Platform preview. Its geometry follows the
 * public-platform menu editor rather than a particular mobile device, so the
 * menu columns and sub-menu anchors match what operators configure.
 */
export function SdkworkIamOauthCustomMenuPhonePreview({
  buttons,
  displayName,
  emptyHint,
  onAddTopMenu,
  onSelect,
  previewTitle,
  selectedPath,
}: SdkworkIamOauthCustomMenuPhonePreviewProps) {
  const selectedParts = selectedPath.split(".");
  const selectedTopIndex = selectedParts[0] ? Number(selectedParts[0]) : -1;
  const selectedTop = selectedTopIndex >= 0 ? buttons[selectedTopIndex] : undefined;
  const showSubMenu = Boolean(selectedTop && hasSubMenu(selectedTop));
  const showAddButton = buttons.length < CUSTOM_MENU_MAX_TOP_BUTTONS;
  const menuColumnCount = Math.max(1, buttons.length + (showAddButton ? 1 : 0));
  const menuColumnWidth = (PREVIEW_WIDTH - KEYBOARD_SLOT_WIDTH) / menuColumnCount;
  const subMenuLeft = KEYBOARD_SLOT_WIDTH + selectedTopIndex * menuColumnWidth;

  return (
    <div
      aria-label={previewTitle}
      className="relative h-[560px] w-[320px] shrink-0 overflow-hidden border border-[#d8d8d8] bg-[#f5f5f5] shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
      data-testid="wechat-menu-preview"
    >
      <div className="flex h-16 items-center justify-center bg-[#616161] px-10 text-[15px] text-white">
        <span className="max-w-full truncate">{displayName || previewTitle}</span>
      </div>

      <div className="flex h-[445px] items-center justify-center px-8 text-center text-xs leading-5 text-[#b2b2b2]">
        {buttons.length === 0 ? emptyHint : null}
      </div>

      {showSubMenu && selectedTop ? (
        <div
          className="absolute z-10 border border-[#d0d0d0] bg-white"
          data-testid="wechat-sub-menu"
          style={{
            bottom: MENU_BAR_HEIGHT + 10,
            left: subMenuLeft + 4,
            width: menuColumnWidth - 8,
          }}
        >
          {selectedTop.subButtons!.map((subButton, subIndex) => {
            const subPath = `${selectedTopIndex}.${subIndex}`;
            const active = selectedPath === subPath;
            return (
              <button
                aria-pressed={active}
                className={`block h-11 w-full truncate border-b border-[#e7e7e7] px-2 text-center text-[13px] last:border-b-0 hover:bg-[#f5f5f5] ${
                  active ? "bg-[#f4fff8] text-[#07c160]" : "bg-white text-[#353535]"
                }`}
                key={subButton.key}
                onClick={() => onSelect(subPath)}
                type="button"
              >
                {subButton.name || "..."}
              </button>
            );
          })}
          <span
            aria-hidden="true"
            className="absolute -bottom-[6px] left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-[#d0d0d0] bg-white"
          />
        </div>
      ) : null}

      <div className="absolute inset-x-0 bottom-0 flex h-[51px] border-t border-[#d0d0d0] bg-[#fafafa]">
        <div className="flex w-11 shrink-0 items-center justify-center border-r border-[#d0d0d0] text-[#8a8a8a]">
          <Keyboard aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
        </div>
        {buttons.map((button, index) => {
          const path = String(index);
          const active = selectedTopIndex === index;
          return (
            <button
              aria-label={button.name || path}
              aria-pressed={active}
              className={`relative flex min-w-0 flex-1 items-center justify-center border-r border-[#d0d0d0] px-2 text-[13px] hover:bg-white ${
                active
                  ? "z-[1] -m-px border border-[#07c160] bg-white text-[#07c160]"
                  : "bg-[#fafafa] text-[#353535]"
              }`}
              key={button.key}
              onClick={() => onSelect(path)}
              type="button"
            >
              <span className="block max-w-full truncate">{button.name || "..."}</span>
            </button>
          );
        })}
        {showAddButton ? (
          <button
            aria-label="+"
            className="flex min-w-0 flex-1 items-center justify-center bg-[#fafafa] text-[#8a8a8a] hover:bg-white hover:text-[#07c160]"
            onClick={onAddTopMenu}
            type="button"
          >
            <Plus aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
          </button>
        ) : null}
      </div>
    </div>
  );
}
