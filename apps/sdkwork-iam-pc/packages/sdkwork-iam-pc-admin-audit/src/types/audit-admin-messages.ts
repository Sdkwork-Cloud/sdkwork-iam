export interface SdkworkIamAuditAdminMessages {
  common: {
    event: string;
    context: string;
  };
  errors: {
    loadAuditDetailError: string;
    loadEventsError: string;
    loadSecurityDetailError: string;
  };
  events: {
    auditTab: string;
    fallbackInfo: string;
    fallbackResource: string;
    searchPlaceholderAudit: string;
    searchPlaceholderSecurity: string;
    securityTab: string;
    severities: {
      critical: string;
      error: string;
      info: string;
      unknown: string;
      warning: string;
    };
    noAuditEvents: string;
    noEvents: string;
    noSecurityEvents: string;
  };
  drawer: {
    detailDescription: string;
    detailTitle: string;
  };
  pagination: {
    next: string;
    pageSize: string;
    previous: string;
    total: string;
  };
  search: {
    label: string;
  };
  viewDetail: string;
}
