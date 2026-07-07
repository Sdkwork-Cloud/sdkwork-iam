import { describe, expect, it, vi } from "vitest";

import { createSdkworkIamAuditController } from "../src/index";

const pageInfo = {
  hasMore: false,
  mode: "offset" as const,
  page: 1,
  pageSize: 20,
  totalItems: "1",
};

describe("@sdkwork/iam-pc-admin-audit", () => {
  it("lists audit and security events through the standard IAM service", async () => {
    const service = {
      iam: {
        auditEvents: {
          list: vi.fn().mockResolvedValue({
            items: [
              {
                action: "iam.users.create",
                auditEventId: "audit-1",
                createdAt: "2026-07-06T00:00:00Z",
                environment: "prod",
                resourceType: "user",
                tenantId: "100001",
              },
            ],
            pageInfo,
          }),
        },
        securityEvents: {
          list: vi.fn().mockResolvedValue({
            items: [
              {
                category: "session.revoked",
                securityEventId: "sec-1",
                severity: "info",
                tenantId: "100001",
              },
            ],
            pageInfo,
          }),
        },
      },
    };

    const controller = createSdkworkIamAuditController({ service: service as never });

    await expect(controller.listAuditEvents({ page_size: 20 })).resolves.toEqual([
      {
        action: "iam.users.create",
        actorUserId: undefined,
        createdAt: "2026-07-06T00:00:00Z",
        environment: "prod",
        id: "audit-1",
        resourceId: undefined,
        resourceType: "user",
        tenantId: "100001",
      },
    ]);
    await expect(controller.listSecurityEvents({ page_size: 20 })).resolves.toEqual([
      {
        category: "session.revoked",
        createdAt: undefined,
        id: "sec-1",
        severity: "info",
        tenantId: "100001",
        userId: undefined,
      },
    ]);

    expect(service.iam.auditEvents.list).toHaveBeenCalledWith({ page_size: 20 });
    expect(service.iam.securityEvents.list).toHaveBeenCalledWith({ page_size: 20 });
    expect(controller.getState().status).toBe("ready");
  });

  it("drops malformed rows and surfaces load-more failures", async () => {
    const list = vi
      .fn()
      .mockResolvedValueOnce({
        items: [{ action: "orphan" }],
        pageInfo: { ...pageInfo, hasMore: true, totalItems: "2" },
      })
      .mockResolvedValueOnce({
        items: [{ auditEventId: "audit-1", action: "iam.users.create" }],
        pageInfo: { ...pageInfo, hasMore: true, page: 1 },
      })
      .mockRejectedValueOnce(new Error("network down"));

    const service = {
      iam: {
        auditEvents: { list },
        securityEvents: {
          list: vi.fn().mockResolvedValue({ items: [], pageInfo }),
        },
      },
    };

    const controller = createSdkworkIamAuditController({ service: service as never });
    await expect(controller.listAuditEvents({ page_size: 20 })).resolves.toEqual([]);
    expect(controller.getState().auditEvents).toEqual([]);

    await controller.listAuditEvents({ page_size: 20 });
    await expect(controller.loadMoreAuditEvents()).rejects.toThrow("network down");
    expect(controller.getState().lastError).toBe("network down");
    expect(controller.getState().status).toBe("error");
    expect(list).toHaveBeenCalledTimes(3);
  });

  it("retrieves audit and security event details through the standard resource envelope", async () => {
    const service = {
      iam: {
        auditEvents: {
          list: vi.fn(),
          retrieve: vi.fn().mockResolvedValue({
            item: {
              action: "iam.users.create",
              auditEventId: "audit-1",
              createdAt: "2026-07-06T00:00:00Z",
              detailJson: '{"userId":"u1"}',
              environment: "prod",
              resourceType: "user",
              tenantId: "100001",
            },
          }),
        },
        securityEvents: {
          list: vi.fn(),
          retrieve: vi.fn().mockResolvedValue({
            item: {
              category: "session.revoked",
              detailJson: '{"sessionId":"s1"}',
              securityEventId: "sec-1",
              severity: "info",
              tenantId: "100001",
            },
          }),
        },
      },
    };

    const controller = createSdkworkIamAuditController({ service: service as never });

    await expect(controller.retrieveAuditEvent("audit-1")).resolves.toMatchObject({
      id: "audit-1",
      detailJson: '{"userId":"u1"}',
    });
    await expect(controller.retrieveSecurityEvent("sec-1")).resolves.toMatchObject({
      id: "sec-1",
      detailJson: '{"sessionId":"s1"}',
    });

    expect(service.iam.auditEvents.retrieve).toHaveBeenCalledWith("audit-1");
    expect(service.iam.securityEvents.retrieve).toHaveBeenCalledWith("sec-1");
  });
});
