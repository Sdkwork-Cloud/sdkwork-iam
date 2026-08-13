import { useEffect, useId, useRef } from "react";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  MessageSquareText,
  Smartphone,
  Trash2,
} from "lucide-react";

import {
  IconButton,
  Input,
  RadioGroup,
  RadioGroupItem,
  Textarea,
} from "@sdkwork/ui-pc-react";

import type {
  SdkworkIamOauthCustomMenuActionKind,
  SdkworkIamOauthCustomMenuButton,
} from "../../types/oauth-admin-types";
import type { SdkworkIamOauthAdminMessages } from "../../types/oauth-admin-messages";
import {
  clampCustomMenuName,
  CUSTOM_MENU_SUB_NAME_UNIT_LIMIT,
  CUSTOM_MENU_TOP_NAME_UNIT_LIMIT,
  menuNameUnitLength,
  type SdkworkIamOauthCustomMenuValidationIssue,
} from "./custom-menu-validators";

type CustomMenuMessages = SdkworkIamOauthAdminMessages["quickSetup"]["customMenus"];

export interface SdkworkIamOauthCustomMenuEditorProps {
  button: SdkworkIamOauthCustomMenuButton;
  focusRequest?: {
    kind: SdkworkIamOauthCustomMenuValidationIssue["kind"];
    requestId: number;
  };
  isSubMenu: boolean;
  issues: SdkworkIamOauthCustomMenuValidationIssue[];
  messages: CustomMenuMessages;
  moveDisabled: { down: boolean; up: boolean };
  onChangeField: (field: "message" | "url" | "appId" | "pagePath", value: string) => void;
  onChangeName: (name: string) => void;
  onChangeType: (type: SdkworkIamOauthCustomMenuActionKind) => void;
  onDelete: () => void;
  onMove: (direction: "up" | "down") => void;
}

const ACTION_OPTIONS: ReadonlyArray<{
  descriptionKey: "clickDescription" | "viewDescription" | "miniprogramDescription";
  icon: typeof MessageSquareText;
  labelKey: "click" | "view" | "miniprogram";
  type: SdkworkIamOauthCustomMenuActionKind;
}> = [
  { type: "click", labelKey: "click", descriptionKey: "clickDescription", icon: MessageSquareText },
  { type: "view", labelKey: "view", descriptionKey: "viewDescription", icon: ExternalLink },
  { type: "miniprogram", labelKey: "miniprogram", descriptionKey: "miniprogramDescription", icon: Smartphone },
];

const NAME_ISSUES = new Set(["nameRequired", "nameTooLongTop", "nameTooLongSub"]);

