import { useEffect, useRef } from "react";

import type { SdkworkIamOauthAdminController } from "../../types/oauth-admin-types";
import { SdkworkIamOauthOfficialAccountCustomMenuPage } from "../../pages/OauthOfficialAccountCustomMenuPage";

export interface SdkworkIamOauthCustomMenuFullscreenModalProps {
  accountId: string;
  controller: SdkworkIamOauthAdminController;
  onClose: () => void;
}

/**
 * Full-screen modal host for the official account custom menu manager. The
 * editor needs the whole viewport (phone simulator + form panel), so it opens
 * as a viewport-covering modal instead of an inline dialog or a route page.
 * The page's own header (back action) closes the modal; Escape and body
 * scroll locking follow standard modal behavior.
 */
export function SdkworkIamOauthCustomMenuFullscreenModal({
  accountId,
  controller,
  onClose,
}: SdkworkIamOauthCustomMenuFullscreenModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Move keyboard focus into the modal and lock background scrolling.
    containerRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-[100] flex min-h-0 flex-col bg-[var(--sdk-color-surface-base)] outline-none"
      ref={containerRef}
      role="dialog"
      tabIndex={-1}
    >
      <SdkworkIamOauthOfficialAccountCustomMenuPage
        controller={controller}
        onBack={onClose}
        resourceAccountId={accountId}
      />
    </div>
  );
}
