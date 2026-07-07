import { createSdkWorkPagedListSession, extractSdkWorkResourceItem } from "@sdkwork/iam-contracts";
import type { SdkworkIamService } from "@sdkwork/iam-service";
import { isBlank, trim } from "@sdkwork/utils";

import type {
  CreateSdkworkIamAuditControllerInput,
  SdkworkIamAuditController,
  SdkworkIamAuditAdminState,
  SdkworkIamAuditEvent,
  SdkworkIamSecurityEvent,
} from "../types/audit-admin-types";

function cloneListPageInfo(
  value: SdkworkIamAuditAdminState["listPageInfo"],
): SdkworkIamAuditAdminState["listPageInfo"] {
  if (!value) {
    return undefined;
  }
  return {
    auditEvents: value.auditEvents ? { ...value.auditEvents } : undefined,
    securityEvents: value.securityEvents ? { ...value.securityEvents } : undefined,
  };
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function createSdkworkIamAuditController(
  input: SdkworkIamService | CreateSdkworkIamAuditControllerInput,
): SdkworkIamAuditController {
  const service = resolveService(input);
  let state: SdkworkIamAuditAdminState = {
    auditEvents: [],
    securityEvents: [],
    status: "idle",
  };

  const auditEventsSession = createSdkWorkPagedListSession({
    fetchPage: (query) => service.iam.auditEvents.list(query),
    mapItem: toAuditEvent,
  });

  const securityEventsSession = createSdkWorkPagedListSession({
    fetchPage: (query) => service.iam.securityEvents.list(query),
    mapItem: toSecurityEvent,
  });

  const syncListPageInfo = (): NonNullable<SdkworkIamAuditAdminState["listPageInfo"]> => ({
    auditEvents: auditEventsSession.getPageInfo(),
    securityEvents: securityEventsSession.getPageInfo(),
  });

  const setState = (patch: Partial<SdkworkIamAuditAdminState>) => {
    state = { ...state, ...patch };
  };

  return {
    getState: () => ({
      ...state,
      auditEvents: [...state.auditEvents],
      securityEvents: [...state.securityEvents],
      listPageInfo: cloneListPageInfo(state.listPageInfo),
    }),
    listAuditEvents: async (query) => {
      setState({ lastError: undefined, status: "loading" });
      try {
        const auditEvents = await auditEventsSession.list(query) as SdkworkIamAuditEvent[];
        setState({ auditEvents, listPageInfo: syncListPageInfo(), status: "ready" });
        return auditEvents;
      } catch (error) {
        setState({
          lastError: errorMessage(error, "Failed to load audit events"),
          status: "error",
        });
        throw error;
      }
    },
    loadMoreAuditEvents: async () => {
      setState({ lastError: undefined, status: "loading" });
      try {
        const auditEvents = await auditEventsSession.loadMore() as SdkworkIamAuditEvent[];
        setState({ auditEvents, listPageInfo: syncListPageInfo(), status: "ready" });
        return auditEvents;
      } catch (error) {
        setState({
          lastError: errorMessage(error, "Failed to load more audit events"),
          status: "error",
        });
        throw error;
      }
    },
    listSecurityEvents: async (query) => {
      setState({ lastError: undefined, status: "loading" });
      try {
        const securityEvents = await securityEventsSession.list(query) as SdkworkIamSecurityEvent[];
        setState({ listPageInfo: syncListPageInfo(), securityEvents, status: "ready" });
        return securityEvents;
      } catch (error) {
        setState({
          lastError: errorMessage(error, "Failed to load security events"),
          status: "error",
        });
        throw error;
      }
    },
    retrieveAuditEvent: async (auditEventId) => {
      setState({ lastError: undefined, status: "loading" });
      try {
        const event = toAuditEvent(
          extractSdkWorkResourceItem(await service.iam.auditEvents.retrieve(auditEventId)),
        );
        if (!event) {
          throw new Error("Audit event response is missing auditEventId");
        }
        setState({ status: "ready" });
        return event;
      } catch (error) {
        setState({
          lastError: errorMessage(error, "Failed to retrieve audit event"),
          status: "error",
        });
        throw error;
      }
    },
    loadMoreSecurityEvents: async () => {
      setState({ lastError: undefined, status: "loading" });
      try {
        const securityEvents = await securityEventsSession.loadMore() as SdkworkIamSecurityEvent[];
        setState({ listPageInfo: syncListPageInfo(), securityEvents, status: "ready" });
        return securityEvents;
      } catch (error) {
        setState({
          lastError: errorMessage(error, "Failed to load more security events"),
          status: "error",
        });
        throw error;
      }
    },
    retrieveSecurityEvent: async (securityEventId) => {
      setState({ lastError: undefined, status: "loading" });
      try {
        const event = toSecurityEvent(
          extractSdkWorkResourceItem(await service.iam.securityEvents.retrieve(securityEventId)),
        );
        if (!event) {
          throw new Error("Security event response is missing securityEventId");
        }
        setState({ status: "ready" });
        return event;
      } catch (error) {
        setState({
          lastError: errorMessage(error, "Failed to retrieve security event"),
          status: "error",
        });
        throw error;
      }
    },
  };
}

function resolveService(input: SdkworkIamService | CreateSdkworkIamAuditControllerInput): SdkworkIamService {
  return "service" in input ? input.service : input;
}

function toAuditEvent(value: unknown): SdkworkIamAuditEvent | undefined {
  const remote = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const id = optionalString(remote.auditEventId) ?? optionalString(remote.id);
  if (!id) {
    return undefined;
  }
  return {
    id,
    action: optionalString(remote.action) ?? "unknown",
    actorUserId: optionalString(remote.actorUserId),
    createdAt: optionalString(remote.createdAt),
    environment: optionalString(remote.environment),
    detailJson: optionalString(remote.detailJson) ?? optionalString(remote.detail_json),
    resourceId: optionalString(remote.resourceId),
    resourceType: optionalString(remote.resourceType),
    requestId: optionalString(remote.requestId) ?? optionalString(remote.request_id),
    tenantId: optionalString(remote.tenantId),
  };
}

function toSecurityEvent(value: unknown): SdkworkIamSecurityEvent | undefined {
  const remote = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const id = optionalString(remote.securityEventId) ?? optionalString(remote.id);
  if (!id) {
    return undefined;
  }
  return {
    id,
    category: optionalString(remote.category) ?? optionalString(remote.eventType) ?? "unknown",
    createdAt: optionalString(remote.createdAt),
    detailJson: optionalString(remote.detailJson) ?? optionalString(remote.detail_json),
    sessionId: optionalString(remote.sessionId) ?? optionalString(remote.session_id),
    severity: optionalString(remote.severity),
    tenantId: optionalString(remote.tenantId),
    userId: optionalString(remote.userId),
  };
}

function optionalString(value: unknown): string | undefined {
  const normalized = typeof value === "string" ? trim(value) : "";
  return isBlank(normalized) ? undefined : normalized;
}
