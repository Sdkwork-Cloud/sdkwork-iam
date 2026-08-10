# -*- coding: utf-8 -*-
import io

p = "src/components/oauth-account-setup-section.tsx"
s = io.open(p, encoding="utf-8").read()

# ---- 1. generation helpers next to VERIFY_FILE_MAX_BYTES ----
old = """const VERIFY_FILE_MAX_BYTES = 1024 * 1024;"""
new = """const VERIFY_FILE_MAX_BYTES = 1024 * 1024;

const WECHAT_SECRET_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function randomWechatSecret(length: number): string {
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  let result = "";
  for (let index = 0; index < length; index += 1) {
    result += WECHAT_SECRET_CHARS[values[index] % WECHAT_SECRET_CHARS.length];
  }
  return result;
}

/**
 * WeChat server-config token: 3-32 alphanumeric characters; 32 is generated.
 */
export function generateWechatToken(): string {
  return randomWechatSecret(32);
}

/**
 * WeChat EncodingAESKey: exactly 43 alphanumeric characters.
 */
export function generateWechatEncodingAesKey(): string {
  return randomWechatSecret(43);
}"""
assert old in s, "helpers anchor"
s = s.replace(old, new, 1)

# ---- 2. OauthSecretField component before DomainTagField anchor ----
old = """function DomainTagField({ hint, label, onChange, value }: { hint?: string; label: string; onChange: (values: string[]) => void; value: string[] }) {"""
new = """/**
 * Secret input with generate and copy link actions underneath, mirroring the
 * WeChat console server-config flow.
 */
function OauthSecretField({
  copyLabel,
  copiedLabel,
  generate,
  generateLabel,
  label,
  onChange,
  placeholder,
  value,
}: {
  copyLabel: string;
  copiedLabel: string;
  generate: () => string;
  generateLabel: string;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!value) {
      return;
    }
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(value)
        .then(() => setCopied(true))
        .catch(() => undefined);
    }
  };

  return (
    <div className="space-y-1.5">
      <OauthAdminField
        label={label}
        onChange={onChange}
        placeholder={placeholder}
        type="password"
        value={value}
      />
      <div className="flex items-center gap-4">
        <button
          className="text-xs font-medium text-blue-600 underline-offset-2 hover:underline"
          onClick={() => onChange(generate())}
          type="button"
        >
          {generateLabel}
        </button>
        <button
          className="text-xs font-medium text-[var(--sdk-color-text-secondary)] underline-offset-2 hover:underline disabled:pointer-events-none disabled:opacity-50"
          disabled={!value}
          onClick={handleCopy}
          type="button"
        >
          {copied ? copiedLabel : copyLabel}
        </button>
      </div>
    </div>
  );
}

function DomainTagField({ hint, label, onChange, value }: { hint?: string; label: string; onChange: (values: string[]) => void; value: string[] }) {"""
assert old in s, "secret field anchor"
s = s.replace(old, new, 1)

# ---- 3. apply to token + encodingAesKey in the server config tab ----
old = """          <OauthAdminField
            label={configCopy.notify.token}
            onChange={(token) => setNotify({ token })}
            placeholder={configCopy.notify.tokenPlaceholder}
            value={config.notify?.token ?? ""}
          />
          <OauthAdminField
            label={configCopy.notify.encodingAesKey}
            onChange={(encodingAesKey) => setNotify({ encodingAesKey })}
            placeholder={configCopy.notify.encodingAesKeyPlaceholder}
            value={config.notify?.encodingAesKey ?? ""}
          />"""
new = """          <OauthSecretField
            copyLabel={allMessages.common.copy}
            copiedLabel={allMessages.common.copied}
            generate={generateWechatToken}
            generateLabel={configCopy.notify.generateToken}
            label={configCopy.notify.token}
            onChange={(token) => setNotify({ token })}
            placeholder={configCopy.notify.tokenPlaceholder}
            value={config.notify?.token ?? ""}
          />
          <OauthSecretField
            copyLabel={allMessages.common.copy}
            copiedLabel={allMessages.common.copied}
            generate={generateWechatEncodingAesKey}
            generateLabel={configCopy.notify.generateAesKey}
            label={configCopy.notify.encodingAesKey}
            onChange={(encodingAesKey) => setNotify({ encodingAesKey })}
            placeholder={configCopy.notify.encodingAesKeyPlaceholder}
            value={config.notify?.encodingAesKey ?? ""}
          />"""
assert old in s, "notify fields"
s = s.replace(old, new, 1)

io.open(p, "w", encoding="utf-8", newline="").write(s)
print("ok")
