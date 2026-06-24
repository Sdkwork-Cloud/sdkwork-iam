import type {
  UserCenterAuthInteropContract,
  UserCenterAuthInteropDiff,
  UserCenterAuthInteropMismatch,
  UserCenterAuthPreflightReport,
  UserCenterAuthProfile,
  UserCenterAuthValidationStrategy,
  UserCenterSecretResolution,
  UserCenterTokenHeaders,
} from "../types/userCenterTypes.ts";

type UserCenterAuthInteropScalar = string | boolean | number;
type UserCenterAuthInteropSource = UserCenterAuthInteropContract | UserCenterAuthProfile;

interface UserCenterAuthPreflightOptions {
  peerContract: UserCenterAuthInteropContract;
  source: UserCenterAuthInteropSource;
}

function isAuthProfile(source: UserCenterAuthInteropSource): source is UserCenterAuthProfile {
  return "mode" in source && !("authMode" in source);
}

function cloneValidationStrategy(
  validationStrategy: UserCenterAuthValidationStrategy,
): UserCenterAuthValidationStrategy {
  return validationStrategy;
}

function cloneSecretResolution(
  secretResolution: UserCenterSecretResolution,
): UserCenterSecretResolution {
  return {
    ...secretResolution,
  };
}

function cloneTokenHeaders(tokenHeaders: UserCenterTokenHeaders): UserCenterTokenHeaders {
  return {
    ...tokenHeaders,
  };
}

function cloneHandshake(
  handshake: UserCenterAuthInteropContract["handshake"],
): UserCenterAuthInteropContract["handshake"] {
  return {
    enabled: handshake.enabled,
    freshnessWindowMs: handshake.freshnessWindowMs,
    headerNames: {
      ...handshake.headerNames,
    },
    mode: handshake.mode,
  };
}

function pushInteropMismatch(
  mismatches: UserCenterAuthInteropMismatch[],
  fieldPath: string,
  expected: UserCenterAuthInteropScalar,
  actual: UserCenterAuthInteropScalar,
): void {
  if (expected === actual) {
    return;
  }

  mismatches.push({
    actual,
    expected,
    fieldPath,
  });
}

export function createUserCenterAuthInteropContract(
  source: UserCenterAuthInteropSource,
): UserCenterAuthInteropContract {
  if (isAuthProfile(source)) {
    return {
      authMode: source.mode,
      handshake: cloneHandshake(source.handshake),
      secretResolution: cloneSecretResolution(source.secretResolution),
      tokenHeaders: cloneTokenHeaders(source.tokenHeaders),
      validationStrategy: cloneValidationStrategy(source.validationStrategy),
    };
  }

  return {
    authMode: source.authMode,
    handshake: cloneHandshake(source.handshake),
    secretResolution: cloneSecretResolution(source.secretResolution),
    tokenHeaders: cloneTokenHeaders(source.tokenHeaders),
    validationStrategy: cloneValidationStrategy(source.validationStrategy),
  };
}

