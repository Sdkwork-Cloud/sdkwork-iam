import { spawnSync } from 'node:child_process';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const packageRootDir = path.resolve(import.meta.dirname, '..');

describe('@sdkwork/iam-contracts runtime entrypoint', () => {
  it('can be imported through package exports by native Node', () => {
    const result = spawnSync(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        [
          "const module = await import('@sdkwork/iam-contracts');",
          "if (module.PLATFORM_ORGANIZATION_ID !== '0') {",
          "  throw new Error('missing IAM login-context export');",
          '}',
        ].join('\n'),
      ],
      {
        cwd: packageRootDir,
        encoding: 'utf8',
      },
    );

    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
  });
});
