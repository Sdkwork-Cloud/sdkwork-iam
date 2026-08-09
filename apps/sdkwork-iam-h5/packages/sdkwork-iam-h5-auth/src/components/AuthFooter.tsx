import { useSdkworkIamH5AuthMessages } from "../i18n";

export interface SdkworkIamH5AuthFooterProps {
  agreed: boolean;
  setAgreed: (agreed: boolean) => void;
  setShowTerms: (term: string) => void;
}

export function SdkworkIamH5AuthFooter({
  agreed,
  setAgreed,
  setShowTerms,
}: SdkworkIamH5AuthFooterProps) {
  const messages = useSdkworkIamH5AuthMessages();

  return (
    <div className="flex items-start gap-2 px-8 pb-10">
      <div
        className={
          "mt-0.5 flex h-[18px] w-[18px] shrink-0 cursor-pointer items-center justify-center rounded-full border transition-colors " +
          (agreed
            ? "border-[var(--iam-h5-auth-green)] bg-[var(--iam-h5-auth-green)]"
            : "border-[var(--iam-h5-auth-border-soft)]")
        }
        onClick={() => setAgreed(!agreed)}
      >
        {agreed ? <div className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
      </div>
      <p className="text-[12px] leading-relaxed text-[var(--iam-h5-auth-text-sub)]">
        {messages.footer.readAndAgree}{" "}
        <span
          className="cursor-pointer text-[var(--iam-h5-auth-link)] active:opacity-70"
          onClick={() => setShowTerms(messages.footer.termsOfService)}
        >
          {messages.footer.termsOfService}
        </span>{" "}
        {messages.footer.and}{" "}
        <span
          className="cursor-pointer text-[var(--iam-h5-auth-link)] active:opacity-70"
          onClick={() => setShowTerms(messages.footer.privacyPolicy)}
        >
          {messages.footer.privacyPolicy}
        </span>
      </p>
    </div>
  );
}
