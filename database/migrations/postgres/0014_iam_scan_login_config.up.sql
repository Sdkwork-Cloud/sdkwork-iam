-- Scan login configuration for IAM login pages.
--
-- Controls the URL (H5 mobile login) scan-login mode and the default QR
-- login mode advertised by the login page. Official-account scan login is
-- enabled per account through `iam_oauth_resource_account.qr_default_enabled`.
CREATE TABLE IF NOT EXISTS iam_oauth_scan_login_config (
  tenant_id TEXT PRIMARY KEY,
  h5_login_origin TEXT NOT NULL DEFAULT '',
  url_login_enabled INTEGER NOT NULL DEFAULT 1,
  default_qr_mode TEXT NOT NULL DEFAULT 'auto',
  updated_at TEXT NOT NULL
);
