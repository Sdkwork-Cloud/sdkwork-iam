import { ChevronDown, ChevronUp, ExternalLink, Plus, Send, Smartphone, Trash2 } from "lucide-react";

import { Button, IconButton, Input, Textarea } from "@sdkwork/ui-pc-react";

import type {
  SdkworkIamOauthCustomMenuActionKind,
  SdkworkIamOauthCustomMenuButton,
} from "../../types/oauth-admin-types";
import type { SdkworkIamOauthAdminMessages } from "../../types/oauth-admin-messages";
import {
  menuNameUnitLength,
  CUSTOM_MENU_SUB_NAME_UNIT_LIMIT,
  CUSTOM_MENU_TOP_NAME_UNIT_LIMIT,
  type SdkworkIamOauthCustomMenuValidationIssue,
} from "./custom-menu-validators";

type CustomMenuMessages = SdkworkIamOauthAdminMessages["quickSetup"]["customMenus"];

export interface SdkworkIamOauthCustomMenuEditorProps {
  button: SdkworkIamOauthCustomMenuButton;
  isSubMenu: boolean;
  issues: SdkworkIamOauthCustomMenuValidationIssue[];
  messages: CustomMenuMessages;
  moveDisabled: { down: boolean; up: boolean };
  onAddSubMenu: () => void;
  onChangeField: (field: "message" | "url" | "appId" | "pagePath", value: string) => void;
  onChangeName: (name: string) => void;
  onChangeType: (type: SdkworkIamOauthCustomMenuActionKind) => void;
  onDelete: () => void;
  onDeleteSubMenu: (subIndex: number) => void;
  onMove: (direction: "up" | "down") => void;
  onSelectSubMenu: (subIndex: number) => void;
}

const ACTION_OPTIONS: ReadonlyArray<{
  descriptionKey: "clickDescription" | "viewDescription" | "miniprogramDescription";
  icon: typeof Send;
  labelKey: "click" | "view" | "miniprogram";
  type: SdkworkIamOauthCustomMenuActionKind;
}> = [
  { type: "click", labelKey: "click", descriptionKey: "clickDescription", icon: Send },
  { type: "view", labelKey: "view", descriptionKey: "viewDescription", icon: ExternalLink },
  { type: "miniprogram", labelKey: "miniprogram", descriptionKey: "miniprogramDescription", icon: Smartphone },
];

const VALIDATION_ISSUE_KEYS: Record<string, true> = {
  nameRequired: true,
  nameTooLongTop: true,
  nameTooLongSub: true,
};

/**
 * Right-hand editor panel of the custom menu manager. Edits the selected
 * button: menu name (with the WeChat unit counter), sub-menu management for
 * parent buttons, and the action type + fields for leaf buttons.
 */
