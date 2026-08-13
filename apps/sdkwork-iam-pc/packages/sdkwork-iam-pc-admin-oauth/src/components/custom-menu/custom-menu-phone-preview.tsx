import { useState } from "react";
import {
  BatteryFull,
  ChevronLeft,
  Keyboard,
  MoreHorizontal,
  Plus,
  Signal,
  Wifi,
} from "lucide-react";

import { SegmentedControl } from "@sdkwork/ui-pc-react";

import type { SdkworkIamOauthCustomMenuButton } from "../../types/oauth-admin-types";
import {
  CUSTOM_MENU_MAX_SUB_BUTTONS,
  CUSTOM_MENU_MAX_TOP_BUTTONS,
} from "./custom-menu-validators";
import {
  CUSTOM_MENU_DEVICE_PRESETS,
  DEFAULT_CUSTOM_MENU_DEVICE_ID,
  findCustomMenuDevicePreset,
  type CustomMenuDevicePresetId,
} from "./custom-menu-device-presets";

const KEYBOARD_SLOT_PERCENT = 13.75;
const MENU_BAR_HEIGHT_PERCENT = 7.25;
const HOME_INDICATOR_HEIGHT_PERCENT = 4;

export interface SdkworkIamOauthCustomMenuPhonePreviewProps {
  buttons: SdkworkIamOauthCustomMenuButton[];
  displayName: string;
  emptyHint: string;
  addTopMenuLabel: string;
  addSubMenuLabel: string;
  deviceSelectorLabel: string;
  subMenuLabel: string;
  topMenuLabel: string;
  onAddTopMenu: () => void;
  onAddSubMenu: (topIndex: number) => void;
  onSelect: (path: string) => void;
  previewTitle: string;
  selectedPath: string;
}

