import {
  Modal,
  ModalContent,
} from "@sdkwork/ui-pc-react";

import type { SdkworkIamOauthAdminController } from "../../types/oauth-admin-types";
import { SdkworkIamOauthOfficialAccountCustomMenuPage } from "../../pages/OauthOfficialAccountCustomMenuPage";

export interface SdkworkIamOauthCustomMenuFullscreenModalProps {
  accountId: string;
  controller: SdkworkIamOauthAdminController;
  onClose: () => void;
}

/** Full-viewport menu workspace hosted by the shared modal portal. */
export function SdkworkIamOauthCustomMenuFullscreenModal({
  accountId,
  controller,
  onClose,
}: SdkworkIamOauthCustomMenuFullscreenModalProps) {
  return (
    <Modal open onOpenChange={(open) => { if (!open) onClose(); }}>
      <ModalContent
        aria-describedby={undefined}
        aria-labelledby="sdkwork-iam-custom-menu-dialog-title"
        className="left-0 top-0 z-[201] block h-dvh max-h-none w-screen max-w-none translate-x-0 translate-y-0 rounded-none border-0 bg-white p-0 dark:bg-[#18181b]"
        data-testid="custom-menu-modal"
        showCloseButton={false}
        style={{ backgroundColor: "var(--sdk-color-surface-panel, #ffffff)" }}
      >
        <div className="h-full min-h-0 overflow-hidden bg-white p-4 dark:bg-[#18181b] sm:p-6">
          <SdkworkIamOauthOfficialAccountCustomMenuPage
            controller={controller}
            onBack={onClose}
            resourceAccountId={accountId}
          />
        </div>
      </ModalContent>
    </Modal>
  );
}
