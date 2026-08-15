import { describe, expect, it } from "vitest";

import {
  buildSdkWorkListQuery,
  buildNextSdkWorkListQuery,
  createSdkWorkPagedListSession,
  extractSdkWorkListItems,
  extractSdkWorkListPage,
  extractSdkWorkResourceItem,
  extractSdkWorkTreeNodes,
  mergeSdkWorkListPage,
  resolveSdkWorkListQuery,
  SDKWORK_DEFAULT_LIST_PAGE_SIZE,
} from "../src/list-page.js";

describe("@sdkwork/iam-contracts list-page helpers", () => {
  it("extracts items from SdkWorkPageData and rejects legacy records", () => {
    expect(extractSdkWorkListItems({ items: [{ id: "1" }] })).toEqual([{ id: "1" }]);
    expect(extractSdkWorkListItems({ data: { items: [{ id: "2" }] } })).toEqual([{ id: "2" }]);
    expect(extractSdkWorkListItems({ records: [{ id: "legacy" }] })).toEqual([]);
  });

  it("unwraps pageInfo alongside items", () => {
    expect(
      extractSdkWorkListPage({
        items: [{ id: "1" }],
        pageInfo: { mode: "offset", page: 1, pageSize: 20, totalItems: "1", hasMore: false },
      }),
    ).toMatchObject({
      items: [{ id: "1" }],
      pageInfo: { mode: "offset", page: 1, pageSize: 20, totalItems: "1", hasMore: false },
    });
  });

  it("extracts tree nodes from SdkWorkResourceResponse shapes", () => {
    const nodes = [{ organizationId: "org-1", children: [] }];
    expect(extractSdkWorkTreeNodes({ nodes })).toEqual(nodes);
    expect(extractSdkWorkTreeNodes({ item: { nodes } })).toEqual(nodes);
    expect(extractSdkWorkTreeNodes({ data: { item: { nodes } } })).toEqual(nodes);
  });

  it("extracts resource items from envelope and SDK-unwrapped shapes", () => {
    const resource = { auditEventId: "audit-1", action: "iam.users.create" };
    expect(extractSdkWorkResourceItem({ item: resource })).toEqual(resource);
    expect(extractSdkWorkResourceItem({ data: { item: resource } })).toEqual(resource);
    // SDK clients unwrap `data.item` (`sdkworkUnwrapKind: "item"`), so a bare
    // resource object is the item itself and must not be dropped.
    expect(extractSdkWorkResourceItem(resource)).toEqual(resource);
    expect(extractSdkWorkResourceItem(null)).toBeUndefined();
    expect(extractSdkWorkResourceItem("audit-1")).toBeUndefined();
  });

  it("builds canonical offset list query wire params", () => {
    expect(buildSdkWorkListQuery({ page: 2, pageSize: 20, q: "alice" })).toEqual({
      page: 2,
      page_size: 20,
      q: "alice",
    });
  });

  it("applies default page_size and preserves domain filters", () => {
    expect(resolveSdkWorkListQuery()).toEqual({ page_size: SDKWORK_DEFAULT_LIST_PAGE_SIZE });
    expect(resolveSdkWorkListQuery({ organizationId: "org-1", pageSize: 50 })).toEqual({
      organizationId: "org-1",
      page_size: 50,
    });
    expect(resolveSdkWorkListQuery({ page_size: 20, tenantId: "t1" })).toEqual({
      page_size: 20,
      tenantId: "t1",
    });
  });

  it("does not combine page and cursor in buildSdkWorkListQuery", () => {
    expect(buildSdkWorkListQuery({ page: 2, cursor: "k:2026-01-01|audit-1" })).toEqual({
      cursor: "k:2026-01-01|audit-1",
      page_size: SDKWORK_DEFAULT_LIST_PAGE_SIZE,
    });
  });

  it("builds next offset and cursor list queries from pageInfo", () => {
    expect(
      buildNextSdkWorkListQuery(undefined, {
        mode: "offset",
        page: 1,
        pageSize: 20,
        hasMore: true,
      }),
    ).toEqual({ page: 2, page_size: 20 });
    expect(
      buildNextSdkWorkListQuery({ organizationId: "org-1" }, {
        mode: "cursor",
        nextCursor: "cursor-2",
        hasMore: true,
      }),
    ).toEqual({ organizationId: "org-1", cursor: "cursor-2", page_size: 20 });
  });

  it("merges appended list pages without client-side slicing", () => {
    expect(
      mergeSdkWorkListPage(
        [{ id: "1" }],
        {
          items: [{ id: "2" }],
          pageInfo: { mode: "offset", page: 2, pageSize: 20, hasMore: false },
        },
        "append",
      ).items,
    ).toEqual([{ id: "1" }, { id: "2" }]);
  });

  it("tracks server-backed pages through createSdkWorkPagedListSession", async () => {
    let callCount = 0;
    const session = createSdkWorkPagedListSession({
      fetchPage: async (query) => {
        callCount += 1;
        if (query.page === 2) {
          return {
            items: [{ id: "2" }],
            pageInfo: { mode: "offset", page: 2, pageSize: 20, hasMore: false, totalItems: "2" },
          };
        }
        return {
          items: [{ id: "1" }],
          pageInfo: { mode: "offset", page: 1, pageSize: 20, hasMore: true, totalItems: "2" },
        };
      },
      mapItem: (value) => value as { id: string },
    });

    await expect(session.list()).resolves.toEqual([{ id: "1" }]);
    expect(session.getPageInfo()).toMatchObject({ hasMore: true, page: 1 });
    await expect(session.loadMore()).resolves.toEqual([{ id: "1" }, { id: "2" }]);
    expect(session.getPageInfo()?.hasMore).toBe(false);
    expect(callCount).toBe(2);
  });
});
