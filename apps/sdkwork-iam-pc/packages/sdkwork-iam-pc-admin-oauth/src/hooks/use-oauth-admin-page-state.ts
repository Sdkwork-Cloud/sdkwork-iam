import { useCallback, useEffect, useMemo, useState } from "react";
import type { SdkWorkPageInfo } from "@sdkwork/iam-contracts";

import type {
  SdkworkIamOauthAdminController,
  SdkworkIamOauthAdminResourceSnapshot,
  SdkworkIamOauthAdminState,
} from "../types/oauth-admin-types";

type ResourceKey = keyof SdkworkIamOauthAdminResourceSnapshot;

function pickSnapshot(
  snapshot: SdkworkIamOauthAdminResourceSnapshot,
  resourceKeys: readonly ResourceKey[],
): Pick<SdkworkIamOauthAdminResourceSnapshot, ResourceKey> {
  return Object.fromEntries(
    resourceKeys.map((key) => [key, snapshot[key]]),
  ) as Pick<SdkworkIamOauthAdminResourceSnapshot, ResourceKey>;
}

/**
 * Shared page-level state for one OAuth admin page (list data, page info,
 * status, error, and the last retrieved resource detail). Each page owns its
 * resource keys and reloads them together; sections only render the slices
 * they need.
 */
export function useOauthAdminPageState(
  controller: SdkworkIamOauthAdminController,
  resourceKeys: readonly ResourceKey[],
) {
  const resourceKeysKey = resourceKeys.join(",");
  const [data, setData] = useState<Pick<SdkworkIamOauthAdminResourceSnapshot, ResourceKey>>(() =>
    pickSnapshot(controller.getState(), resourceKeys));
  const [listPageInfo, setListPageInfo] = useState(controller.getState().listPageInfo);
  const [status, setStatus] = useState<SdkworkIamOauthAdminState["status"]>(controller.getState().status);
  const [error, setError] = useState<string | undefined>(controller.getState().lastError);
  const [resourceDetail, setResourceDetail] = useState(controller.getState().lastResourceDetail);
  const [diagnosticDetail, setDiagnosticDetail] = useState(controller.getState().lastDiagnosticRunDetail);

  useEffect(() => {
    let cancelled = false;
    void controller.load(resourceKeys).then((snapshot) => {
      if (cancelled) {
        return;
      }
      setData(pickSnapshot(snapshot, resourceKeys));
      setListPageInfo(controller.getState().listPageInfo);
      setStatus(controller.getState().status);
      setError(controller.getState().lastError);
      setResourceDetail(controller.getState().lastResourceDetail);
      setDiagnosticDetail(controller.getState().lastDiagnosticRunDetail);
    }).catch(() => {
      if (cancelled) {
        return;
      }
      setStatus(controller.getState().status);
      setError(controller.getState().lastError);
    });
    return () => {
      cancelled = true;
    };
    // `resourceKeys` is a stable module constant at every call site.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controller, resourceKeysKey]);

  const sync = useCallback(() => {
    setData(pickSnapshot(controller.getState(), resourceKeys));
    setListPageInfo(controller.getState().listPageInfo);
    setStatus(controller.getState().status);
    setError(controller.getState().lastError);
    setResourceDetail(controller.getState().lastResourceDetail);
    setDiagnosticDetail(controller.getState().lastDiagnosticRunDetail);
  }, [controller, resourceKeysKey]);

  const disabled = useMemo(() => status === "loading" || status === "saving", [status]);

  return {
    data,
    diagnosticDetail,
    disabled,
    error,
    listPageInfo,
    resourceDetail,
    status,
    sync,
  };
}
