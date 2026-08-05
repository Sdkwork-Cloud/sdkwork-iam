-- Scan login mode registry for IAM login pages.
--
-- Extends iam_oauth_scan_login_config with the ordered, enabled scan-login
-- mode list. Each entry is one of:
--   {"mode": "official_account", "enabled": true, "sortOrder": 10}
--   {"mode": "url", "enabled": true, "sortOrder": 20}
--   {"mode": "provider", "providerCode": "wechat_open", "enabled": true,
--    "sortOrder": 30, "displayName": "WeChat scan"}
-- An empty list falls back to [official_account (when an enabled account
-- exists), url], preserving pre-registry behavior.
ALTER TABLE iam_oauth_scan_login_config
    ADD COLUMN IF NOT EXISTS modes_json TEXT NOT NULL DEFAULT '[]';
