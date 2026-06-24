import type {
  UserCenterBridgeConfig,
  UserCenterRuntimeRequestMethod,
  UserCenterServerOperationContract,
  UserCenterServerRouteKey,
} from "../types/userCenterTypes.ts";
import { createUserCenterCanonicalServerOperations } from "./userCenterCanonicalRoutes.ts";

export interface UserCenterSurfaceRouteBinding<
  TContractKey extends string,
  TOperationId extends string = string,
> {
  contractKey: TContractKey;
  operationId: TOperationId;
  routeKey: UserCenterServerRouteKey;
  summary?: string;
}

export interface UserCenterResolvedSurfaceRoute<
  TContractKey extends string,
  TOperationId extends string = string,
  TSurface extends string = string,
  TAuthMode extends string = string,
> {
  authMode: TAuthMode;
  contractKey: TContractKey;
  method: UserCenterRuntimeRequestMethod;
  operationId: TOperationId;
  path: string;
  routeKey: UserCenterServerRouteKey;
  summary: string;
  surface: TSurface;
}

function createServerOperationRecord(
  bridgeConfig: UserCenterBridgeConfig,
): ReadonlyMap<UserCenterServerRouteKey, UserCenterServerOperationContract> {
  return new Map(
    createUserCenterCanonicalServerOperations(bridgeConfig).map((operation) => [
      operation.routeKey,
      operation,
    ]),
  );
}

export function createUserCenterSurfaceRouteRecord<
  TContractKey extends string,
  TOperationId extends string = string,
  TSurface extends string = string,
  TAuthMode extends string = string,
>(
  bridgeConfig: UserCenterBridgeConfig,
  bindings: readonly UserCenterSurfaceRouteBinding<TContractKey, TOperationId>[],
  options: {
    authMode: TAuthMode;
    surface: TSurface;
  },
): Record<
  TContractKey,
  UserCenterResolvedSurfaceRoute<TContractKey, TOperationId, TSurface, TAuthMode>
> {
  const operations = createServerOperationRecord(bridgeConfig);

  return Object.fromEntries(
    bindings.map((binding) => {
      const operation = operations.get(binding.routeKey);
      if (!operation) {
        throw new Error(
          `User-center route binding "${binding.contractKey}" references unknown canonical route key "${binding.routeKey}".`,
        );
      }

      return [
        binding.contractKey,
        {
          authMode: options.authMode,
          contractKey: binding.contractKey,
          method: operation.method,
          operationId: binding.operationId,
          path: operation.path,
          routeKey: binding.routeKey,
          summary: binding.summary ?? operation.summary,
          surface: options.surface,
        },
      ];
    }),
  ) as Record<
    TContractKey,
    UserCenterResolvedSurfaceRoute<TContractKey, TOperationId, TSurface, TAuthMode>
  >;
}