/** Official-account menu property panel for the currently selected node. */
export function SdkworkIamOauthCustomMenuEditor({
  button,
  focusRequest,
  isSubMenu,
  issues,
  messages,
  moveDisabled,
  onChangeField,
  onChangeName,
  onChangeType,
  onDelete,
  onMove,
}: SdkworkIamOauthCustomMenuEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fieldIdPrefix = useId();
  const fieldId = (field: string) => `${fieldIdPrefix}-${field}`;
  const nameLimit = isSubMenu ? CUSTOM_MENU_SUB_NAME_UNIT_LIMIT : CUSTOM_MENU_TOP_NAME_UNIT_LIMIT;
  const nameUnits = menuNameUnitLength(button.name);
  const nameIssue = issues.find((issue) => NAME_ISSUES.has(issue.kind));
  const actionRequired = issues.some((issue) => issue.kind === "actionRequired");
  const unsupportedAction = issues.some((issue) => issue.kind === "unsupportedAction");
  const hasSubMenus = Boolean(button.subButtons?.length);
  const nodeLabel = isSubMenu ? messages.subMenuLabel : messages.topMenuLabel;

  useEffect(() => {
    if (!focusRequest) {
      return;
    }
    const selector = validationFocusSelector(focusRequest.kind, button.type);
    const target = selector ? editorRef.current?.querySelector<HTMLElement>(selector) : undefined;
    target?.focus();
  }, [button.type, focusRequest]);

  return (
    <div
      ref={editorRef}
      className="relative flex h-full min-h-0 flex-col bg-[#f4f5f7] text-[#353535] dark:bg-[#202023] dark:text-[#e4e4e7]"
      data-testid="custom-menu-editor"
    >
      <span
        aria-hidden="true"
        className="absolute -left-2 top-9 hidden h-4 w-4 rotate-45 border-b border-l border-[#e1e1e1] bg-[#f4f5f7] lg:block dark:border-[#3f3f46] dark:bg-[#202023]"
      />

      <div className="flex min-h-14 shrink-0 items-center gap-3 border-b border-[#e1e1e1] px-5 dark:border-[#3f3f46]">
        <h3 className="min-w-0 flex-1 truncate text-sm font-medium">
          {button.name || nodeLabel}
        </h3>
        <span className="text-xs text-[#8d8d8d]">{nodeLabel}</span>
        <IconButton
          aria-label={messages.moveUp}
          className="!text-[#8d8d8d] hover:!bg-[#e9eaec] hover:!text-[#353535] dark:!text-[#a1a1aa] dark:hover:!bg-[#303033] dark:hover:!text-[#f4f4f5]"
          disabled={moveDisabled.up}
          onClick={() => onMove("up")}
          title={messages.moveUp}
          variant="ghost"
        >
          <ChevronUp aria-hidden="true" className="h-4 w-4" />
        </IconButton>
        <IconButton
          aria-label={messages.moveDown}
          className="!text-[#8d8d8d] hover:!bg-[#e9eaec] hover:!text-[#353535] dark:!text-[#a1a1aa] dark:hover:!bg-[#303033] dark:hover:!text-[#f4f4f5]"
          disabled={moveDisabled.down}
          onClick={() => onMove("down")}
          title={messages.moveDown}
          variant="ghost"
        >
          <ChevronDown aria-hidden="true" className="h-4 w-4" />
        </IconButton>
        <button
          className="inline-flex h-8 items-center gap-1.5 px-1 text-xs text-[#8d8d8d] hover:text-[#e64340] dark:text-[#a1a1aa] dark:hover:text-[#ff7875]"
          onClick={onDelete}
          title={isSubMenu ? messages.deleteSubMenu : messages.deleteMenu}
          type="button"
        >
          <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
          {isSubMenu ? messages.deleteSubMenu : messages.deleteMenu}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6">
        <div className="grid items-start gap-x-5 gap-y-2 sm:grid-cols-[5.5rem_minmax(0,1fr)]">
          <label className="pt-2 text-sm" htmlFor={fieldId("name")}>
            {messages.menuName}
          </label>
          <div className="max-w-xl">
            <div className="relative">
              <Input
                data-validation-focus="name"
                aria-describedby={fieldId("name-hint")}
                aria-invalid={Boolean(nameIssue)}
                className={`bg-white pr-16 !text-[#353535] dark:!border-[#52525b] dark:!bg-[#27272a] dark:!text-[#f4f4f5] ${nameIssue ? "border-[var(--sdk-color-state-danger)]" : ""}`}
                id={fieldId("name")}
                onChange={(event) => onChangeName(clampCustomMenuName(event.target.value, nameLimit))}
                placeholder={messages.menuNamePlaceholder}
                value={button.name}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8d8d8d] dark:text-[#a1a1aa]">
                {nameUnits}/{nameLimit}
              </span>
            </div>
            <p id={fieldId("name-hint")} className={`mt-1.5 text-xs ${nameIssue ? "text-[var(--sdk-color-state-danger)]" : "text-[#8d8d8d] dark:text-[#a1a1aa]"}`}>
              {nameIssue ? messages.validation[nameIssue.kind] : messages.nameUnitHint}
            </p>
          </div>

          {hasSubMenus ? (
            <>
              <span className="pt-2 text-sm">{messages.actionTitle}</span>
              <div className="max-w-xl border border-[#e1e1e1] bg-white px-4 py-3 text-sm text-[#8d8d8d] dark:border-[#3f3f46] dark:bg-[#27272a] dark:text-[#a1a1aa]">
                {messages.parentContentHint}
              </div>
            </>
          ) : (
            <>
              <span className="pt-2 text-sm">{messages.actionTitle}</span>
              <div className="min-w-0 max-w-3xl">
                {unsupportedAction ? (
                  <div className="mb-3 border border-[#f0c36d] bg-[#fff8e6] px-3 py-2 text-xs leading-5 text-[#8a5700] dark:border-[#7c5a23] dark:bg-[#3a2d16] dark:text-[#f0b429]">
                    {messages.unsupportedActionTemplate.replace("{type}", button.unsupportedType ?? "")}
                  </div>
                ) : null}
                <RadioGroup
                  aria-describedby={actionRequired ? fieldId("action-error") : undefined}
                  aria-label={messages.actionTitle}
                  className="grid grid-cols-1 gap-2 py-2 xl:grid-cols-3"
                  onValueChange={(value) => onChangeType(value as SdkworkIamOauthCustomMenuActionKind)}
                  value={button.type ?? ""}
                >
                  {ACTION_OPTIONS.map((option) => {
                    const id = fieldId(`action-${option.type}`);
                    const Icon = option.icon;
                    const active = button.type === option.type;
                    return (
                      <label
                        className={`relative flex min-h-[5.25rem] cursor-pointer items-start gap-3 border px-3 py-3 transition-colors ${
                          active
                            ? "border-[#07c160] bg-[#f4fff8] dark:border-[#2bd576] dark:bg-[#173b28]"
                            : "border-[#dcdcdc] bg-white hover:border-[#a8a8a8] hover:bg-[#fafafa] dark:border-[#52525b] dark:bg-[#27272a] dark:hover:border-[#71717a] dark:hover:bg-[#303033]"
                        }`}
                        htmlFor={id}
                        key={option.type}
                      >
                        <RadioGroupItem
                          aria-label={messages.actionTypes[option.labelKey]}
                          className="mt-0.5 shrink-0 border-[#c9c9c9] !bg-white text-[#07c160] dark:border-[#71717a] dark:!bg-[#27272a] dark:text-[#2bd576]"
                          data-validation-focus={option.type === ACTION_OPTIONS[0].type ? "action" : undefined}
                          id={id}
                          value={option.type}
                        />
                        <span className="min-w-0">
                          <span className="flex items-center gap-1.5 text-sm font-medium text-[#353535] dark:text-[#f4f4f5]">
                            <Icon aria-hidden="true" className={`h-4 w-4 shrink-0 ${active ? "text-[#07c160] dark:text-[#2bd576]" : "text-[#8d8d8d] dark:text-[#a1a1aa]"}`} />
                            {messages.actionTypes[option.labelKey]}
                          </span>
                          <span className="mt-1 block text-xs leading-5 text-[#8d8d8d] dark:text-[#a1a1aa]">
                            {messages.actionTypes[option.descriptionKey]}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </RadioGroup>
                {actionRequired ? (
                  <p id={fieldId("action-error")} className="mt-1 text-xs text-[var(--sdk-color-state-danger)]">
                    {messages.validation.actionRequired}
                  </p>
                ) : null}
              </div>

              <span />
              <ActionContentEditor
                button={button}
                fieldId={fieldId}
                issues={issues}
                messages={messages}
                onChangeField={onChangeField}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ActionContentEditor({
  button,
  fieldId,
  issues,
  messages,
  onChangeField,
}: Pick<SdkworkIamOauthCustomMenuEditorProps, "button" | "issues" | "messages" | "onChangeField"> & {
  fieldId: (field: string) => string;
}) {
  if (!button.type) {
    return <p className="max-w-3xl text-xs text-[#8d8d8d] dark:text-[#a1a1aa]">{messages.actionUnsetHint}</p>;
  }

  return (
    <div className="max-w-3xl border border-[#e1e1e1] bg-white p-5 dark:border-[#3f3f46] dark:bg-[#27272a]">
      {button.type === "click" ? (
        <div className="space-y-2">
          <label className="block text-sm" htmlFor={fieldId("message")}>{messages.messageLabel}</label>
          <Textarea
            data-validation-focus="message"
            aria-describedby={fieldId("message-hint")}
            aria-invalid={issues.some((issue) => issue.kind === "messageRequired" || issue.kind === "messageTooLong")}
            className="min-h-32 bg-white !text-[#353535] dark:!border-[#52525b] dark:!bg-[#202023] dark:!text-[#f4f4f5]"
            id={fieldId("message")}
            onChange={(event) => onChangeField("message", event.target.value)}
            placeholder={messages.messagePlaceholder}
            value={button.message ?? ""}
          />
          <FieldHint
            error={issues.some((issue) => issue.kind === "messageTooLong")
              ? messages.validation.messageTooLong
              : issues.some((issue) => issue.kind === "messageRequired")
                ? messages.validation.messageRequired
                : undefined}
            hint={messages.messageHint}
            id={fieldId("message-hint")}
          />
        </div>
      ) : null}

      {button.type === "view" ? (
        <div className="space-y-2">
          <label className="block text-sm" htmlFor={fieldId("url")}>{messages.urlLabel}</label>
          <Input
            data-validation-focus="url"
            aria-describedby={fieldId("url-hint")}
            aria-invalid={issues.some((issue) => issue.kind === "urlRequired" || issue.kind === "urlInvalid" || issue.kind === "urlTooLong")}
            className="bg-white !text-[#353535] dark:!border-[#52525b] dark:!bg-[#202023] dark:!text-[#f4f4f5]"
            id={fieldId("url")}
            onChange={(event) => onChangeField("url", event.target.value)}
            placeholder={messages.urlPlaceholder}
            type="url"
            value={button.url ?? ""}
          />
          <FieldHint
            error={issues.some((issue) => issue.kind === "urlTooLong")
              ? messages.validation.urlTooLong
              : issues.some((issue) => issue.kind === "urlInvalid")
              ? messages.validation.urlInvalid
              : issues.some((issue) => issue.kind === "urlRequired")
                ? messages.validation.urlRequired
                : undefined}
            hint={messages.actionTypes.viewDescription}
            id={fieldId("url-hint")}
          />
        </div>
      ) : null}

      {button.type === "miniprogram" ? (
        <div className="space-y-5">
          <p className="text-xs text-[#8d8d8d] dark:text-[#a1a1aa]">{messages.actionTypes.miniprogramDescription}</p>
          <div className="space-y-2">
            <label className="block text-sm" htmlFor={fieldId("appid")}>{messages.appIdLabel}</label>
            <Input
              data-validation-focus="appId"
              aria-describedby={issues.some((issue) => issue.kind === "appIdRequired") ? fieldId("appid-hint") : undefined}
              aria-invalid={issues.some((issue) => issue.kind === "appIdRequired")}
              className="bg-white !text-[#353535] dark:!border-[#52525b] dark:!bg-[#202023] dark:!text-[#f4f4f5]"
              id={fieldId("appid")}
              onChange={(event) => onChangeField("appId", event.target.value)}
              placeholder={messages.appIdPlaceholder}
              value={button.appId ?? ""}
            />
            {issues.some((issue) => issue.kind === "appIdRequired") ? (
              <p id={fieldId("appid-hint")} className="text-xs text-[var(--sdk-color-state-danger)]">{messages.validation.appIdRequired}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <label className="block text-sm" htmlFor={fieldId("pagepath")}>{messages.pagePathLabel}</label>
            <Input
              data-validation-focus="pagePath"
              aria-describedby={issues.some((issue) => issue.kind === "pagePathRequired") ? fieldId("pagepath-hint") : undefined}
              aria-invalid={issues.some((issue) => issue.kind === "pagePathRequired")}
              className="bg-white !text-[#353535] dark:!border-[#52525b] dark:!bg-[#202023] dark:!text-[#f4f4f5]"
              id={fieldId("pagepath")}
              onChange={(event) => onChangeField("pagePath", event.target.value)}
              placeholder={messages.pagePathPlaceholder}
              value={button.pagePath ?? ""}
            />
            {issues.some((issue) => issue.kind === "pagePathRequired") ? (
              <p id={fieldId("pagepath-hint")} className="text-xs text-[var(--sdk-color-state-danger)]">{messages.validation.pagePathRequired}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <label className="block text-sm" htmlFor={fieldId("fallback-url")}>{messages.fallbackUrlLabel}</label>
            <Input
              data-validation-focus="fallbackUrl"
              aria-describedby={fieldId("fallback-url-hint")}
              aria-invalid={issues.some((issue) => issue.kind === "urlRequired" || issue.kind === "urlInvalid" || issue.kind === "urlTooLong")}
              className="bg-white !text-[#353535] dark:!border-[#52525b] dark:!bg-[#202023] dark:!text-[#f4f4f5]"
              id={fieldId("fallback-url")}
              onChange={(event) => onChangeField("url", event.target.value)}
              placeholder={messages.fallbackUrlPlaceholder}
              type="url"
              value={button.url ?? ""}
            />
            <FieldHint
              error={issues.some((issue) => issue.kind === "urlTooLong")
                ? messages.validation.urlTooLong
                : issues.some((issue) => issue.kind === "urlInvalid")
                ? messages.validation.urlInvalid
                : issues.some((issue) => issue.kind === "urlRequired")
                  ? messages.validation.urlRequired
                  : undefined}
              hint={messages.fallbackUrlHint}
              id={fieldId("fallback-url-hint")}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FieldHint({ error, hint, id }: { error?: string; hint: string; id?: string }) {
  return <p id={id} className={`text-xs ${error ? "text-[var(--sdk-color-state-danger)]" : "text-[#8d8d8d] dark:text-[#a1a1aa]"}`}>{error ?? hint}</p>;
}

function validationFocusSelector(
  kind: SdkworkIamOauthCustomMenuValidationIssue["kind"],
  actionType?: SdkworkIamOauthCustomMenuActionKind,
): string | undefined {
  switch (kind) {
    case "nameRequired":
    case "nameTooLongTop":
    case "nameTooLongSub":
      return '[data-validation-focus="name"]';
    case "actionRequired":
    case "unsupportedAction":
      return '[data-validation-focus="action"]';
    case "messageRequired":
    case "messageTooLong":
      return '[data-validation-focus="message"]';
    case "urlRequired":
    case "urlInvalid":
    case "urlTooLong":
      return actionType === "miniprogram"
        ? '[data-validation-focus="fallbackUrl"]'
        : '[data-validation-focus="url"]';
    case "appIdRequired":
      return '[data-validation-focus="appId"]';
    case "pagePathRequired":
      return '[data-validation-focus="pagePath"]';
    default:
      return undefined;
  }
}