/** Device-aware WeChat preview with an interactive iOS simulator shell. */
export function SdkworkIamOauthCustomMenuPhonePreview({
  buttons,
  displayName,
  emptyHint,
  addTopMenuLabel,
  addSubMenuLabel,
  deviceSelectorLabel,
  subMenuLabel,
  topMenuLabel,
  onAddTopMenu,
  onAddSubMenu,
  onSelect,
  previewTitle,
  selectedPath,
}: SdkworkIamOauthCustomMenuPhonePreviewProps) {
  const [deviceId, setDeviceId] = useState<CustomMenuDevicePresetId>(DEFAULT_CUSTOM_MENU_DEVICE_ID);
  const device = findCustomMenuDevicePreset(deviceId);
  const selectedParts = selectedPath.split(".");
  const selectedTopIndex = selectedParts[0] ? Number(selectedParts[0]) : -1;
  const selectedTop = selectedTopIndex >= 0 ? buttons[selectedTopIndex] : undefined;
  const showSubMenu = Boolean(selectedTop && selectedTopIndex >= 0);
  const showAddButton = buttons.length < CUSTOM_MENU_MAX_TOP_BUTTONS;
  const menuColumnCount = Math.max(1, buttons.length + (showAddButton ? 1 : 0));
  const menuColumnWidth = (100 - KEYBOARD_SLOT_PERCENT) / menuColumnCount;
  const subMenuLeft = KEYBOARD_SLOT_PERCENT + selectedTopIndex * menuColumnWidth;

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-3">
      <div className="grid shrink-0 grid-cols-1 items-center gap-2 2xl:grid-cols-[minmax(0,1fr)_auto]">
        <SegmentedControl
          aria-label={deviceSelectorLabel}
          className="min-w-0 !bg-white dark:!bg-[#27272a]"
          onValueChange={(value) => setDeviceId(findCustomMenuDevicePreset(value).id)}
          options={CUSTOM_MENU_DEVICE_PRESETS.map((preset) => ({
            label: <span title={preset.label}>{preset.label}</span>,
            value: preset.id,
          }))}
          size="sm"
          value={deviceId}
        />
        <span className="justify-self-center whitespace-nowrap text-[11px] tabular-nums text-[#8d8d8d] 2xl:justify-self-end dark:text-[#a1a1aa]">
          {device.width} × {device.height} pt
        </span>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden [container-type:size]">
        <div
          aria-label={`${previewTitle} - ${device.label}`}
          className="relative h-[min(100cqh,205cqw)] w-auto shrink-0 rounded-[clamp(1.8rem,5cqh,2.75rem)] border border-black/80 bg-[#1c1c1e] p-[clamp(0.3rem,0.8cqh,0.45rem)] shadow-[0_18px_38px_rgba(0,0,0,0.22),inset_0_0_0_1px_rgba(255,255,255,0.12)] dark:border-[#52525b] dark:bg-black dark:shadow-[0_18px_44px_rgba(0,0,0,0.55),inset_0_0_0_1px_rgba(255,255,255,0.10)]"
          data-device-model={device.id}
          data-viewport-height={device.height}
          data-viewport-width={device.width}
          style={{ aspectRatio: `${device.width} / ${device.height}` }}
        >
          <span aria-hidden="true" className="absolute -left-[3px] top-[16%] h-[8%] w-[3px] rounded-l bg-[#313136] dark:bg-[#52525b]" />
          <span aria-hidden="true" className="absolute -left-[3px] top-[26%] h-[13%] w-[3px] rounded-l bg-[#313136] dark:bg-[#52525b]" />
          <span aria-hidden="true" className="absolute -right-[3px] top-[23%] h-[17%] w-[3px] rounded-r bg-[#313136] dark:bg-[#52525b]" />

          <div
            className="relative h-full w-full overflow-hidden rounded-[clamp(1.5rem,4.3cqh,2.35rem)] bg-[#f5f5f5] dark:bg-[#111113]"
            data-testid="wechat-menu-preview"
          >
            <div className="relative flex h-[6.3%] items-center justify-between bg-[#ededed] px-[6%] pt-[1.2%] text-[clamp(0.5rem,1.5cqh,0.68rem)] font-semibold text-[#111] dark:bg-[#181818] dark:text-white">
              <span>9:41</span>
              <span aria-hidden="true" className="absolute left-1/2 top-[22%] h-[56%] w-[31%] -translate-x-1/2 rounded-full bg-black" />
              <span aria-hidden="true" className="flex items-center gap-[0.18rem]">
                <Signal className="h-[1em] w-[1em]" strokeWidth={2.5} />
                <Wifi className="h-[1em] w-[1em]" strokeWidth={2.5} />
                <BatteryFull className="h-[1.15em] w-[1.15em]" strokeWidth={2.5} />
              </span>
            </div>

            <div className="relative flex h-[5.2%] items-center justify-center border-b border-black/[0.06] bg-[#ededed] px-[13%] text-[clamp(0.62rem,1.8cqh,0.82rem)] font-medium text-[#171717] dark:border-white/[0.06] dark:bg-[#181818] dark:text-[#f4f4f5]">
              <ChevronLeft aria-hidden="true" className="absolute left-[4%] h-[48%] w-auto" strokeWidth={2} />
              <span className="max-w-full truncate">{displayName || previewTitle}</span>
              <MoreHorizontal aria-hidden="true" className="absolute right-[4%] h-[48%] w-auto" strokeWidth={2} />
            </div>

            <div className="absolute inset-x-0 bottom-[11.25%] top-[11.5%] flex items-center justify-center px-8 text-center text-[clamp(0.58rem,1.5cqh,0.72rem)] leading-5 text-[#b2b2b2] dark:text-[#71717a]">
              {buttons.length === 0 ? emptyHint : null}
            </div>

            {showSubMenu && selectedTop ? (
              <div
                className="absolute z-10 border border-[#d0d0d0] bg-white shadow-sm dark:border-[#52525b] dark:bg-[#27272a] dark:shadow-lg"
                data-testid="wechat-sub-menu"
                style={{
                  bottom: `calc(${MENU_BAR_HEIGHT_PERCENT + HOME_INDICATOR_HEIGHT_PERCENT}% + 0.5rem)`,
                  left: `${subMenuLeft + 1.25}%`,
                  width: `${menuColumnWidth - 2.5}%`,
                }}
              >
                {(selectedTop.subButtons?.length ?? 0) < CUSTOM_MENU_MAX_SUB_BUTTONS ? (
                  <button
                    aria-label={addSubMenuLabel}
                    className="flex h-[clamp(2.15rem,5cqh,2.85rem)] w-full items-center justify-center border-b border-[#e7e7e7] bg-white text-[#8a8a8a] hover:bg-[#f5f5f5] hover:text-[#07c160] dark:border-[#3f3f46] dark:bg-[#27272a] dark:text-[#a1a1aa] dark:hover:bg-[#303033] dark:hover:text-[#2bd576]"
                    onClick={() => onAddSubMenu(selectedTopIndex)}
                    title={addSubMenuLabel}
                    type="button"
                  >
                    <Plus aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
                  </button>
                ) : null}
                {(selectedTop.subButtons ?? []).map((subButton, subIndex) => {
                  const subPath = `${selectedTopIndex}.${subIndex}`;
                  const active = selectedPath === subPath;
                  return (
                    <button
                      aria-label={subButton.name || `${subMenuLabel} ${subIndex + 1}`}
                      aria-pressed={active}
                      className={`block h-[clamp(2.15rem,5cqh,2.85rem)] w-full truncate border-b border-[#e7e7e7] px-2 text-center text-[clamp(0.58rem,1.5cqh,0.72rem)] last:border-b-0 hover:bg-[#f5f5f5] dark:border-[#3f3f46] dark:hover:bg-[#303033] ${
                        active
                          ? "bg-[#f4fff8] text-[#07c160] dark:bg-[#173b28] dark:text-[#2bd576]"
                          : "bg-white text-[#353535] dark:bg-[#27272a] dark:text-[#e4e4e7]"
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
                  className="absolute -bottom-[6px] left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-[#d0d0d0] bg-white dark:border-[#52525b] dark:bg-[#27272a]"
                />
              </div>
            ) : null}

            <div className="absolute inset-x-0 bottom-[4%] flex h-[7.25%] border-t border-[#d0d0d0] bg-[#fafafa] dark:border-[#3f3f46] dark:bg-[#27272a]">
              <div className="flex w-[13.75%] shrink-0 items-center justify-center border-r border-[#d0d0d0] text-[#8a8a8a] dark:border-[#3f3f46] dark:text-[#a1a1aa]">
                <Keyboard aria-hidden="true" className="h-[34%] w-auto" strokeWidth={1.5} />
              </div>
              {buttons.map((button, index) => {
                const path = String(index);
                const active = selectedTopIndex === index;
                return (
                  <button
                    aria-label={button.name || `${topMenuLabel} ${index + 1}`}
                    aria-pressed={active}
                    className={`relative flex min-w-0 flex-1 items-center justify-center border-r border-[#d0d0d0] px-2 text-[clamp(0.55rem,1.45cqh,0.7rem)] hover:bg-white dark:border-[#3f3f46] dark:hover:bg-[#303033] ${
                      active
                        ? "z-[1] -m-px border border-[#07c160] bg-white text-[#07c160] dark:bg-[#27272a] dark:text-[#2bd576]"
                        : "bg-[#fafafa] text-[#353535] dark:bg-[#27272a] dark:text-[#e4e4e7]"
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
                  aria-label={addTopMenuLabel}
                  className="flex min-w-0 flex-1 items-center justify-center bg-[#fafafa] text-[#8a8a8a] hover:bg-white hover:text-[#07c160] dark:bg-[#27272a] dark:text-[#a1a1aa] dark:hover:bg-[#303033] dark:hover:text-[#2bd576]"
                  onClick={onAddTopMenu}
                  type="button"
                >
                  <Plus aria-hidden="true" className="h-[34%] w-auto" strokeWidth={1.5} />
                </button>
              ) : null}
            </div>

            <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[4%] bg-[#fafafa] dark:bg-[#27272a]">
              <span className="absolute bottom-[23%] left-1/2 h-[13%] w-[34%] -translate-x-1/2 rounded-full bg-black/85 dark:bg-white/85" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
