import { useSdkworkIamH5AuthMessages } from "../i18n";

export interface SdkworkIamH5AuthTermsModalProps {
  onClose: () => void;
  showTerms: string | null;
}

export function SdkworkIamH5AuthTermsModal({
  onClose,
  showTerms,
}: SdkworkIamH5AuthTermsModalProps) {
  const messages = useSdkworkIamH5AuthMessages();
  if (!showTerms) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/50 p-6 pb-20"
      onClick={onClose}
    >
      <div
        className="flex max-h-[70vh] w-full max-w-[320px] flex-col overflow-hidden rounded-2xl bg-[var(--iam-h5-auth-modal-bg)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-[var(--iam-h5-auth-border)] py-4 text-center text-[16px] font-medium">
          {showTerms}
        </div>
        <div className="flex-1 overflow-y-auto p-6 text-[14px] leading-relaxed text-[var(--iam-h5-auth-text-sub)]">
          <p className="mb-4">{messages.termsModal.mockContent}</p>
          <p className="mb-4">{messages.termsModal.mockItem1}</p>
          <p className="mb-4">{messages.termsModal.mockItem2}</p>
          <p>{messages.termsModal.mockItem3}</p>
        </div>
        <div
          className="cursor-pointer border-t border-[var(--iam-h5-auth-border)] py-4 text-center text-[var(--iam-h5-auth-link)] font-medium active:opacity-70"
          onClick={onClose}
        >
          {messages.actions.gotIt}
        </div>
      </div>
    </div>
  );
}
