import {
  createClient as createGeneratedOpenClient,
  SdkworkCustomClient,
} from '../generated/server-openapi/src/index';
import type { SdkworkCustomConfig } from '../generated/server-openapi/src/types/common';

export { SdkworkCustomClient, createGeneratedOpenClient };
export type { SdkworkCustomConfig };
export * from '../generated/server-openapi/src/types';
export * from '../generated/server-openapi/src/api';
export * from '../generated/server-openapi/src/http';
export * from '../generated/server-openapi/src/auth';

export function createClient(config: SdkworkCustomConfig): SdkworkCustomClient {
  return createGeneratedOpenClient(config);
}
