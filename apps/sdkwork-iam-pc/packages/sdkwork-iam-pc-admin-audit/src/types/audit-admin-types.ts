import type { SdkWorkPageInfo } from "@sdkwork/iam-contracts";
import type { SdkworkIamService } from "@sdkwork/iam-service";

export interface SdkworkIamAuditEvent {
  id: string;
  action: string;
  actorUserId?: string;
  createdAt?: string;
  detailJson?: string;
  environment?: string;
  requestId?: string;
  resourceId?: string;
  resourceType?: string;
  tenantId?: string;
}

export interface SdkworkIamSecurityEvent {
  id: string;
  category: string;
  createdAt?: string;
  detailJson?: string;
  sessionId?: string;
  severity?: string;
  tenantId?: string;
  userId?: string;
}

export interface SdkworkIamAuditAdminState {
  auditEvents: SdkworkIamAuditEvent[];
  lastError?: string;
  listPageInfo?: {
    auditEvents?: SdkWorkPageInfo;
    securityEvents?: SdkWorkPageInfo;
  };
  securityEvents: SdkworkIamSecurityEvent[];
  status: "idle" | "loading" | "ready" | "error";
}

export interface SdkworkIamAuditController {
  getState(): SdkworkIamAuditAdminState;
  listAuditEvents(query?: Record<string, unknown>): Promise<SdkworkIamAuditEvent[]>;
  loadMoreAuditEvents(): Promise<SdkworkIamAuditEvent[]>;
  retrieveAuditEvent(auditEventId: string): Promise<SdkworkIamAuditEvent>;
  listSecurityEvents(query?: Record<string, unknown>): Promise<SdkworkIamSecurityEvent[]>;
  loadMoreSecurityEvents(): Promise<SdkworkIamSecurityEvent[]>;
  retrieveSecurityEvent(securityEventId: string): Promise<SdkworkIamSecurityEvent>;
}

export type CreateSdkworkIamAuditControllerInput = {
  service: SdkworkIamService;
};

export interface SdkworkIamAuditAdminWorkspaceProps {
  controller: SdkworkIamAuditController;
  description?: string;
  title?: string;
}
