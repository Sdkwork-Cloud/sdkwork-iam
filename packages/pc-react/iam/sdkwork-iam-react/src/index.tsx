import { createContext, useContext, useMemo, type ReactNode } from "react";

import {
  createIamRuntime,
  createMemoryIamContextStore,
  createMemoryIamTokenStore,
  type CreateIamRuntimeInput,
  type IamRuntime,
} from "@sdkwork/iam-runtime";

const IamRuntimeContext = createContext<IamRuntime | undefined>(undefined);

export type IamRuntimeProviderProps = CreateIamRuntimeInput & {
  children: ReactNode;
};

export interface IamProviderProps {
  children: ReactNode;
  runtime: IamRuntime;
}

export function IamRuntimeProvider({
  children,
  clients,
  config,
  contextStore,
  localeProvider,
  tokenManager,
  tokenStore,
}: IamRuntimeProviderProps) {
  const runtime = useMemo(
    () => createIamRuntime({ clients, config, contextStore, localeProvider, tokenManager, tokenStore }),
    [clients, config, contextStore, localeProvider, tokenManager, tokenStore],
  );

  return <IamProvider runtime={runtime}>{children}</IamProvider>;
}

export function IamProvider({ children, runtime }: IamProviderProps) {
  return (
    <IamRuntimeContext.Provider value={runtime}>
      {children}
    </IamRuntimeContext.Provider>
  );
}

export function useIamRuntime(): IamRuntime {
  const runtime = useContext(IamRuntimeContext);

  if (!runtime) {
    throw new Error("useIamRuntime must be used inside IamProvider");
  }

  return runtime;
}

export function useIamService() {
  return useIamRuntime().service;
}

export {
  createIamRuntime,
  createMemoryIamContextStore,
  createMemoryIamTokenStore,
};

export type {
  CreateIamRuntimeInput,
  IamRuntime,
  IamRuntimeConfig,
  IamTokenStore,
} from "@sdkwork/iam-runtime";
