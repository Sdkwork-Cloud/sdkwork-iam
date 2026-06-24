import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SdkworkI18nProvider } from "@sdkwork/i18n-pc-react";
import {
  SDKWORK_AUTH_I18N_CATALOG,
  SdkworkPasswordField,
} from "../src";

function renderPasswordField() {
  const onChange = vi.fn();

  render(
    <SdkworkI18nProvider
      catalogs={[SDKWORK_AUTH_I18N_CATALOG]}
      locale="en-US"
    >
      <SdkworkPasswordField
        error="Password is required"
        errorId="sdkwork-auth-password-field-test-error"
        id="sdkwork-auth-password-field-test"
        label="Password"
        onChange={onChange}
        placeholder="Enter password"
        value=""
      />
    </SdkworkI18nProvider>,
  );

  return { onChange };
}

describe("SdkworkPasswordField", () => {
  it("renders password controls in fixed left, input, and right slots", () => {
    renderPasswordField();

    const input = screen.getByLabelText("Password");
    const frame = input.closest("[data-slot='password-input-frame']");
    const leadingSlot = frame?.querySelector("[data-slot='password-input-leading-slot']");
    const leadingIcon = frame?.querySelector("[data-slot='password-input-leading-icon']");
    const inputSlot = frame?.querySelector("[data-slot='password-input-control-slot']");
    const visibilitySlot = frame?.querySelector("[data-slot='password-input-visibility-slot']");
    const visibilityToggle = frame?.querySelector("[data-slot='password-input-visibility-toggle']");
    const visibilityIcon = frame?.querySelector("[data-slot='password-input-visibility-icon']");

    expect(frame).not.toBeNull();
    expect(frame).toHaveStyle({
      alignItems: "center",
      display: "grid",
      gridTemplateColumns: "2.5rem minmax(0, 1fr) 2.5rem",
      minHeight: "2.75rem",
    });
    expect(leadingSlot).toHaveStyle({
      alignItems: "center",
      display: "flex",
      height: "100%",
      justifyContent: "center",
      minWidth: "2.5rem",
    });
    expect(leadingIcon).toHaveStyle({
      display: "block",
      height: "1.25rem",
      width: "1.25rem",
    });
    expect(inputSlot).toHaveStyle({
      minWidth: "0",
    });
    expect(input).toHaveStyle({
      height: "2.75rem",
      width: "100%",
    });
    expect(input).toHaveAttribute("data-sdkwork-auth-secret-field", "true");
    expect(input).toHaveAttribute("maxLength", "64");
    expect(input.style.border).toBe("0px");
    expect(input.style.boxShadow).toBe("none");
    expect(input.style.padding).toBe("0px");
    expect(visibilitySlot).toHaveStyle({
      alignItems: "center",
      display: "flex",
      height: "100%",
      justifyContent: "center",
      minWidth: "2.5rem",
    });
    expect(visibilityToggle).toHaveStyle({
      alignItems: "center",
      display: "inline-flex",
      height: "2rem",
      justifyContent: "center",
      lineHeight: "0",
      padding: "0",
      width: "2rem",
    });
    expect(visibilityIcon).toHaveStyle({
      display: "block",
      height: "1rem",
      width: "1rem",
    });
  });

  it("toggles between password and text without losing the input value handler", () => {
    const { onChange } = renderPasswordField();

    const input = screen.getByLabelText("Password");
    const toggle = screen.getByRole("button", { name: "Show password" });

    expect(input).toHaveAttribute("type", "password");

    fireEvent.change(input, { target: { value: "sdkwork-secret" } });
    expect(onChange).toHaveBeenCalledWith("sdkwork-secret");

    fireEvent.click(toggle);
    expect(input).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Hide password" })).toBeInTheDocument();
  });
});
