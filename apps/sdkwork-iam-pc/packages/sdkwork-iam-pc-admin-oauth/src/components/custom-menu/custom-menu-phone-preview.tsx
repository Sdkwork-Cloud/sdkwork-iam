import { useState } from "react";
import { MessageCircle, Plus } from "lucide-react";

import type {
  SdkworkIamOauthCustomMenuButton,
} from "../../types/oauth-admin-types";
import {
  CUSTOM_MENU_MAX_TOP_BUTTONS,
  hasSubMenu,
} from "./custom-menu-validators";

/**
 * WeChat-style phone simulator for the custom menu editor, mirroring the
 * WeChat client conversation page as shown in the MP console preview: white
 * nav header with the account avatar + name, a gray chat canvas, and the
 * white bottom menu bar. The active button gets the WeChat green accent with
 * a small caret above the bar; a button with sub-menus pops a white rounded
 * panel (with a pointer triangle over the active button) on a dimmed page,
 * exactly like the WeChat client.
 *
 * The simulator follows the host theme: the `dark:` variants use the WeChat
 * dark-mode palette (iOS system dark colors), so the preview shows the menu
 * as it renders on the user's own WeChat. A device switcher above the phone
 * swaps between real device viewport widths and their screen chrome (dynamic
 * island, notch, punch hole, home indicator).
 */

// Screen content geometry shared by every device (in CSS px).
const SCREEN_PADDING = 8; // horizontal inset of the sub-menu panel
const PLUS_SLOT_WIDTH = 48; // width of the "+" placeholder on the menu bar
const MENU_BAR_HEIGHT = 52; // height of the bottom menu bar
const BEZEL_WIDTH = 8; // device frame border around the screen

type SdkworkIamOauthDeviceNotch = "dynamic-island" | "notch" | "punch-hole" | "none";

interface SdkworkIamOauthDevicePreset {
  id: string;
  label: string;
  /** Screen width in CSS px — the real device viewport width. */
  width: number;
  /** Screen corner radius in px. */
  screenRadius: number;
  notch: SdkworkIamOauthDeviceNotch;
  /** Whether the device renders a gesture home indicator over the menu bar. */
  homeIndicator: boolean;
}

/** Real-device viewport presets the simulator can switch between. */
const DEVICE_PRESETS: ReadonlyArray<SdkworkIamOauthDevicePreset> = [
  { id: "iphone-15-pro", label: "iPhone 15 Pro", width: 393, screenRadius: 44, notch: "dynamic-island", homeIndicator: true },
  { id: "iphone-15-pro-max", label: "iPhone 15 Pro Max", width: 430, screenRadius: 48, notch: "dynamic-island", homeIndicator: true },
  { id: "iphone-se", label: "iPhone SE", width: 375, screenRadius: 20, notch: "none", homeIndicator: false },
  { id: "pixel-8", label: "Pixel 8", width: 412, screenRadius: 30, notch: "punch-hole", homeIndicator: true },
  { id: "galaxy-s23", label: "Galaxy S23", width: 360, screenRadius: 30, notch: "punch-hole", homeIndicator: true },
];

