import { useEffect, useMemo, useRef, useState } from "react";
import { CircleAlert, Info, Redo2, Undo2, X } from "lucide-react";

import {
  Button,
  IconButton,
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  StatusNotice,
} from "@sdkwork/ui-pc-react";

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
  busy?: "saving" | "publishing";
  context?: SdkworkIamOauthCustomMenuContext;
  messages: CustomMenuMessages;
  onDirtyChange?: (dirty: boolean) => void;
  onClose?: () => void;
  onPublish: (draft: SdkworkIamOauthCustomMenuDraft) => Promise<SdkworkIamOauthCustomMenuDraft | undefined>;
  onSaveDraft: (draft: SdkworkIamOauthCustomMenuDraft) => Promise<SdkworkIamOauthCustomMenuDraft | undefined>;
}

type MenuPath = string;
const CUSTOM_MENU_HISTORY_LIMIT = 100;

interface CustomMenuDraftHistory {
  entries: SdkworkIamOauthCustomMenuDraft[];
  index: number;
}

interface CustomMenuFocusRequest {
  kind: SdkworkIamOauthCustomMenuValidationIssue["kind"];
  requestId: number;
}

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
  onDirtyChange,
  onClose,
  onPublish,
  onSaveDraft,
}: SdkworkIamOauthCustomMenuManagementSectionProps) {
  const [draftHistory, setDraftHistory] = useState<CustomMenuDraftHistory>({ entries: [], index: -1 });
  const [savedFingerprint, setSavedFingerprint] = useState("");
  const [selectedPath, setSelectedPath] = useState<MenuPath>("");
  const [validationBanner, setValidationBanner] = useState<string | undefined>();
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [publishConfirmationOpen, setPublishConfirmationOpen] = useState(false);
  const [focusRequest, setFocusRequest] = useState<(CustomMenuFocusRequest & { path: MenuPath }) | undefined>();
  const draftAdopted = useRef(false);
  const currentFingerprint = useRef("");
  const editRevision = useRef(0);
  const focusRequestId = useRef(0);
  const savedFingerprintRef = useRef("");
  const publishConfirmationInFlight = useRef(false);
  const actionDrafts = useRef(new Map<string, Partial<SdkworkIamOauthCustomMenuButton>>());

  // The draft arrives asynchronously through the page's load; adopt it once,
  // keeping any edits made while the load was in flight, and select the first
  // top-level menu like the MP console does on open.
  useEffect(() => {
    if (context && !draftAdopted.current) {
      draftAdopted.current = true;
      editRevision.current = 0;
      setDraftHistory({ entries: [context.draft], index: 0 });
      const initialFingerprint = fingerprintDraft(context.draft);
      currentFingerprint.current = initialFingerprint;
      savedFingerprintRef.current = initialFingerprint;
      setSavedFingerprint(initialFingerprint);
      onDirtyChange?.(false);
      if (context.draft.buttons.length > 0) {
        setSelectedPath("0");
      }
    }
  }, [context, onDirtyChange]);

  const draft = draftHistory.entries[draftHistory.index];
  const issues = useMemo(() => (draft ? validateCustomMenuDraft(draft) : []), [draft]);

  const buttons = draft?.buttons ?? [];
  const selected = draft ? findButtonAtPath(buttons, selectedPath) : undefined;
  const selectedIsSub = selectedPath.includes(".");
  const isDirty = Boolean(draft && fingerprintDraft(draft) !== savedFingerprint);
  const canUndo = draftHistory.index > 0;
  const canRedo = draftHistory.index >= 0 && draftHistory.index < draftHistory.entries.length - 1;

  const commit = (nextButtons: SdkworkIamOauthCustomMenuButton[]) => {
    const nextDraft = { buttons: nextButtons, updatedAt: draft?.updatedAt };
    const nextFingerprint = fingerprintDraft(nextDraft);
    editRevision.current += 1;
    currentFingerprint.current = nextFingerprint;
    setDraftHistory((current) => pushDraftHistory(current, nextDraft));
    setValidationBanner(undefined);
    setFocusRequest(undefined);
    onDirtyChange?.(nextFingerprint !== savedFingerprintRef.current);
  };

  const applyHistoryIndex = (nextIndex: number) => {
    const nextDraft = draftHistory.entries[nextIndex];
    if (!nextDraft || nextIndex === draftHistory.index) {
      return;
    }
    editRevision.current += 1;
    const nextFingerprint = fingerprintDraft(nextDraft);
    currentFingerprint.current = nextFingerprint;
    setDraftHistory((current) => ({ ...current, index: nextIndex }));
    setSelectedPath(resolveSelectionPath(nextDraft.buttons, selectedPath));
    setValidationBanner(undefined);
    setFocusRequest(undefined);
    onDirtyChange?.(nextFingerprint !== savedFingerprintRef.current);
  };

  const handleUndo = () => applyHistoryIndex(draftHistory.index - 1);
  const handleRedo = () => applyHistoryIndex(draftHistory.index + 1);

  const handleAddTopMenu = () => {
    if (buttons.length >= CUSTOM_MENU_MAX_TOP_BUTTONS) {
      return;
    }
    const next = [...buttons, { key: createCustomMenuKey(), name: "" }];
    commit(next);
    setSelectedPath(String(next.length - 1));
  };

  const handleAddSubMenu = (topIndex: number) => {
    const topButton = buttons[topIndex];
    if (!topButton || (topButton.subButtons?.length ?? 0) >= CUSTOM_MENU_MAX_SUB_BUTTONS) {
      return;
    }
    const subButton: SdkworkIamOauthCustomMenuButton = { key: createCustomMenuKey(), name: "" };
    const topPath = String(topIndex);
    commit(mutateAtPath(buttons, topPath, (button) => ({
      ...button,
      // A parent with sub-menus is display-only; drop any action it carried.
      type: undefined,
      url: undefined,
      appId: undefined,
      pagePath: undefined,
      message: undefined,
      unsupportedType: undefined,
      providerAction: undefined,
      subButtons: [...(button.subButtons ?? []), subButton],
    })));
    setSelectedPath(`${topPath}.${(topButton.subButtons?.length ?? 0)}`);
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

  const handleChangeType = (type: SdkworkIamOauthCustomMenuActionKind) => {
    commit(mutateAtPath(buttons, selectedPath, (button) => {
      if (button.type) {
        actionDrafts.current.set(actionDraftKey(button.key, button.type), pickActionFields(button));
      }
      const cached = actionDrafts.current.get(actionDraftKey(button.key, type));
      return setActionType(button, type, cached);
    }));
  };

  const handleSaveDraft = async () => {
    if (!draft) {
      return;
    }
    setValidationBanner(undefined);
    const savingRevision = editRevision.current;
    const savingFingerprint = fingerprintDraft(draft);
    const savedDraft = await onSaveDraft(draft);
    if (savedDraft) {
      adoptSavedDraft(savedDraft, savingRevision, savingFingerprint);
    }
  };

  const handleRequestPublish = () => {
    if (!draft) {
      return;
    }
    if (issues.length > 0) {
      const first = issues[0];
      if (first.path) {
        setSelectedPath(first.path);
        focusRequestId.current += 1;
        setFocusRequest({ kind: first.kind, path: first.path, requestId: focusRequestId.current });
      }
      setValidationBanner(first.path !== "" ? first.kind : first.kind === "tooManyTop" ? "tooManyTop" : "atLeastOneTop");
      return;
    }
    setValidationBanner(undefined);
    setPublishConfirmationOpen(true);
  };

  const handleConfirmPublish = async () => {
    if (!draft || busy || publishConfirmationInFlight.current) {
      return;
    }
    publishConfirmationInFlight.current = true;
    const publishingRevision = editRevision.current;
    const publishingFingerprint = fingerprintDraft(draft);
    try {
      const publishedDraft = await onPublish(draft);
      if (publishedDraft) {
        adoptSavedDraft(publishedDraft, publishingRevision, publishingFingerprint);
      }
    } finally {
      publishConfirmationInFlight.current = false;
      setPublishConfirmationOpen(false);
    }
  };

  const adoptSavedDraft = (
    canonicalDraft: SdkworkIamOauthCustomMenuDraft,
    actionRevision: number,
    actionFingerprint: string,
  ) => {
    const canonicalFingerprint = fingerprintDraft(canonicalDraft);
    savedFingerprintRef.current = canonicalFingerprint;
    setSavedFingerprint(canonicalFingerprint);
    const hasNewerEdits = editRevision.current !== actionRevision
      && currentFingerprint.current !== actionFingerprint;
    if (!hasNewerEdits) {
      currentFingerprint.current = canonicalFingerprint;
      setDraftHistory({ entries: [canonicalDraft], index: 0 });
      setSelectedPath((current) => resolveSelectionPath(canonicalDraft.buttons, current));
    }
    onDirtyChange?.(hasNewerEdits && currentFingerprint.current !== canonicalFingerprint);
  };

  const handleWorkspaceKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (busy || deleteConfirmationOpen || publishConfirmationOpen || isEditableTarget(event.target) || !(event.ctrlKey || event.metaKey)) {
      return;
    }
    if (event.key.toLowerCase() === "z") {
      event.preventDefault();
      if (event.shiftKey) {
        handleRedo();
      } else {
        handleUndo();
      }
    } else if (event.key.toLowerCase() === "y") {
      event.preventDefault();
      handleRedo();
    }
  };

  const issueText = (kind: SdkworkIamOauthCustomMenuValidationIssue["kind"]): string =>
    messages.validation[kind];
  const selectedIssues = selected && selectedPath
    ? issues.filter((issue) => issue.path === selectedPath)
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
    <div
      className="flex h-full min-h-0 flex-col bg-white text-[#353535] dark:bg-[#18181b] dark:text-[#e4e4e7]"
      onKeyDownCapture={handleWorkspaceKeyDown}
    >
      <header className="grid min-h-[4.75rem] shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 border-b border-[#e5e5e5] px-4 py-3 sm:flex sm:gap-3 sm:px-6 sm:py-0 dark:border-[#3f3f46]">
        <div className="min-w-0 flex-1 leading-tight">
          <h2 id="sdkwork-iam-custom-menu-dialog-title" className="truncate text-base font-semibold text-[#242424] sm:text-lg dark:text-[#f4f4f5]">
            {messages.title}
          </h2>
          {context?.displayName ? (
            <div className="mt-1 flex min-w-0 items-center gap-2 text-xs">
              <p className="truncate text-[#8d8d8d] dark:text-[#a1a1aa]">{context.displayName}</p>
              <span aria-hidden="true" className="h-3 w-px shrink-0 bg-[#d8d8d8] dark:bg-[#52525b]" />
              <span className={`shrink-0 ${isDirty ? "text-[#d48806] dark:text-[#f0b429]" : "text-[#07c160] dark:text-[#2bd576]"}`}>
                <span aria-hidden="true" className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${isDirty ? "bg-[#d48806] dark:bg-[#f0b429]" : "bg-[#07c160] dark:bg-[#2bd576]"}`} />
                {isDirty ? messages.unsavedStatus : messages.savedStatus}
              </span>
            </div>
          ) : null}
        </div>
        <div className="col-span-2 row-start-2 flex items-center justify-end gap-2 sm:col-auto sm:row-auto sm:ml-auto">
          <div className="mr-1 flex items-center border-r border-[#e1e1e1] pr-2 dark:border-[#3f3f46]">
            <IconButton
              aria-label={messages.undo}
              className="text-[#606060] dark:text-[#d4d4d8]"
              disabled={Boolean(busy) || !canUndo}
              onClick={handleUndo}
              title={messages.undo}
              variant="ghost"
            >
              <Undo2 aria-hidden="true" className="h-4 w-4" />
            </IconButton>
            <IconButton
              aria-label={messages.redo}
              className="text-[#606060] dark:text-[#d4d4d8]"
              disabled={Boolean(busy) || !canRedo}
              onClick={handleRedo}
              title={messages.redo}
              variant="ghost"
            >
              <Redo2 aria-hidden="true" className="h-4 w-4" />
            </IconButton>
          </div>
          <Button
            className="shrink-0"
            disabled={Boolean(busy)}
            loading={busy === "saving"}
            onClick={() => { void handleSaveDraft(); }}
            type="button"
            variant="secondary"
          >
            {messages.saveDraft}
          </Button>
          <Button
            className="shrink-0"
            disabled={Boolean(busy)}
            loading={busy === "publishing"}
            onClick={handleRequestPublish}
            type="button"
            variant="primary"
          >
            {messages.saveAndPublish}
          </Button>
        </div>
        {onClose ? (
          <div className="col-start-2 row-start-1 flex shrink-0 items-center sm:col-auto sm:row-auto sm:ml-1 sm:border-l sm:border-[#e1e1e1] sm:pl-3 dark:sm:border-[#3f3f46]">
            <IconButton
              aria-label={messages.close}
              className="shrink-0 text-[#606060] hover:bg-[#f2f2f2] hover:text-[#242424] dark:text-[#d4d4d8] dark:hover:bg-[#303033] dark:hover:text-white"
              disabled={Boolean(busy)}
              onClick={onClose}
              title={messages.close}
              variant="ghost"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </IconButton>
          </div>
        ) : null}
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-3 bg-[#f6f7f8] p-3 sm:p-4 lg:p-5 dark:bg-[#111113]">
        {validationBanner ? (
          <StatusNotice tone="warning">
            {validationBanner === "atLeastOneTop" ? messages.validation.atLeastOneTop : issueText(validationBanner as SdkworkIamOauthCustomMenuValidationIssue["kind"])}
          </StatusNotice>
        ) : null}

        {!draft ? (
          <div className="flex min-h-0 flex-1 items-center justify-center text-sm text-[#8d8d8d] dark:text-[#a1a1aa]">
            {messages.loading}
          </div>
        ) : (
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto lg:grid-cols-[minmax(25rem,42%)_minmax(0,1fr)] lg:overflow-hidden xl:grid-cols-[minmax(29rem,42%)_minmax(0,1fr)]">
          <section className="flex min-h-[34rem] min-w-0 items-center justify-center overflow-hidden rounded-[6px] border border-[#dedede] bg-[#eef0f2] p-4 [container-type:size] lg:min-h-0 dark:border-[#3f3f46] dark:bg-[#202023]">
            <SdkworkIamOauthCustomMenuPhonePreview
              buttons={buttons}
              addTopMenuLabel={messages.addTopMenu}
              addSubMenuLabel={messages.addSubMenu}
              deviceSelectorLabel={messages.deviceSelectorLabel}
              displayName={context?.displayName ?? ""}
              emptyHint={messages.phoneEmptyHint}
              onAddTopMenu={handleAddTopMenu}
              onAddSubMenu={handleAddSubMenu}
              onSelect={setSelectedPath}
              previewTitle={messages.phonePreviewTitle}
              selectedPath={selectedPath}
              subMenuLabel={messages.subMenuLabel}
              topMenuLabel={messages.topMenuLabel}
            />
          </section>

          <section className="flex min-h-[30rem] min-w-0 flex-1 flex-col rounded-[6px] border border-[#dedede] bg-[#f4f5f7] lg:min-h-0 dark:border-[#3f3f46] dark:bg-[#202023]">
            {selected ? (
              <SdkworkIamOauthCustomMenuEditor
                button={selected}
                focusRequest={focusRequest?.path === selectedPath ? focusRequest : undefined}
                isSubMenu={selectedIsSub}
                issues={selectedIssues}
                messages={messages}
                moveDisabled={moveDisabled}
                onChangeField={(field, value) => commit(mutateAtPath(buttons, selectedPath, (button) => ({ ...button, [field]: value })))}
                onChangeName={(name) => commit(mutateAtPath(buttons, selectedPath, (button) => ({ ...button, name })))}
                onChangeType={handleChangeType}
                onDelete={() => setDeleteConfirmationOpen(true)}
                onMove={handleMove}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-[#8d8d8d] dark:text-[#a1a1aa]">
                {messages.selectHint}
              </div>
            )}
          </section>
          </div>
        )}

        {draft ? (
          <div className="flex shrink-0 items-start gap-2 px-1 text-xs leading-5 text-[#8d8d8d] dark:text-[#a1a1aa]">
            <Info aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p>
              <span className="font-medium text-[#505050] dark:text-[#d4d4d8]">{messages.rules}：</span>
              {messages.rulesText}{messages.rulesText2}
            </p>
          </div>
        ) : null}
      </div>

      <Modal open={deleteConfirmationOpen} onOpenChange={setDeleteConfirmationOpen}>
        <ModalContent
          className="z-[251] !bg-white text-[#353535] opacity-100 dark:!bg-[#27272a] dark:text-[#f4f4f5] dark:border-[#52525b]"
          data-testid="custom-menu-delete-confirmation"
          showCloseButton={false}
          size="sm"
          style={{ opacity: 1 }}
        >
          <ModalHeader className="border-[#e1e1e1] dark:border-[#3f3f46]">
            <ModalTitle>{selectedIsSub ? messages.deleteSubMenu : messages.deleteMenu}</ModalTitle>
            <ModalDescription className="text-[#8d8d8d] dark:text-[#a1a1aa]">
              {messages.deleteConfirmation}
            </ModalDescription>
          </ModalHeader>
          <ModalFooter className="border-[#e1e1e1] dark:border-[#3f3f46]">
            <Button onClick={() => setDeleteConfirmationOpen(false)} type="button" variant="secondary">
              {messages.cancel}
            </Button>
            <Button
              onClick={() => {
                handleDelete();
                setDeleteConfirmationOpen(false);
              }}
              type="button"
              variant="danger"
            >
              {selectedIsSub ? messages.deleteSubMenu : messages.deleteMenu}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        open={publishConfirmationOpen}
        onOpenChange={(open) => {
          if (!open && busy !== "publishing" && !publishConfirmationInFlight.current) {
            setPublishConfirmationOpen(false);
          }
        }}
      >
        <ModalContent
          className="z-[251] !bg-white text-[#353535] opacity-100 dark:!border-[#52525b] dark:!bg-[#27272a] dark:text-[#f4f4f5]"
          data-testid="custom-menu-publish-confirmation"
          onEscapeKeyDown={(event) => {
            if (busy === "publishing" || publishConfirmationInFlight.current) {
              event.preventDefault();
            }
          }}
          onInteractOutside={(event) => {
            if (busy === "publishing" || publishConfirmationInFlight.current) {
              event.preventDefault();
            }
          }}
          showCloseButton={false}
          size="sm"
          style={{ opacity: 1 }}
        >
          <ModalHeader className="border-[#e1e1e1] dark:border-[#3f3f46]">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#f0c36d] bg-[#fff8e6] text-[#b26a00] dark:border-[#7c5a23] dark:bg-[#3a2d16] dark:text-[#f0b429]">
                <CircleAlert aria-hidden="true" className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <ModalTitle>{messages.publishConfirmTitle}</ModalTitle>
                <ModalDescription className="mt-1.5 leading-6 text-[#6b6b6b] dark:text-[#a1a1aa]">
                  {messages.publishConfirmDescription}
                </ModalDescription>
              </div>
            </div>
          </ModalHeader>
          <ModalFooter className="border-[#e1e1e1] dark:border-[#3f3f46]">
            <Button
              disabled={busy === "publishing"}
              onClick={() => setPublishConfirmationOpen(false)}
              type="button"
              variant="secondary"
            >
              {messages.cancel}
            </Button>
            <Button
              disabled={busy === "publishing"}
              loading={busy === "publishing"}
              onClick={() => { void handleConfirmPublish(); }}
              type="button"
              variant="primary"
            >
              {messages.publishConfirmAction}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
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
  const remainingSubButtons = (buttons[topIndex]?.subButtons ?? [])
    .filter((_, subIdx) => subIdx !== subIndex);
  const next = buttons.map((button, index) =>
    index === topIndex
      ? { ...button, subButtons: remainingSubButtons }
      : button);
  const nextSelection = remainingSubButtons.length > 0
    ? `${topIndex}.${Math.min(subIndex, remainingSubButtons.length - 1)}`
    : String(topIndex);
  return { draft: { buttons: next }, nextSelection };
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

function setActionType(
  button: SdkworkIamOauthCustomMenuButton,
  type: SdkworkIamOauthCustomMenuActionKind,
  cached?: Partial<SdkworkIamOauthCustomMenuButton>,
): SdkworkIamOauthCustomMenuButton {
  return {
    ...button,
    type,
    unsupportedType: undefined,
    providerAction: undefined,
    // Keep only active fields in the draft; cached values are restored when
    // the operator switches back during the same editing session.
    ...(type === "click" ? { message: cached?.message ?? button.message } : { message: undefined }),
    ...(type === "view" || type === "miniprogram"
      ? { url: cached?.url ?? button.url }
      : { url: undefined }),
    ...(type === "miniprogram"
      ? { appId: cached?.appId, pagePath: cached?.pagePath }
      : { appId: undefined, pagePath: undefined }),
  };
}

function actionDraftKey(key: string, type: SdkworkIamOauthCustomMenuActionKind): string {
  return `${key}:${type}`;
}

function pickActionFields(
  button: SdkworkIamOauthCustomMenuButton,
): Partial<SdkworkIamOauthCustomMenuButton> {
  return {
    appId: button.appId,
    message: button.message,
    pagePath: button.pagePath,
    url: button.url,
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

function fingerprintDraft(draft: SdkworkIamOauthCustomMenuDraft): string {
  return JSON.stringify(draft.buttons);
}

function pushDraftHistory(
  history: CustomMenuDraftHistory,
  draft: SdkworkIamOauthCustomMenuDraft,
): CustomMenuDraftHistory {
  const entries = [...history.entries.slice(0, history.index + 1), draft];
  const limitedEntries = entries.length > CUSTOM_MENU_HISTORY_LIMIT
    ? entries.slice(entries.length - CUSTOM_MENU_HISTORY_LIMIT)
    : entries;
  return { entries: limitedEntries, index: limitedEntries.length - 1 };
}

function isEditableTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement
    && (target.matches("input, textarea, select") || target.isContentEditable);
}

function resolveSelectionPath(
  buttons: SdkworkIamOauthCustomMenuButton[],
  currentPath: MenuPath,
): MenuPath {
  if (findButtonAtPath(buttons, currentPath)) {
    return currentPath;
  }
  const [topIndex] = currentPath.split(".").map(Number);
  if (buttons.length === 0) {
    return "";
  }
  return String(Math.min(Number.isFinite(topIndex) ? topIndex : 0, buttons.length - 1));
}
