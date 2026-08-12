import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Info } from "lucide-react";

import { Button, IconButton, StatusNotice } from "@sdkwork/ui-pc-react";

import type {
  SdkworkIamOauthCustomMenuActionKind,
  SdkworkIamOauthCustomMenuButton,
  SdkworkIamOauthCustomMenuContext,
  SdkworkIamOauthCustomMenuDraft,
} from "../../types/oauth-admin-types";
import type { SdkworkIamOauthAdminMessages } from "../../types/oauth-admin-messages";
import {
  CUSTOM_MENU_MAX_SUB_BUTTONS,
  CUSTOM_MENU_MAX_TOP_BUTTONS,
  createCustomMenuKey,
  validateCustomMenuDraft,
  type SdkworkIamOauthCustomMenuValidationIssue,
} from "./custom-menu-validators";
import { SdkworkIamOauthCustomMenuEditor } from "./custom-menu-editor";
import { SdkworkIamOauthCustomMenuPhonePreview } from "./custom-menu-phone-preview";

type CustomMenuMessages = SdkworkIamOauthAdminMessages["quickSetup"]["customMenus"];

export interface SdkworkIamOauthCustomMenuManagementSectionProps {
  busy: boolean;
  context?: SdkworkIamOauthCustomMenuContext;
  messages: CustomMenuMessages;
  onBack?: () => void;
  onPublish: (draft: SdkworkIamOauthCustomMenuDraft) => void;
  onSaveDraft: (draft: SdkworkIamOauthCustomMenuDraft) => void;
}

type MenuPath = string;

interface DeleteResult {
  draft: SdkworkIamOauthCustomMenuDraft;
  nextSelection: MenuPath;
}

/**
 * Full custom menu management surface: header actions (save draft / save &
 * publish), the phone simulator on the left and the editor panel on the
 * right. Owns the editable draft tree and selection; persistence is delegated
 * to the page through `onSaveDraft` / `onPublish`.
 */