export interface SdkworkIamOauthCustomMenuPhonePreviewProps {
  buttons: SdkworkIamOauthCustomMenuButton[];
  deviceLabel: string;
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
  deviceLabel,
  displayName,
  emptyHint,
  logoUrl,
  onAddTopMenu,
  onSelect,
  previewTitle,
  selectedPath,
}: SdkworkIamOauthCustomMenuPhonePreviewProps) {
  const [deviceId, setDeviceId] = useState<string>(DEVICE_PRESETS[0].id);
  const device = DEVICE_PRESETS.find((preset) => preset.id === deviceId) ?? DEVICE_PRESETS[0];
  const screenWidth = device.width;

  const selectedParts = selectedPath.split(".");
  const selectedTopIndex = selectedParts[0] !== "" ? Number(selectedParts[0]) : -1;
  const selectedTop = selectedTopIndex >= 0 ? buttons[selectedTopIndex] : undefined;
  const showSubPanel = Boolean(selectedTop && hasSubMenu(selectedTop));
  const showAddButton = buttons.length < CUSTOM_MENU_MAX_TOP_BUTTONS;

  // Horizontal center of the active menu item (px from the screen's left
  // edge), converted to a percentage of the sub-menu panel width so the
  // pointer triangle sits exactly over that item.
  const pointerLeftPercent = (() => {
    if (selectedTopIndex < 0 || buttons.length === 0) {
      return 50;
    }
    const itemsStart = showAddButton ? PLUS_SLOT_WIDTH : 0;
    const itemCenter = itemsStart + (selectedTopIndex + 0.5) * (screenWidth - itemsStart) / buttons.length;
    const panelWidth = screenWidth - SCREEN_PADDING * 2;
    return Math.min(100, Math.max(0, ((itemCenter - SCREEN_PADDING) / panelWidth) * 100));
  })();

  return (
    <div className="flex h-full min-h-0 shrink-0 flex-col">
      {/* Device switcher */}
      <div
        aria-label={deviceLabel}
        className="flex shrink-0 flex-wrap items-center justify-center gap-1 pb-3"
        role="group"
      >
        {DEVICE_PRESETS.map((preset) => {
          const selected = preset.id === device.id;
          return (
            <button
              aria-pressed={selected}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                selected
                  ? "bg-[var(--sdk-color-brand-primary-soft)] text-[var(--sdk-color-brand-primary)]"
                  : "bg-[var(--sdk-color-surface-panel-muted)] text-[var(--sdk-color-text-secondary)] hover:bg-[var(--sdk-color-surface-base)]"
              }`}
              key={preset.id}
              onClick={() => setDeviceId(preset.id)}
              title={preset.label}
              type="button"
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {/* Device frame */}
      <div className="flex min-h-0 flex-1 justify-center overflow-x-auto">
        <div
          aria-label={previewTitle}
          className="relative h-full shrink-0 bg-[#23262b] shadow-[0_16px_40px_rgba(0,0,0,0.18)]"
          style={{
            borderRadius: device.screenRadius + BEZEL_WIDTH,
            padding: BEZEL_WIDTH,
            width: screenWidth + BEZEL_WIDTH * 2,
          }}
        >
          {/* Screen */}
          <div
            className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[#f7f7f7] dark:bg-[#1c1c1e]"
            style={{ borderRadius: device.screenRadius, width: screenWidth }}
          >
            {/* Status bar */}
            <div className="flex items-center justify-between bg-[#f7f7f7] px-6 pb-1 pt-2.5 text-[10px] font-medium text-[#191919] dark:bg-[#1c1c1e] dark:text-white">
              <span>9:41</span>
              <span className="flex items-center gap-1" aria-hidden="true">
                <span className="inline-block h-1.5 w-3 rounded-sm bg-current opacity-80" />
                <span className="inline-block h-1.5 w-3 rounded-sm bg-current opacity-60" />
                <span className="inline-block h-1.5 w-3 rounded-sm bg-current opacity-40" />
              </span>
            </div>

            {/* Device screen chrome (dynamic island / notch / punch hole) */}
            {device.notch === "dynamic-island" ? (
              <span
                aria-hidden="true"
                className="absolute left-1/2 top-2 z-20 -translate-x-1/2 rounded-full bg-black"
                style={{
                  height: Math.round(screenWidth * 0.085),
                  width: Math.round(screenWidth * 0.25),
                }}
              />
            ) : device.notch === "notch" ? (
              <span
                aria-hidden="true"
                className="absolute left-1/2 top-0 z-20 h-8 w-[60%] -translate-x-1/2 rounded-b-[20px] bg-black"
              />
            ) : device.notch === "punch-hole" ? (
              <span
                aria-hidden="true"
                className="absolute left-1/2 top-2.5 z-20 h-3 w-3 -translate-x-1/2 rounded-full bg-black"
              />
            ) : null}

            {/* Account header */}
            <div className="flex items-center gap-2.5 border-b border-[#e5e5e5] bg-[#f7f7f7] px-4 py-3 dark:border-[#3a3a3c] dark:bg-[#1c1c1e]">
              {logoUrl ? (
                <img alt={displayName} className="h-9 w-9 rounded-full object-cover" src={logoUrl} />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e5e5e5] text-[#999999] dark:bg-[#3a3a3c] dark:text-[#8a8a8a]">
                  <MessageCircle aria-hidden="true" className="h-5 w-5" />
                </span>
              )}
              <p className="min-w-0 truncate text-[15px] font-medium text-[#191919] dark:text-white">
                {displayName || previewTitle}
              </p>
            </div>

            {/* Chat canvas */}
            <div className="relative flex min-h-0 flex-1 flex-col bg-[#ededed] dark:bg-[#191919]">
              <div className="flex min-h-0 flex-1 items-center justify-center px-6">
                <p className="text-center text-[11px] leading-relaxed text-[#b0b0b0] dark:text-[#8a8a8a]">
                  {buttons.length === 0 ? emptyHint : previewTitle}
                </p>
              </div>

              {/* Sub-menu popup: anchored above the menu bar, pointer over the
                  active item */}
              {showSubPanel && selectedTop ? (
                <div className="absolute inset-x-2 bottom-0 z-10 mb-[6px] rounded-lg border border-[#e5e5e5] bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.12)] dark:border-[#3a3a3c] dark:bg-[#2c2c2e]">
                  {selectedTop.subButtons!.map((subButton, subIndex) => {
                    const subPath = `${selectedTopIndex}.${subIndex}`;
                    const active = selectedPath === subPath;
                    return (
                      <button
                        aria-pressed={active}
                        className={`block w-full border-b border-[#f2f2f2] px-4 py-3 text-left text-[15px] first:rounded-t-lg last:rounded-b-lg last:border-b-0 dark:border-[#3a3a3c] ${
                          active
                            ? "bg-[rgba(7,193,96,0.08)] text-[#07c160]"
                            : "text-[#191919] hover:bg-[#fafafa] dark:text-white dark:hover:bg-white/5"
                        }`}
                        key={subButton.key}
                        onClick={() => onSelect(subPath)}
                        type="button"
                      >
                        {subButton.name || "…"}
                      </button>
                    );
                  })}
                  {/* Pointer triangle anchored over the active menu item */}
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-[6px] -translate-x-1/2 border-x-[6px] border-t-[7px] border-x-transparent border-t-white dark:border-t-[#2c2c2e]"
                    style={{ left: `${pointerLeftPercent}%` }}
                  />
                </div>
              ) : null}
            </div>

            {/* Dim overlay while a sub-menu panel is open: WeChat darkens the
                page above the menu bar behind the panel */}
            {showSubPanel ? (
              <div className="absolute inset-x-0 top-0 z-[5] bg-black/35" style={{ bottom: MENU_BAR_HEIGHT }} />
            ) : null}

            {/* Bottom menu bar */}
            <div
              className="relative shrink-0 border-t border-[#e5e5e5] bg-white dark:border-[#3a3a3c] dark:bg-[#1c1c1e]"
              style={{ height: MENU_BAR_HEIGHT }}
            >
              {buttons.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <button
                    aria-label="+"
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f2f2f2] text-[#b5b5b5] dark:bg-[#2c2c2e] dark:text-[#6b6b6f]"
                    onClick={onAddTopMenu}
                    type="button"
                  >
                    <Plus aria-hidden="true" className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex h-full">
                  {buttons.map((button, index) => {
                    const path = String(index);
                    const active = selectedTopIndex === index;
                    return (
                      <button
                        aria-label={button.name || path}
                        aria-pressed={active}
                        className={`relative flex h-full min-w-0 flex-1 items-center justify-center px-1 text-[14px] ${
                          active
                            ? "text-[#07c160]"
                            : "text-[#191919] hover:bg-[#f0f0f0] dark:text-white dark:hover:bg-white/5"
                        }`}
                        key={button.key}
                        onClick={() => onSelect(path)}
                        type="button"
                      >
                        {active ? (
                          <span
                            aria-hidden="true"
                            className="absolute -top-[6px] left-1/2 -translate-x-1/2 border-x-[5px] border-b-[6px] border-x-transparent border-b-[#07c160]"
                          />
                        ) : null}
                        <span className="block truncate">{button.name || "…"}</span>
                      </button>
                    );
                  })}
                  {showAddButton ? (
                    <button
                      aria-label="+"
                      className="flex h-full w-12 shrink-0 items-center justify-center text-[#b5b5b5] hover:bg-[#f0f0f0] dark:text-[#6b6b6f] dark:hover:bg-white/5"
                      onClick={onAddTopMenu}
                      type="button"
                    >
                      <Plus aria-hidden="true" className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              )}
            </div>

            {/* Gesture home indicator */}
            {device.homeIndicator ? (
              <span
                aria-hidden="true"
                className="absolute bottom-1.5 left-1/2 z-20 h-1 w-28 -translate-x-1/2 rounded-full bg-black/70 dark:bg-white/70"
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
