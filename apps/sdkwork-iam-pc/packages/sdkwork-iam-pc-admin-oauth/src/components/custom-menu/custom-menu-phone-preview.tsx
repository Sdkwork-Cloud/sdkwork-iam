import { MessageCircle, Plus } from "lucide-react";

import type {
  SdkworkIamOauthCustomMenuButton,
  SdkworkIamOauthCustomMenuDraft,
} from "../../types/oauth-admin-types";
import {
  CUSTOM_MENU_MAX_TOP_BUTTONS,
  hasSubMenu,
} from "./custom-menu-validators";

/**
 * WeChat-style phone simulator for the custom menu editor. Mirrors the MP
 * console preview: the account header on top, an empty chat canvas, and the
 * bottom menu bar with 1-3 top-level buttons; the active button is highlighted
 * in WeChat orange and pops its sub-menus (if any) above the bar.
 */

export interface SdkworkIamOauthCustomMenuPhonePreviewProps {
  buttons: SdkworkIamOauthCustomMenuButton[];
  displayName: string;
  emptyHint: string;
  logoUrl?: string;
  onAddTopMenu: () => void;
  onSelect: (path: string) => void;
  previewTitle: string;
  selectedPath: string;
}

export function SdkworkIamOauthCustomMenuPhonePreview({
  buttons,
  displayName,
  emptyHint,
  logoUrl,
  onAddTopMenu,
  onSelect,
  previewTitle,
  selectedPath,
}: SdkworkIamOauthCustomMenuPhonePreviewProps) {
  const selectedParts = selectedPath.split(".");
  const selectedTopIndex = selectedParts[0] !== "" ? Number(selectedParts[0]) : -1;
  const selectedTop = selectedTopIndex >= 0 ? buttons[selectedTopIndex] : undefined;
  const showSubPanel = Boolean(selectedTop && hasSubMenu(selectedTop));

  return (
    <div
      aria-label={previewTitle}
      className="flex h-full min-h-0 w-[340px] shrink-0 flex-col rounded-[2.75rem] border-[7px] border-[var(--sdk-color-border-default)] bg-[var(--sdk-color-surface-base)] p-2 shadow-[0_16px_40px_rgba(0,0,0,0.12)]"
    >
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[2.1rem] bg-[#f7f7f7]">
        {/* Status bar */}
        <div className="flex items-center justify-between px-6 pb-1 pt-2.5 text-[10px] font-medium text-[#191919]">
          <span>9:41</span>
          <span className="flex items-center gap-1" aria-hidden="true">
            <span className="inline-block h-1.5 w-3 rounded-sm bg-current opacity-80" />
            <span className="inline-block h-1.5 w-3 rounded-sm bg-current opacity-60" />
            <span className="inline-block h-1.5 w-3 rounded-sm bg-current opacity-40" />
          </span>
        </div>

        {/* Account header */}
        <div className="flex items-center gap-2.5 bg-[#ededed] px-4 py-3">
          {logoUrl ? (
            <img alt={displayName} className="h-9 w-9 rounded-md object-cover" src={logoUrl} />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--sdk-color-brand-primary-soft)] text-[var(--sdk-color-brand-primary)]">
              <MessageCircle aria-hidden="true" className="h-5 w-5" />
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-[#191919]">{displayName}</p>
            <p className="truncate text-[11px] text-[#8a8a8a]">{previewTitle}</p>
          </div>
        </div>

        {/* Chat canvas */}
        <div className="relative flex min-h-0 flex-1 flex-col bg-[#ededed]">
          <div className="flex min-h-0 flex-1 items-center justify-center px-6">
            <p className="text-center text-[11px] leading-relaxed text-[#b0b0b0]">
              {buttons.length === 0 ? emptyHint : previewTitle}
            </p>
          </div>

          {/* Sub-menu popup */}
          {showSubPanel && selectedTop ? (
            <div className="absolute inset-x-2 bottom-full z-10 mb-1.5 overflow-hidden rounded-xl border border-[#e5e5e5] bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
              {selectedTop.subButtons!.map((subButton, subIndex) => {
                const subPath = `${selectedTopIndex}.${subIndex}`;
                const active = selectedPath === subPath;
                return (
                  <button
                    className={`block w-full border-b border-[#f2f2f2] px-4 py-2.5 text-left text-[13px] last:border-b-0 ${
                      active ? "bg-[var(--sdk-color-brand-primary-soft)] text-[var(--sdk-color-brand-primary)]" : "text-[#191919] hover:bg-[#fafafa]"
                    }`}
                    key={subButton.key}
                    onClick={() => onSelect(subPath)}
                    type="button"
                  >
                    {subButton.name || "…"}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        {/* Bottom menu bar */}
        <div className="relative border-t border-[#e5e5e5] bg-[#f7f7f7]">
          <div className="flex">
            {buttons.map((button, index) => {
              const path = String(index);
              const active = selectedTopIndex === index;
              return (
                <button
                  aria-label={button.name || path}
                  className={`relative min-w-0 flex-1 px-1 py-3 text-[13px] ${
                    active ? "text-[var(--sdk-color-brand-primary)]" : "text-[#191919] hover:bg-[#f0f0f0]"
                  } ${active ? "before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-[var(--sdk-color-brand-primary)]" : ""}`}
                  key={button.key}
                  onClick={() => onSelect(path)}
                  type="button"
                >
                  <span className="block truncate">{button.name || "…"}</span>
                </button>
              );
            })}
            {buttons.length < CUSTOM_MENU_MAX_TOP_BUTTONS ? (
              <button
                aria-label="+"
                className="flex w-12 items-center justify-center text-[#b5b5b5] hover:bg-[#f0f0f0]"
                onClick={onAddTopMenu}
                type="button"
              >
                <Plus aria-hidden="true" className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