export function SdkworkIamOauthCustomMenuManagementSection({
  busy,
  context,
  messages,
  onBack,
  onPublish,
  onSaveDraft,
}: SdkworkIamOauthCustomMenuManagementSectionProps) {
  const [draft, setDraft] = useState<SdkworkIamOauthCustomMenuDraft | undefined>(context?.draft);
  const [selectedPath, setSelectedPath] = useState<MenuPath>("");
  const [validationBanner, setValidationBanner] = useState<string | undefined>();
  const draftAdopted = useRef(false);

  // The draft arrives asynchronously through the page's load; adopt it once,
  // keeping any edits made while the load was in flight, and select the first
  // top-level menu like the MP console does on open.
  useEffect(() => {
    if (context && !draftAdopted.current) {
      draftAdopted.current = true;
      setDraft(context.draft);
      if (context.draft.buttons.length > 0) {
        setSelectedPath("0");
      }
    }
  }, [context]);

  const issues = useMemo(() => (draft ? validateCustomMenuDraft(draft) : []), [draft]);

  const buttons = draft?.buttons ?? [];
  const selected = draft ? findButtonAtPath(buttons, selectedPath) : undefined;
  const selectedIsSub = selectedPath.includes(".");

  const commit = (nextButtons: SdkworkIamOauthCustomMenuButton[]) => {
    setDraft({ buttons: nextButtons, updatedAt: draft?.updatedAt });
    setValidationBanner(undefined);
  };

  const handleAddTopMenu = () => {
    if (buttons.length >= CUSTOM_MENU_MAX_TOP_BUTTONS) {
      return;
    }
    const next = [...buttons, { key: createCustomMenuKey(), name: "" }];
    commit(next);
    setSelectedPath(String(next.length - 1));
  };

  const handleAddSubMenu = () => {
    if (!selectedPath || selectedIsSub || !selected || (selected.subButtons?.length ?? 0) >= CUSTOM_MENU_MAX_SUB_BUTTONS) {
      return;
    }
    const subButton: SdkworkIamOauthCustomMenuButton = { key: createCustomMenuKey(), name: "" };
    commit(mutateAtPath(buttons, selectedPath, (button) => ({
      ...button,
      // A parent with sub-menus is display-only; drop any action it carried.
      type: undefined,
      url: undefined,
      appId: undefined,
      pagePath: undefined,
      message: undefined,
      subButtons: [...(button.subButtons ?? []), subButton],
    })));
    setSelectedPath(`${selectedPath}.${(selected.subButtons?.length ?? 0)}`);
  };

  const handleDelete = (): MenuPath => {
    const result = deleteAtPath(buttons, selectedPath);
    commit(result.draft.buttons);
    setSelectedPath(result.nextSelection);
    return result.nextSelection;
  };

  const handleMove = (direction: "up" | "down") => {
    if (!selectedPath) {
      return;
    }
    const moved = moveAtPath(buttons, selectedPath, direction);
    commit(moved);
    // Keep the selection on the moved button; `moveAtPath` returns the same
    // reference when no swap happened (already at the edge).
    if (moved !== buttons) {
      setSelectedPath(shiftSelectionPath(selectedPath, direction));
    }
  };

  const handleSaveDraft = () => {
    if (!draft) {
      return;
    }
    setValidationBanner(undefined);
    onSaveDraft(draft);
  };

  const handlePublish = () => {
    if (!draft) {
      return;
    }
    if (issues.length > 0) {
      const first = issues[0];
      setValidationBanner(first.path !== "" ? first.kind : first.kind === "tooManyTop" ? "tooManyTop" : "atLeastOneTop");
      return;
    }
    setValidationBanner(undefined);
    onPublish(draft);
  };

  const issueText = (kind: SdkworkIamOauthCustomMenuValidationIssue["kind"]): string =>
    messages.validation[kind];
  const selectedIssues = selected && selectedPath
    ? issues.filter((issue) => issue.path === selectedPath || (issue.path !== "" && issue.path.startsWith(`${selectedPath}.`)))
    : [];

  const moveDisabled = !selectedPath || !selected
    ? { up: true, down: true }
    : selectedIsSub
      ? { up: isFirstAtLevel(selectedPath), down: isLastAtLevel(buttons, selectedPath) }
      : {
          up: selectedPath === "0",
          down: selectedPath === String(buttons.length - 1),
        };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 bg-[var(--sdk-color-surface-panel)]">
      {/* Page header */}
      <div className="flex flex-wrap items-center gap-3">
        {onBack ? (
          <IconButton aria-label={messages.back} onClick={onBack} title={messages.back} variant="ghost">
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          </IconButton>
        ) : null}
        <div className="min-w-0 flex-1">
          <h2 id="sdkwork-iam-custom-menu-dialog-title" className="truncate text-lg font-semibold text-[var(--sdk-color-text-primary)]">
            {messages.title}
            {context?.displayName ? <span className="ml-2 text-sm font-normal text-[var(--sdk-color-text-secondary)]">{context.displayName}</span> : null}
          </h2>
          <p className="mt-0.5 truncate text-xs text-[var(--sdk-color-text-secondary)]">{messages.description}</p>
        </div>
        <Button disabled={busy} onClick={handleSaveDraft} type="button" variant="secondary">
          {messages.saveDraft}
        </Button>
        <Button disabled={busy} onClick={handlePublish} type="button" variant="primary">
          {messages.saveAndPublish}
        </Button>
      </div>

      {validationBanner ? (
        <StatusNotice tone="warning">
          {validationBanner === "atLeastOneTop" ? messages.validation.atLeastOneTop : issueText(validationBanner as SdkworkIamOauthCustomMenuValidationIssue["kind"])}
        </StatusNotice>
      ) : null}

      {!draft ? (
        <div className="flex min-h-0 flex-1 items-center justify-center text-sm text-[var(--sdk-color-text-secondary)]">
          {messages.loading}
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 overflow-y-auto lg:grid-cols-[minmax(320px,400px)_minmax(0,1fr)] lg:overflow-hidden">
          {/* Left: phone simulator */}
          <div className="flex min-h-[560px] min-w-0 justify-center overflow-x-auto">
            <SdkworkIamOauthCustomMenuPhonePreview
              buttons={buttons}
              displayName={context?.displayName ?? ""}
              emptyHint={messages.phoneEmptyHint}
              onAddTopMenu={handleAddTopMenu}
              onSelect={setSelectedPath}
              previewTitle={messages.phonePreviewTitle}
              selectedPath={selectedPath}
            />
          </div>

          {/* Right: editor */}
          <div className="flex min-h-[28rem] min-w-0 flex-1 flex-col rounded border border-[var(--sdk-color-border-default)] bg-[var(--sdk-color-surface-panel)] p-5 lg:min-h-0">
            {selected ? (
              <SdkworkIamOauthCustomMenuEditor
                button={selected}
                isSubMenu={selectedIsSub}
                issues={selectedIssues}
                messages={messages}
                moveDisabled={moveDisabled}
                onAddSubMenu={handleAddSubMenu}
                onChangeField={(field, value) => commit(mutateAtPath(buttons, selectedPath, (button) => ({ ...button, [field]: value })))}
                onChangeName={(name) => commit(mutateAtPath(buttons, selectedPath, (button) => ({ ...button, name })))}
                onChangeType={(type) => commit(mutateAtPath(buttons, selectedPath, (button) => setActionType(button, type)))}
                onDelete={handleDelete}
                onDeleteSubMenu={(subIndex) => {
                  commit(mutateAtPath(buttons, selectedPath, (button) => ({
                    ...button,
                    subButtons: (button.subButtons ?? []).filter((_, index) => index !== subIndex),
                  })));
                }}
                onMove={handleMove}
                onSelectSubMenu={(subIndex) => setSelectedPath(`${selectedPath}.${subIndex}`)}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-[var(--sdk-color-text-tertiary)]">
                {messages.selectHint}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rules footer */}
      {draft ? (
        <div className="flex items-start gap-2 rounded bg-[var(--sdk-color-surface-panel-muted)] px-3.5 py-2.5 text-xs text-[var(--sdk-color-text-secondary)]">
          <Info aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>
            <span className="font-medium text-[var(--sdk-color-text-primary)]">{messages.rules}：</span>
            {messages.rulesText}{messages.rulesText2}
          </p>
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------ tree helpers ------------------------------ */

function findButtonAtPath(buttons: SdkworkIamOauthCustomMenuButton[], path: MenuPath): SdkworkIamOauthCustomMenuButton | undefined {
  const [topIndex, subIndex] = path.split(".").map(Number);
  const top = buttons[topIndex];
  if (!top || subIndex === undefined) {
    return top;
  }
  return top.subButtons?.[subIndex];
}

function mutateAtPath(
  buttons: SdkworkIamOauthCustomMenuButton[],
  path: MenuPath,
  mutate: (button: SdkworkIamOauthCustomMenuButton) => SdkworkIamOauthCustomMenuButton,
): SdkworkIamOauthCustomMenuButton[] {
  const [topIndex, subIndex] = path.split(".").map(Number);
  return buttons.map((button, index) => {
    if (index !== topIndex) {
      return button;
    }
    if (subIndex === undefined) {
      return mutate(button);
    }
    return {
      ...button,
      subButtons: (button.subButtons ?? []).map((subButton, subIdx) =>
        subIdx === subIndex ? mutate(subButton) : subButton),
    };
  });
}

function deleteAtPath(buttons: SdkworkIamOauthCustomMenuButton[], path: MenuPath): DeleteResult {
  const [topIndex, subIndex] = path.split(".").map(Number);
  if (subIndex === undefined) {
    const next = buttons.filter((_, index) => index !== topIndex);
    const nextSelection = next.length === 0
      ? ""
      : String(Math.min(topIndex, next.length - 1));
    return { draft: { buttons: next }, nextSelection };
  }
  const next = buttons.map((button, index) =>
    index === topIndex
      ? { ...button, subButtons: (button.subButtons ?? []).filter((_, subIdx) => subIdx !== subIndex) }
      : button);
  return { draft: { buttons: next }, nextSelection: String(topIndex) };
}

function moveAtPath(buttons: SdkworkIamOauthCustomMenuButton[], path: MenuPath, direction: "up" | "down"): SdkworkIamOauthCustomMenuButton[] {
  const [topIndex, subIndex] = path.split(".").map(Number);
  if (subIndex === undefined) {
    const swapped = swapIndex(buttons, topIndex, direction);
    return swapped.length === buttons.length ? swapped : buttons;
  }
  return buttons.map((button, index) => {
    if (index !== topIndex) {
      return button;
    }
    const subs = button.subButtons ?? [];
    const swapped = swapIndex(subs, subIndex, direction);
    return swapped.length === subs.length ? { ...button, subButtons: swapped } : button;
  });
}

function swapIndex<T>(items: T[], index: number, direction: "up" | "down"): T[] {
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= items.length) {
    return items;
  }
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

function setActionType(button: SdkworkIamOauthCustomMenuButton, type: SdkworkIamOauthCustomMenuActionKind): SdkworkIamOauthCustomMenuButton {
  return {
    ...button,
    type,
    // Selecting a new action resets the fields of every other action kind.
    ...(type === "click" ? { message: button.message } : { message: undefined }),
    ...(type === "view" ? { url: button.url } : { url: undefined }),
    ...(type === "miniprogram" ? { appId: button.appId, pagePath: button.pagePath } : { appId: undefined, pagePath: undefined }),
  };
}

function isFirstAtLevel(path: MenuPath): boolean {
  return path.endsWith(".0");
}

function isLastAtLevel(buttons: SdkworkIamOauthCustomMenuButton[], path: MenuPath): boolean {
  const [topIndex, subIndex] = path.split(".").map(Number);
  return subIndex === (buttons[topIndex]?.subButtons?.length ?? 1) - 1;
}

/**
 * Path of the button after a successful move: the same button lives one slot
 * up/down, so the selection follows it instead of pointing at the neighbor.
 */
function shiftSelectionPath(path: MenuPath, direction: "up" | "down"): MenuPath {
  const [topIndex, subIndex] = path.split(".").map(Number);
  const shift = direction === "up" ? -1 : 1;
  return subIndex === undefined ? String(topIndex + shift) : `${topIndex}.${subIndex + shift}`;
}
