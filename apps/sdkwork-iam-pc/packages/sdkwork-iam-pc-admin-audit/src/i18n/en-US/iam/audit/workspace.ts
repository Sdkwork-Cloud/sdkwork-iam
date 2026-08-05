import type { SdkworkIamAuditAdminMessages } from "../../../../types/audit-admin-messages";

export const sdkworkIamAuditAdminMessages: SdkworkIamAuditAdminMessages = {
  common: {
    event: "Event",
    context: "Context",
  },
  drawer: {
    detailDescription: "Read-only IAM audit and security event payload.",
    detailTitle: "Event detail",
  },
  errors: {
    loadAuditDetailError: "Failed to load audit event detail",
    loadEventsError: "Failed to load events",
    loadSecurityDetailError: "Failed to load security event detail",
  },
  events: {
    auditTab: "Audit events",
    fallbackInfo: "info",
    fallbackResource: "resource",
    noAuditEvents: "No audit events found.",
    noEvents: "No events found",
    noSecurityEvents: "No security events found.",
    searchPlaceholderAudit: "Filter by action or resource type",
    searchPlaceholderSecurity: "Filter by event type or severity",
    securityTab: "Security events",
    severities: {
      critical: "Critical",
      error: "Error",
      info: "Info",
      unknown: "Unknown",
      warning: "Warning",
    },
  },
  pagination: {
    next: "Next",
    pageSize: "Per page",
    previous: "Previous",
    total: "{total} items in total",
  },
  search: {
    label: "Search",
  },
  viewDetail: "View detail",
};
