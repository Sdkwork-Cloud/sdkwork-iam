import { useState } from "react";

import {
  Button,
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@sdkwork/ui-pc-react";

import { useSdkworkIamOauthAdminMessages } from "../../i18n";
import type { SdkworkIamOauthAdminController } from "../../types/oauth-admin-types";
import { SdkworkIamOauthOfficialAccountCustomMenuPage } from "../../pages/OauthOfficialAccountCustomMenuPage";

export interface SdkworkIamOauthCustomMenuFullscreenModalProps {
  accountId: string;
  controller: SdkworkIamOauthAdminController;
  onClose: () => void;
}

/** Large, viewport-aware menu workspace hosted by the shared modal portal. */
export function SdkworkIamOauthCustomMenuFullscreenModal({
  accountId,
  controller,
  onClose,
}: SdkworkIamOauthCustomMenuFullscreenModalProps) {
  const messages = useSdkworkIamOauthAdminMessages().quickSetup.customMenus;
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [closeConfirmationOpen, setCloseConfirmationOpen] = useState(false);
  const requestClose = () => {
    if (busy) {
      return;
    }
    if (dirty) {
      setCloseConfirmationOpen(true);
    } else {
      onClose();
    }
  };

  return (
    <>
      <Modal
        open
        onOpenChange={(open) => {
          if (!open && !closeConfirmationOpen) {
            requestClose();
          }
        }}
      >
      <ModalContent
        aria-describedby={undefined}
        aria-labelledby="sdkwork-iam-custom-menu-dialog-title"
        className="left-1/2 top-1/2 flex h-dvh max-h-none w-screen max-w-none -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-none border-0 !bg-white p-0 opacity-100 shadow-2xl dark:!bg-[#18181b] sm:h-[min(94dvh,68rem)] sm:w-[min(96vw,100rem)] sm:rounded-[8px] sm:border sm:border-[#d9d9d9] dark:sm:border-[#3f3f46]"
        data-testid="custom-menu-modal"
        onEscapeKeyDown={(event) => {
          if (closeConfirmationOpen || busy) {
            event.preventDefault();
          }
        }}
        onInteractOutside={(event) => {
          if (closeConfirmationOpen || busy) {
            event.preventDefault();
          }
        }}
        showCloseButton={false}
        style={{ opacity: 1 }}
      >
        <div className="h-full min-h-0 overflow-hidden bg-white dark:bg-[#18181b]">
          <SdkworkIamOauthOfficialAccountCustomMenuPage
            controller={controller}
            onClose={requestClose}
            onBusyChange={setBusy}
            onDirtyChange={setDirty}
            resourceAccountId={accountId}
          />
        </div>
      </ModalContent>
      </Modal>

      <Modal
        open={closeConfirmationOpen}
        onOpenChange={(open) => {
          // The confirmation is a sibling dialog, so dismissing it must never
          // re-enter the outer workspace's close handler.
          setCloseConfirmationOpen(open);
        }}
      >
        <ModalContent
          className="z-[251] !bg-white text-[#353535] opacity-100 dark:!border-[#52525b] dark:!bg-[#27272a] dark:text-[#f4f4f5]"
          data-testid="custom-menu-unsaved-confirmation"
          showCloseButton={false}
          size="sm"
          style={{ opacity: 1 }}
        >
          <ModalHeader className="border-[#e1e1e1] dark:border-[#3f3f46]">
            <ModalTitle>{messages.unsavedTitle}</ModalTitle>
            <ModalDescription className="text-[#8d8d8d] dark:text-[#a1a1aa]">
              {messages.unsavedDescription}
            </ModalDescription>
          </ModalHeader>
          <ModalFooter className="border-[#e1e1e1] dark:border-[#3f3f46]">
            <Button onClick={() => setCloseConfirmationOpen(false)} type="button" variant="secondary">
              {messages.cancel}
            </Button>
            <Button
              onClick={() => {
                setCloseConfirmationOpen(false);
                setDirty(false);
                onClose();
              }}
              type="button"
              variant="danger"
            >
              {messages.discardChanges}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
