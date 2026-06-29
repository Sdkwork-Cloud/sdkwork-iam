#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iamRoot = path.resolve(__dirname, '../..');
const clientPath = path.join(
  iamRoot,
  'sdks/sdkwork-iam-open-sdk/sdkwork-iam-open-sdk-typescript/generated/server-openapi/src/http/client.ts',
);

const UNWRAP_METHOD = `  private unwrapSdkworkV3Payload<T>(payload: unknown): T {
    if (!HttpClient.SDKWORK_V3_UNWRAP || payload == null || typeof payload !== 'object') {
      return payload as T;
    }

    const record = payload as Record<string, unknown>;
    if (record.code !== 0 || !('data' in record)) {
      return payload as T;
    }

    const data = record.data;
    if (!data || typeof data !== 'object') {
      return data as T;
    }

    const envelopeData = data as Record<string, unknown>;
    if ('items' in envelopeData && 'pageInfo' in envelopeData) {
      return data as T;
    }
    if ('accepted' in envelopeData) {
      return data as T;
    }
    if ('item' in envelopeData) {
      return envelopeData.item as T;
    }

    return data as T;
  }
`;

export function patchIamOpenSdkTypescriptV3Unwrap() {
  let source = readFileSync(clientPath, 'utf8');
  if (source.includes('private unwrapSdkworkV3Payload')) {
    return;
  }

  source = source.replace(
    '  setApiKey(apiKey: string): void {\n    this.getInternalAuthConfig().apiKey = apiKey;\n  }',
    `${UNWRAP_METHOD}\n  setApiKey(apiKey: string): void {\n    this.getInternalAuthConfig().apiKey = apiKey;\n  }`,
  );

  writeFileSync(clientPath, source, 'utf8');
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}` || process.argv[1]?.endsWith('patch-iam-open-sdk-typescript-v3-unwrap.mjs')) {
  patchIamOpenSdkTypescriptV3Unwrap();
  console.log('Patched IAM open SDK TypeScript v3 response unwrap.');
}