export function SdkworkIamOauthCustomMenuEditor({
  button,
  isSubMenu,
  issues,
  messages,
  moveDisabled,
  onAddSubMenu,
  onChangeField,
  onChangeName,
  onChangeType,
  onDelete,
  onDeleteSubMenu,
  onMove,
  onSelectSubMenu,
}: SdkworkIamOauthCustomMenuEditorProps) {
  const nameLimit = isSubMenu ? CUSTOM_MENU_SUB_NAME_UNIT_LIMIT : CUSTOM_MENU_TOP_NAME_UNIT_LIMIT;
  const nameUnits = menuNameUnitLength(button.name);
  const nameOverLimit = nameUnits > nameLimit;
  const nameIssue = issues.find((issue) => VALIDATION_ISSUE_KEYS[issue.kind]);
  const actionIssues = issues.filter((issue) => issue.kind !== "nameRequired" && issue.kind !== "nameTooLongTop" && issue.kind !== "nameTooLongSub");
  const hasSubs = Boolean(button.subButtons && button.subButtons.length > 0);

  return (
    <div className="flex h-full min-h-0 flex-col gap-5 overflow-y-auto p-1">
      {/* Header row: level tag + move + delete */}
      <div className="flex items-center gap-1.5">
        <span className="rounded-md bg-[var(--sdk-color-brand-primary-soft)] px-2 py-0.5 text-xs font-medium text-[var(--sdk-color-brand-primary)]">
          {isSubMenu ? messages.addSubMenu : messages.addTopMenu}
        </span>
        <span className="flex-1" />
        <IconButton
          aria-label={messages.moveUp}
          disabled={moveDisabled.up}
          onClick={() => onMove("up")}
          title={messages.moveUp}
          variant="ghost"
        >
          <ChevronUp aria-hidden="true" className="h-4 w-4" />
        </IconButton>
        <IconButton
          aria-label={messages.moveDown}
          disabled={moveDisabled.down}
          onClick={() => onMove("down")}
          title={messages.moveDown}
          variant="ghost"
        >
          <ChevronDown aria-hidden="true" className="h-4 w-4" />
        </IconButton>
        <IconButton
          aria-label={isSubMenu ? messages.deleteSubMenu : messages.deleteMenu}
          onClick={onDelete}
          title={isSubMenu ? messages.deleteSubMenu : messages.deleteMenu}
          variant="ghost"
        >
          <Trash2 aria-hidden="true" className="h-4 w-4" />
        </IconButton>
      </div>

      {/* Menu name */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[var(--sdk-color-text-primary)]" htmlFor="custom-menu-name">
          {messages.menuName}
        </label>
        <div className="relative">
          <Input
            aria-invalid={Boolean(nameIssue)}
            className={nameIssue ? "pr-20 border-[var(--sdk-color-state-danger)]" : "pr-20"}
            id="custom-menu-name"
            maxLength={nameLimit}
            onChange={(event) => onChangeName(event.target.value)}
            placeholder={messages.menuNamePlaceholder}
            value={button.name}
          />
          <span className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs ${nameOverLimit ? "text-[var(--sdk-color-state-danger)]" : "text-[var(--sdk-color-text-tertiary)]"}`}>
            {nameUnits}/{nameLimit}
          </span>
        </div>
        {nameIssue ? (
          <p className="text-xs text-[var(--sdk-color-state-danger)]">
            {messages.validation[nameIssue.kind]}
          </p>
        ) : (
          <p className="text-xs text-[var(--sdk-color-text-tertiary)]">{messages.nameUnitHint}</p>
        )}
      </div>

      {/* Parent button: sub-menu management */}
      {hasSubs ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-[var(--sdk-color-text-primary)]">
            {messages.addSubMenu}
            <span className="ml-1 text-xs font-normal text-[var(--sdk-color-text-tertiary)]">
              {button.subButtons!.length}/5
            </span>
          </p>
          <div className="flex flex-col gap-1.5">
            {button.subButtons!.map((subButton, subIndex) => (
              <div
                className="group flex items-center gap-2 rounded-lg border border-[var(--sdk-color-border-default)] bg-[var(--sdk-color-surface-base)] px-3 py-2"
                key={subButton.key}
              >
                <button
                  className="min-w-0 flex-1 truncate text-left text-sm text-[var(--sdk-color-text-primary)] hover:text-[var(--sdk-color-brand-primary)]"
                  onClick={() => onSelectSubMenu(subIndex)}
                  type="button"
                >
                  {subButton.name || "…"}
                </button>
                <IconButton
                  aria-label={messages.deleteSubMenu}
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => onDeleteSubMenu(subIndex)}
                  title={messages.deleteSubMenu}
                  variant="ghost"
                >
                  <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                </IconButton>
              </div>
            ))}
          </div>
          {button.subButtons!.length < 5 ? (
            <Button className="self-start" onClick={onAddSubMenu} size="sm" type="button" variant="outline">
              <Plus aria-hidden="true" className="h-4 w-4" />
              {messages.addSubMenu}
            </Button>
          ) : null}
        </div>
      ) : (
        /* Leaf button: action configuration */
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-medium text-[var(--sdk-color-text-primary)]">{messages.actionTitle}</p>
            {issues.some((issue) => issue.kind === "actionRequired") ? (
              <p className="text-xs text-[var(--sdk-color-state-danger)]">
                {messages.validation.actionRequired}
              </p>
            ) : null}
          </div>
          <div className="grid grid-cols-1 gap-2">
            {ACTION_OPTIONS.map((option) => {
              const Icon = option.icon;
              const selected = button.type === option.type;
              return (
                <button
                  aria-pressed={selected}
                  className={`flex items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors ${
                    selected
                      ? "border-[var(--sdk-color-brand-primary)] bg-[var(--sdk-color-brand-primary-soft)]"
                      : "border-[var(--sdk-color-border-default)] bg-[var(--sdk-color-surface-base)] hover:bg-[var(--sdk-color-surface-panel-muted)]"
                  }`}
                  key={option.type}
                  onClick={() => onChangeType(option.type)}
                  type="button"
                >
                  <Icon aria-hidden="true" className={`mt-0.5 h-4 w-4 shrink-0 ${selected ? "text-[var(--sdk-color-brand-primary)]" : "text-[var(--sdk-color-text-secondary)]"}`} />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-[var(--sdk-color-text-primary)]">
                      {messages.actionTypes[option.labelKey]}
                    </span>
                    <span className="block text-xs text-[var(--sdk-color-text-secondary)]">
                      {messages.actionTypes[option.descriptionKey]}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {button.type ? (
            <div className="flex flex-col gap-4 rounded-xl border border-[var(--sdk-color-border-default)] bg-[var(--sdk-color-surface-base)] p-3.5">
              {button.type === "click" ? (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[var(--sdk-color-text-primary)]" htmlFor="custom-menu-message">
                    {messages.messageLabel}
                  </label>
                  <Textarea
                    aria-invalid={issues.some((issue) => issue.kind === "messageRequired")}
                    className="min-h-24"
                    id="custom-menu-message"
                    onChange={(event) => onChangeField("message", event.target.value)}
                    placeholder={messages.messagePlaceholder}
                    value={button.message ?? ""}
                  />
                  <p className="text-xs text-[var(--sdk-color-text-tertiary)]">{messages.messageHint}</p>
                  {issues.some((issue) => issue.kind === "messageRequired") ? (
                    <p className="text-xs text-[var(--sdk-color-state-danger)]">{messages.validation.messageRequired}</p>
                  ) : null}
                </div>
              ) : null}
              {button.type === "view" ? (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[var(--sdk-color-text-primary)]" htmlFor="custom-menu-url">
                    {messages.urlLabel}
                  </label>
                  <Input
                    aria-invalid={issues.some((issue) => issue.kind === "urlRequired" || issue.kind === "urlInvalid")}
                    id="custom-menu-url"
                    onChange={(event) => onChangeField("url", event.target.value)}
                    placeholder={messages.urlPlaceholder}
                    type="url"
                    value={button.url ?? ""}
                  />
                  {["urlRequired", "urlInvalid"].some((kind) => issues.some((issue) => issue.kind === kind)) ? (
                    <p className="text-xs text-[var(--sdk-color-state-danger)]">
                      {issues.some((issue) => issue.kind === "urlInvalid")
                        ? messages.validation.urlInvalid
                        : messages.validation.urlRequired}
                    </p>
                  ) : null}
                </div>
              ) : null}
              {button.type === "miniprogram" ? (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-[var(--sdk-color-text-primary)]" htmlFor="custom-menu-appid">
                      {messages.appIdLabel}
                    </label>
                    <Input
                      aria-invalid={issues.some((issue) => issue.kind === "appIdRequired")}
                      id="custom-menu-appid"
                      onChange={(event) => onChangeField("appId", event.target.value)}
                      placeholder={messages.appIdPlaceholder}
                      value={button.appId ?? ""}
                    />
                    {issues.some((issue) => issue.kind === "appIdRequired") ? (
                      <p className="text-xs text-[var(--sdk-color-state-danger)]">{messages.validation.appIdRequired}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-[var(--sdk-color-text-primary)]" htmlFor="custom-menu-pagepath">
                      {messages.pagePathLabel}
                    </label>
                    <Input
                      aria-invalid={issues.some((issue) => issue.kind === "pagePathRequired")}
                      id="custom-menu-pagepath"
                      onChange={(event) => onChangeField("pagePath", event.target.value)}
                      placeholder={messages.pagePathPlaceholder}
                      value={button.pagePath ?? ""}
                    />
                    {issues.some((issue) => issue.kind === "pagePathRequired") ? (
                      <p className="text-xs text-[var(--sdk-color-state-danger)]">{messages.validation.pagePathRequired}</p>
                    ) : null}
                  </div>
                </>
              ) : null}
            </div>
          ) : (
            <p className="text-xs text-[var(--sdk-color-text-tertiary)]">{messages.actionUnsetHint}</p>
          )}
          {actionIssues.length > 0 && button.type === undefined ? (
            <p className="text-xs text-[var(--sdk-color-state-danger)]">{messages.validation.actionRequired}</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
