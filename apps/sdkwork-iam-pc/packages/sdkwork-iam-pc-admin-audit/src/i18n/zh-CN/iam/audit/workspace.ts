import type { SdkworkIamAuditAdminMessages } from "../../../../types/audit-admin-messages";

export const sdkworkIamAuditAdminMessages: SdkworkIamAuditAdminMessages = {
  common: {
    event: "事件",
    context: "上下文",
  },
  drawer: {
    detailDescription: "IAM 审计与安全事件的只读载荷。",
    detailTitle: "事件详情",
  },
  errors: {
    loadAuditDetailError: "审计事件详情加载失败",
    loadEventsError: "事件加载失败",
    loadSecurityDetailError: "安全事件详情加载失败",
  },
  events: {
    auditTab: "审计事件",
    fallbackInfo: "信息",
    fallbackResource: "资源",
    noAuditEvents: "暂无审计事件。",
    noEvents: "暂无事件",
    noSecurityEvents: "暂无安全事件。",
    searchPlaceholderAudit: "按操作或资源类型筛选",
    searchPlaceholderSecurity: "按事件类型或严重级别筛选",
    securityTab: "安全事件",
    severities: {
      critical: "严重",
      error: "错误",
      info: "信息",
      unknown: "未知",
      warning: "警告",
    },
  },
  pagination: {
    next: "下一页",
    pageSize: "每页",
    previous: "上一页",
    total: "共 {total} 条",
  },
  search: {
    label: "搜索",
  },
  viewDetail: "查看详情",
};
