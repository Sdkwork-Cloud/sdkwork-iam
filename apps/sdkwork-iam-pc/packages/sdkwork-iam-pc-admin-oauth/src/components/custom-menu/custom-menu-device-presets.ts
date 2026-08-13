export type CustomMenuDevicePresetId = "iphone-16" | "iphone-16-pro-max" | "iphone-17-pro";

export interface CustomMenuDevicePreset {
  height: number;
  id: CustomMenuDevicePresetId;
  label: string;
  width: number;
}

/** Logical iOS viewport sizes used to validate the WeChat menu preview. */
export const CUSTOM_MENU_DEVICE_PRESETS: readonly CustomMenuDevicePreset[] = [
  { id: "iphone-16", label: "iPhone 16", width: 393, height: 852 },
  { id: "iphone-16-pro-max", label: "iPhone 16 Pro Max", width: 440, height: 956 },
  { id: "iphone-17-pro", label: "iPhone 17 Pro", width: 402, height: 874 },
];

export const DEFAULT_CUSTOM_MENU_DEVICE_ID: CustomMenuDevicePresetId = "iphone-16";

export function findCustomMenuDevicePreset(value: string): CustomMenuDevicePreset {
  return CUSTOM_MENU_DEVICE_PRESETS.find((device) => device.id === value)
    ?? CUSTOM_MENU_DEVICE_PRESETS[0];
}