export function diffUserCenterAuthInteropContract(
  expected: UserCenterAuthInteropContract,
  actual: UserCenterAuthInteropContract,
): UserCenterAuthInteropDiff {
  const mismatches: UserCenterAuthInteropMismatch[] = [];

  pushInteropMismatch(mismatches, "authMode", expected.authMode, actual.authMode);
  pushInteropMismatch(
    mismatches,
    "validationStrategy",
    expected.validationStrategy,
    actual.validationStrategy,
  );
  pushInteropMismatch(
    mismatches,
    "secretResolution.resolverKind",
    expected.secretResolution.resolverKind,
    actual.secretResolution.resolverKind,
  );
  pushInteropMismatch(
    mismatches,
    "secretResolution.scope",
    expected.secretResolution.scope,
    actual.secretResolution.scope,
  );
  pushInteropMismatch(
    mismatches,
    "secretResolution.tenantClaimKey",
    expected.secretResolution.tenantClaimKey,
    actual.secretResolution.tenantClaimKey,
  );
  pushInteropMismatch(
    mismatches,
    "secretResolution.organizationClaimKey",
    expected.secretResolution.organizationClaimKey,
    actual.secretResolution.organizationClaimKey,
  );

  pushInteropMismatch(
    mismatches,
    "tokenHeaders.authorizationHeaderName",
    expected.tokenHeaders.authorizationHeaderName,
    actual.tokenHeaders.authorizationHeaderName,
  );
  pushInteropMismatch(
    mismatches,
    "tokenHeaders.accessTokenHeaderName",
    expected.tokenHeaders.accessTokenHeaderName,
    actual.tokenHeaders.accessTokenHeaderName,
  );
  pushInteropMismatch(
    mismatches,
    "tokenHeaders.refreshTokenHeaderName",
    expected.tokenHeaders.refreshTokenHeaderName,
    actual.tokenHeaders.refreshTokenHeaderName,
  );
  pushInteropMismatch(
    mismatches,
    "tokenHeaders.sessionHeaderName",
    expected.tokenHeaders.sessionHeaderName,
    actual.tokenHeaders.sessionHeaderName,
  );
  pushInteropMismatch(
    mismatches,
    "tokenHeaders.authorizationScheme",
    expected.tokenHeaders.authorizationScheme,
    actual.tokenHeaders.authorizationScheme,
  );

  pushInteropMismatch(
    mismatches,
    "handshake.enabled",
    expected.handshake.enabled,
    actual.handshake.enabled,
  );
  pushInteropMismatch(
    mismatches,
    "handshake.mode",
    expected.handshake.mode,
    actual.handshake.mode,
  );
  pushInteropMismatch(
    mismatches,
    "handshake.freshnessWindowMs",
    expected.handshake.freshnessWindowMs,
    actual.handshake.freshnessWindowMs,
  );
  pushInteropMismatch(
    mismatches,
    "handshake.headerNames.appIdHeaderName",
    expected.handshake.headerNames.appIdHeaderName,
    actual.handshake.headerNames.appIdHeaderName,
  );
  pushInteropMismatch(
    mismatches,
    "handshake.headerNames.providerKeyHeaderName",
    expected.handshake.headerNames.providerKeyHeaderName,
    actual.handshake.headerNames.providerKeyHeaderName,
  );
  pushInteropMismatch(
    mismatches,
    "handshake.headerNames.secretIdHeaderName",
    expected.handshake.headerNames.secretIdHeaderName,
    actual.handshake.headerNames.secretIdHeaderName,
  );
  pushInteropMismatch(
    mismatches,
    "handshake.headerNames.signatureHeaderName",
    expected.handshake.headerNames.signatureHeaderName,
    actual.handshake.headerNames.signatureHeaderName,
  );
  pushInteropMismatch(
    mismatches,
    "handshake.headerNames.signedAtHeaderName",
    expected.handshake.headerNames.signedAtHeaderName,
    actual.handshake.headerNames.signedAtHeaderName,
  );

  return {
    compatible: mismatches.length === 0,
    mismatches,
  };
}

export function assertUserCenterAuthInteropContract(
  expected: UserCenterAuthInteropContract,
  actual: UserCenterAuthInteropContract,
): void {
  const diff = diffUserCenterAuthInteropContract(expected, actual);
  if (diff.compatible) {
    return;
  }

  const mismatchSummary = diff.mismatches
    .map((mismatch) =>
      `${mismatch.fieldPath} expected ${JSON.stringify(mismatch.expected)} received ${JSON.stringify(mismatch.actual)}`
    )
    .join("; ");
  throw new Error(`User center auth interop contract mismatch: ${mismatchSummary}`);
}

export function createUserCenterAuthPreflightReport(
  options: UserCenterAuthPreflightOptions,
): UserCenterAuthPreflightReport {
  const localContract = createUserCenterAuthInteropContract(options.source);
  const peerContract = createUserCenterAuthInteropContract(options.peerContract);
  const diff = diffUserCenterAuthInteropContract(peerContract, localContract);

  return {
    compatible: diff.compatible,
    diff,
    localContract,
    peerContract,
  };
}

export function assertUserCenterAuthPreflightCompatibility(
  options: UserCenterAuthPreflightOptions,
): UserCenterAuthPreflightReport {
  const report = createUserCenterAuthPreflightReport(options);
  assertUserCenterAuthInteropContract(report.peerContract, report.localContract);
  return report;
}
