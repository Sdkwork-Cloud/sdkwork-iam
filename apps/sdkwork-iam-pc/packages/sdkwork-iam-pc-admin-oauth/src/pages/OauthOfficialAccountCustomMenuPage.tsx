import { useCallback, useEffect, useRef, useState } from "react";

import { StatusNotice } from "@sdkwork/ui-pc-react";

import type {
  SdkworkIamOauthCustomMenuContext,
  SdkworkIamOauthCustomMenuDraft,
} from "../types/oauth-admin-types";
import type { SdkworkIamOauthAdminController } from "../types/oauth-admin-types";
import { useSdkworkIamOauthAdminMessages } from "../i18n";
import { templateMessage } from "../utils/oauth-admin-utils";
import { SdkworkIamOauthCustomMenuManagementSection } from "../components/custom-menu/custom-menu-management-section";

interface CustomMenuNotice {
  text: string;
  tone: "success" | "warning" | "danger" | "default";
}

type CustomMenuPendingAction = "saving" | "publishing";

/**
 * Standalone custom menu management page for one official account.
 *
 * Surface-agnostic by design (no router, no host coupling): admin and console
 * hosts mount the same component with their own controller and optional back
 * navigation, so the page is a generic shared surface. The menu design is
 * persisted as a draft inside the account config; publishing delegates to the
 * controller, which degrades gracefully when the backend capability is not
 * wired yet.
 */
export function SdkworkIamOauthOfficialAccountCustomMenuPage({
  controller,
  onBusyChange,
  onDirtyChange,
  onClose,
  resourceAccountId,
}: {
  controller: SdkworkIamOauthAdminController;
  onBusyChange?: (busy: boolean) => void;
  onDirtyChange?: (dirty: boolean) => void;
  onClose?: () => void;
  resourceAccountId: string;
}) {
  const messages = useSdkworkIamOauthAdminMessages();
  const [context, setContext] = useState<SdkworkIamOauthCustomMenuContext | undefined>();
  const [loadError, setLoadError] = useState<string | undefined>();
  const [busy, setBusy] = useState<CustomMenuPendingAction | undefined>();
  const [notice, setNotice] = useState<CustomMenuNotice | undefined>();
  const actionInFlight = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setLoadError(undefined);
    setContext(undefined);
    controller.loadAccountCustomMenu(resourceAccountId)
      .then((loaded) => {
        if (!cancelled) {
          setContext(loaded);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : messages.quickSetup.customMenus.loadFailed);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [controller, messages.quickSetup.customMenus.loadFailed, resourceAccountId]);

  const runSaving = useCallback(async (
    pendingAction: CustomMenuPendingAction,
    action: () => Promise<unknown>,
  ): Promise<boolean> => {
    if (actionInFlight.current) {
      return false;
    }
    actionInFlight.current = true;
    setBusy(pendingAction);
    onBusyChange?.(true);
    setNotice(undefined);
    try {
      await action();
      return true;
    } catch (error) {
      setNotice({
        tone: "danger",
        text: error instanceof Error ? error.message : messages.quickSetup.customMenus.loadFailed,
      });
      return false;
    } finally {
      actionInFlight.current = false;
      setBusy(undefined);
      onBusyChange?.(false);
    }
  }, [messages.quickSetup.customMenus.loadFailed, onBusyChange]);

  const handleSaveDraft = useCallback(async (
    draft: SdkworkIamOauthCustomMenuDraft,
  ): Promise<SdkworkIamOauthCustomMenuDraft | undefined> => {
    let refreshed: SdkworkIamOauthCustomMenuContext | undefined;
    const ok = await runSaving("saving", async () => {
      refreshed = await controller.saveAccountCustomMenu(resourceAccountId, draft);
    });
    if (ok) {
      setNotice({ tone: "success", text: messages.quickSetup.customMenus.saved });
    }
    return ok ? refreshed?.draft : undefined;
  }, [controller, messages.quickSetup.customMenus.saved, resourceAccountId, runSaving]);

  const handlePublish = useCallback(async (
    draft: SdkworkIamOauthCustomMenuDraft,
  ): Promise<SdkworkIamOauthCustomMenuDraft | undefined> => {
    if (actionInFlight.current) {
      return undefined;
    }
    actionInFlight.current = true;
    setBusy("publishing");
    onBusyChange?.(true);
    setNotice(undefined);
    try {
      const result = await controller.publishAccountCustomMenu(resourceAccountId, draft);
      if (result.published) {
        setNotice({ tone: "success", text: messages.quickSetup.customMenus.publishSuccess });
      } else if (result.reason === "backend_unavailable") {
        setNotice({ tone: "default", text: messages.quickSetup.customMenus.publishUnavailable });
      } else {
        setNotice({
          tone: "danger",
          text: templateMessage(messages.quickSetup.customMenus.publishFailedTemplate, {
            message: result.errorMessage ?? "",
          }),
        });
      }
      return result.saved ? result.context?.draft ?? draft : undefined;
    } catch (error) {
      setNotice({
        tone: "danger",
        text: error instanceof Error ? error.message : messages.quickSetup.customMenus.loadFailed,
      });
      return undefined;
    } finally {
      actionInFlight.current = false;
      setBusy(undefined);
      onBusyChange?.(false);
    }
  }, [controller, messages.quickSetup.customMenus, onBusyChange, resourceAccountId]);

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      {loadError || notice ? (
        <div className="pointer-events-none absolute left-1/2 top-[5.5rem] z-40 w-[min(90%,38rem)] -translate-x-1/2 shadow-lg">
          {loadError ? <StatusNotice tone="danger">{loadError}</StatusNotice> : null}
          {notice ? <StatusNotice tone={notice.tone}>{notice.text}</StatusNotice> : null}
        </div>
      ) : null}
      <SdkworkIamOauthCustomMenuManagementSection
        key={resourceAccountId}
        busy={busy}
        context={context}
        messages={messages.quickSetup.customMenus}
        onDirtyChange={onDirtyChange}
        onClose={onClose}
        onPublish={handlePublish}
        onSaveDraft={handleSaveDraft}
      />
    </div>
  );
}
