import { useCallback, useEffect, useState } from "react";

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
  onBack,
  resourceAccountId,
}: {
  controller: SdkworkIamOauthAdminController;
  onBack?: () => void;
  resourceAccountId: string;
}) {
  const messages = useSdkworkIamOauthAdminMessages();
  const [context, setContext] = useState<SdkworkIamOauthCustomMenuContext | undefined>();
  const [loadError, setLoadError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<CustomMenuNotice | undefined>();

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

  const runSaving = useCallback(async (action: () => Promise<unknown>): Promise<boolean> => {
    setBusy(true);
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
      setBusy(false);
    }
  }, [messages.quickSetup.customMenus.loadFailed]);

  const handleSaveDraft = useCallback((draft: SdkworkIamOauthCustomMenuDraft) => {
    void runSaving(() => controller.saveAccountCustomMenu(resourceAccountId, draft))
      .then((ok) => {
        if (ok) {
          setNotice({ tone: "success", text: messages.quickSetup.customMenus.saved });
        }
      });
  }, [controller, messages.quickSetup.customMenus.saved, resourceAccountId, runSaving]);

  const handlePublish = useCallback(async (draft: SdkworkIamOauthCustomMenuDraft) => {
    setBusy(true);
    setNotice(undefined);
    const result = await controller.publishAccountCustomMenu(resourceAccountId, draft);
    setBusy(false);
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
  }, [controller, messages.quickSetup.customMenus, resourceAccountId]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      {loadError ? <StatusNotice tone="danger">{loadError}</StatusNotice> : null}
      {notice ? <StatusNotice tone={notice.tone}>{notice.text}</StatusNotice> : null}
      <SdkworkIamOauthCustomMenuManagementSection
        busy={busy}
        context={context}
        messages={messages.quickSetup.customMenus}
        onBack={onBack}
        onPublish={(draft) => { void handlePublish(draft); }}
        onSaveDraft={handleSaveDraft}
      />
    </div>
  );
}
