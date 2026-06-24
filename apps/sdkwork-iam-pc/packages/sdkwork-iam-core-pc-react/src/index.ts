export {
  SDKWORK_IAM_API_ROUTES,
  SDKWORK_IAM_CAPABILITIES,
  SDKWORK_IAM_DOMAIN_MODELS,
  SDKWORK_IAM_HEADERS,
  SDKWORK_IAM_OPERATION_IDS,
  SDKWORK_IAM_STANDARD,
  SDKWORK_IAM_TABLES,
  createIamAppContext,
  createIamShardingContext,
} from "@sdkwork/iam-contracts";

export {
  assertIamAppSdkClient,
  assertIamBackendSdkClient,
  getIamSdkSurface,
} from "@sdkwork/iam-sdk-ports";

export {
  createSdkworkIamService,
} from "@sdkwork/iam-service";

export type {
  IamAppContext,
  IamAuthLevel,
  IamCapabilityContract,
  IamCapabilityName,
  IamDeploymentMode,
  IamDomainModelContract,
  IamDomainModelName,
  IamDomainModelOwnership,
  IamEnvironment,
  IamOperationContract,
  IamShardingContext,
  IamShardingStrategy,
} from "@sdkwork/iam-contracts";

export type {
  CreateIamSdkAdaptersInput,
  IamSdkAdapters,
} from "@sdkwork/iam-sdk-adapter";

export type {
  IamAppIamResourceClient,
  IamAppSdkClient,
  IamBackendIamResourceClient,
  IamBackendSdkClient,
  IamSdkResourceClient,
} from "@sdkwork/iam-sdk-ports";

export type {
  CreateSdkworkIamServiceInput,
  IamCreateSessionInput,
  IamRefreshSessionInput,
  IamSession,
  IamStoredSession,
  IamUser,
  SdkworkIamService,
} from "@sdkwork/iam-service";

export type {
  CreateIamRuntimeInput,
  IamContextStore,
  IamRuntime,
  IamRuntimeConfig,
  IamTokenStore,
} from "@sdkwork/iam-runtime";

export interface SdkworkIamDomainRecord {
  apiTags: readonly string[];
  databasePrefix: string;
  domain: string;
  sdkNamespaces: readonly string[];
}

export interface SdkworkIamModuleRecord {
  architecture: "pc-react";
  capability: "iam-core";
  domain: "iam";
  name: "@sdkwork/iam-core-pc-react";
  packageType: "service";
  version: string;
}

export const SDKWORK_IAM_CORE_DOMAIN_RECORD = {
  apiTags: ["auth", "iam"],
  databasePrefix: "iam",
  domain: "iam",
  sdkNamespaces: ["auth", "iam"],
} as const satisfies SdkworkIamDomainRecord;

export const SDKWORK_IAM_CORE_MODULE = {
  architecture: "pc-react",
  capability: "iam-core",
  domain: "iam",
  name: "@sdkwork/iam-core-pc-react",
  packageType: "service",
  version: "0.1.0",
} as const satisfies SdkworkIamModuleRecord;

export type SdkworkIamUser = import("@sdkwork/iam-service").IamUser;
export type SdkworkIamSession = import("@sdkwork/iam-service").IamSession;
export type SdkworkIamStoredSession = import("@sdkwork/iam-service").IamStoredSession;
export type SdkworkIamCreateSessionInput = import("@sdkwork/iam-service").IamCreateSessionInput;
export type SdkworkIamRefreshSessionInput = import("@sdkwork/iam-service").IamRefreshSessionInput;
export type SdkworkIamAppClient = import("@sdkwork/iam-sdk-ports").IamAppSdkClient;
export type SdkworkIamAppResourceClient = import("@sdkwork/iam-sdk-ports").IamAppIamResourceClient;
export type SdkworkIamBackendClient = import("@sdkwork/iam-sdk-ports").IamBackendSdkClient;
export type SdkworkIamBackendResourceClient = import("@sdkwork/iam-sdk-ports").IamBackendIamResourceClient;
export type SdkworkIamResourceClient = import("@sdkwork/iam-sdk-ports").IamSdkResourceClient;
