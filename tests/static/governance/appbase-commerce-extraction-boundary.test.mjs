import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  APPBASE_OPENAPI_MATERIALIZED_FILES,
  APPBASE_SDK_FAMILY_ROOTS,
} from "./appbase-sdk-family-surfaces.mjs";

const appbaseRoot = path.resolve(import.meta.dirname, '../../..');
const specsRoot = path.resolve(appbaseRoot, "..", "..", "specs");

const removedCommerceRoots = [
  "packages/common/commerce",
  "packages/native-rust/commerce",
  "packages/pc-react/commerce",
  "packages/mobile-react/commerce",
  "packages/mobile-flutter/commerce",
];

const ownershipFiles = [
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "tsconfig.base.json",
  "README.md",
  "specs/appbase-capabilities.yaml",
  "tools/catalog/package-catalog.mjs",
  "scripts/run-appbase-test-suite.mjs",
  "tools/generators/materialize-appbase-v3-openapi-boundaries.mjs",
  "packages/pc-react/foundation/sdkwork-appbase-pc-react/src/catalog.ts",
  "packages/pc-react/foundation/sdkwork-appbase-pc-react/src/domain.ts",
  "packages/mobile-react/foundation/sdkwork-appbase-mobile-react/src/catalog.ts",
  "packages/mobile-react/foundation/sdkwork-appbase-mobile-react/src/domain.ts",
];

const appbaseDesignDebtFiles = [
  "docs/superpowers/plans/2026-05-21-sdkwork-open-platform-chat-agent.md",
  "docs/superpowers/specs/2026-05-21-sdkwork-open-platform-chat-agent-design.md",
  "docs/superpowers/specs/2026-05-26-sdkwork-appbase-app-template-storage-design.md",
];

const appbaseExampleDebtFiles = [
];

const centralSpecBoundaryFiles = [
  "RUST_RPC_SPEC.md",
];

const sdkFamilies = APPBASE_SDK_FAMILY_ROOTS;

const userCenterCoreRoots = [
  "packages/pc-react/iam/sdkwork-user-center-core-pc-react/src",
  "packages/pc-react/iam/sdkwork-user-center-core-pc-react/native/tauri-rust/src",
];

const activeAppbaseCommerceDebtFiles = [
  "packages/common/integration/sdkwork-platform/package.json",
  "packages/common/integration/sdkwork-platform/README.md",
  "packages/common/integration/sdkwork-platform/src/index.ts",
  "packages/common/integration/sdkwork-platform/src/platform-types.ts",
  "packages/common/integration/sdkwork-platform/tests/platform.standard.test.ts",
  "packages/pc-react/integration/sdkwork-open-platform-admin-pc-react/README.md",
  "packages/pc-react/integration/sdkwork-open-platform-admin-pc-react/src",
  "packages/pc-react/integration/sdkwork-open-platform-admin-pc-react/tests",
  "packages/pc-react/notification/sdkwork-notification-pc-react/src",
  "packages/pc-react/notification/sdkwork-notification-pc-react/tests",
  "packages/pc-react/system/sdkwork-settings-pc-react/src",
  "packages/pc-react/system/sdkwork-settings-pc-react/tests",
  "packages/pc-react/iam/sdkwork-user-pc-react/src",
  "packages/pc-react/iam/sdkwork-user-pc-react/tests",
];

const trackedCommerceOwnershipAllowPaths = [
  /^tests\/static\/governance\/appbase-commerce-extraction-boundary\.test\.mjs$/,
  /^tests\/static\/governance\/sdkwork-brand-standard\.test\.mjs$/,
  /^tests\/static\/governance\/iam-bootstrap-subject-workspace-alignment\.test\.mjs$/,
  /^tests\/static\/governance\/iam-module-federation-standard\.test\.mjs$/,
  /^iam\/modules\//,
  /^iam\/registry\//,
  /^packages\/pc-react\/foundation\/sdkwork-appbase-pc-react\/tests\/catalog\.test\.ts$/,
  /^packages\/pc-react\/iam\/sdkwork-user-center-core-pc-react\/tests\//,
  /^packages\/pc-react\/iam\/sdkwork-user-center-core-pc-react\/native\/tauri-rust\/tests\//,
  /^packages\/native-rust\/iam\//,
  /^packages\/common\/iam\//,
  /^packages\/pc-react\/iam\/sdkwork-iam-organization-pc-react\//,
  /^packages\/pc-react\/iam\/sdkwork-iam-core-pc-react\//,
];

const trackedCommerceOwnershipRules = [
  [
    "commerce-package-import",
    /@sdkwork\/(?:commerce|commerce-service|commerce-runtime|commerce-contracts|commerce-sdk-ports|order|payment|billing|checkout|pricing|wallet|coupon|offer|points|invoice|subscription|membership-purchase|membership-admin)(?:\b|-)/iu,
  ],
  [
    "commerce-package-name",
    /sdkwork-(?:commerce|order|payment|billing|checkout|pricing|wallet|coupon|offer|points|invoice|subscription|membership-purchase|membership-admin)(?:\b|-)/iu,
  ],
  [
    "commerce-api-path",
    /\/(?:app|backend|open)\/v3\/api\/(?:commerce|catalog|products|orders|payments|billing|checkout|wallet|subscriptions|memberships|pricing|invoices|refunds|coupons|offers|recharges|fulfillments|shipments)\b/iu,
  ],
  [
    "commerce-table",
    /\bcommerce_(?:product|order|payment|billing|checkout|wallet|subscription|membership|pricing|invoice|refund|coupon|recharge|cart|inventory)\b/iu,
  ],
  [
    "legacy-pay-binding",
    /\b(?:payBinding|PayBinding|payment binding|payment account|payment channel|payment intent|open_platform_pay_binding)\b/iu,
  ],
  [
    "wallet-account-money",
    /\b(?:wallet|account balance|availableBalance|frozenBalance|tokenBalance|point_balance|total_recharged_points)\b/iu,
  ],
];

const openApiFiles = APPBASE_OPENAPI_MATERIALIZED_FILES;

function readWorkspaceFile(relativePath) {
  return fs.readFileSync(path.join(appbaseRoot, relativePath), "utf8");
}

function parseJsonLikeOpenApi(relativePath) {
  return JSON.parse(readWorkspaceFile(relativePath));
}

function collectTextFiles(targetPath) {
  if (!fs.existsSync(targetPath)) {
    return [];
  }

  const stat = fs.statSync(targetPath);
  if (stat.isFile()) {
    return [targetPath];
  }

  const entries = fs.readdirSync(targetPath, { withFileTypes: true });
  return entries.flatMap((entry) => {
    if (entry.name === "node_modules" || entry.name === "target" || entry.name === ".git") {
      return [];
    }

    return collectTextFiles(path.join(targetPath, entry.name));
  });
}

function collectOperations(document) {
  const operations = [];
  for (const [routePath, pathItem] of Object.entries(document.paths ?? {})) {
    for (const [method, operation] of Object.entries(pathItem ?? {})) {
      if (!["get", "post", "patch", "put", "delete"].includes(method)) {
        continue;
      }
      operations.push({ routePath, method, operation });
    }
  }
  return operations;
}

function collectTrackedCommerceOwnershipViolations() {
  const trackedFiles = execFileSync("git", ["ls-files"], {
    cwd: appbaseRoot,
    encoding: "utf8",
  })
    .split(/\r?\n/u)
    .filter(Boolean);
  const textFilePattern = /\.(?:ts|tsx|js|mjs|json|yaml|yml|md|rs|toml|sql|proto|java|py|php|cs|go)$/iu;
  const skippedPathPattern = /(?:^|\/)(?:node_modules|target|dist|coverage|\.git)\//u;
  const violations = [];

  for (const relativePath of trackedFiles) {
    const normalizedPath = relativePath.replaceAll("\\", "/");
    if (
      !textFilePattern.test(normalizedPath) ||
      skippedPathPattern.test(normalizedPath) ||
      trackedCommerceOwnershipAllowPaths.some((pattern) => pattern.test(normalizedPath))
    ) {
      continue;
    }

    let content;
    try {
      content = fs.readFileSync(path.join(appbaseRoot, normalizedPath), "utf8");
    } catch {
      continue;
    }

    for (const [ruleName, pattern] of trackedCommerceOwnershipRules) {
      const match = content.match(pattern);
      if (match) {
        violations.push(`${ruleName}: ${normalizedPath}: ${match[0].slice(0, 120)}`);
      }
    }
  }

  return violations;
}

test("appbase no longer owns commerce source packages or placeholder architecture domains", () => {
  const existingRoots = removedCommerceRoots.filter((relativePath) =>
    fs.existsSync(path.join(appbaseRoot, relativePath)),
  );

  assert.deepEqual(existingRoots, []);
});

test("appbase workspace metadata has no commerce package ownership wiring", () => {
  const violations = ownershipFiles.flatMap((relativePath) => {
    const fullPath = path.join(appbaseRoot, relativePath);
    if (!fs.existsSync(fullPath)) {
      return [];
    }

    const content = fs.readFileSync(fullPath, "utf8");
    return [
      /packages\/(?:common|native-rust|pc-react|mobile-react|mobile-flutter)\/commerce/u,
      /@sdkwork\/commerce-[a-z-]*/u,
      /@sdkwork\/(?:billing|checkout|coupon|entitlement|invoice|offer|order|payment|points|pricing|subscription|membership|wallet)-pc-react/u,
      /run-commerce-standard-contracts/u,
      /test:commerce-standard-contracts/u,
      /^\s*-\s*id:\s*commerce\s*$/mu,
      /^\s*domain:\s*["']?commerce["']?,?\s*$/mu,
      /owner:\s*sdkwork-appbase[\s\S]{0,500}commerce/u,
      /\bpurchase states?\b/iu,
      /\bpayment binding(?:s)?\b/iu,
      /\bpay bindings?\b/iu,
      /\bsdkwork-model-purchase\b/u,
    ].flatMap((pattern) => {
      const match = content.match(pattern);
      return match ? [`${relativePath}: ${match[0].slice(0, 120)}`] : [];
    });
  });

  assert.deepEqual(violations, []);
});

test("appbase design docs do not retain appbase-owned commerce or payment binding scope", () => {
  const violations = appbaseDesignDebtFiles.flatMap((relativePath) => {
    const fullPath = path.join(appbaseRoot, relativePath);
    if (!fs.existsSync(fullPath)) {
      return [];
    }

    const content = fs.readFileSync(fullPath, "utf8");
    return [
      /\bpayment binding(?:s)?\b/iu,
      /\bpay bindings?\b/iu,
      /\bPlatformPay(?:Mode|Scene|Spec|Binding)?\b/u,
      /\bopen_platform_pay_binding\b/u,
      /\bpayment account\b/iu,
      /\bpayment channel\b/iu,
      /\bpayment intent\b/iu,
      /\brefund\b/iu,
      /\breconciliation\b/iu,
      /\bcommerce\b/iu,
      /\bpricing\b/iu,
      /\bbilling\b/iu,
      /\bledger semantics\b/iu,
    ].flatMap((pattern) => {
      const match = content.match(pattern);
      return match ? [`${relativePath}: ${match[0].slice(0, 120)}`] : [];
    });
  });

  assert.deepEqual(violations, []);
});

test("appbase package examples do not use commerce incidents as neutral sample data", () => {
  const violations = appbaseExampleDebtFiles.flatMap((relativePath) => {
    const fullPath = path.join(appbaseRoot, relativePath);
    if (!fs.existsSync(fullPath)) {
      return [];
    }

    const content = fs.readFileSync(fullPath, "utf8");
    return [
      /\bPayment API\b/u,
      /\bpayment latency\b/iu,
      /\bbilling incident\b/iu,
    ].flatMap((pattern) => {
      const match = content.match(pattern);
      return match ? [`${relativePath}: ${match[0].slice(0, 120)}`] : [];
    });
  });

  assert.deepEqual(violations, []);
});

test("central specs do not document commerce packages under sdkwork-appbase", () => {
  const violations = centralSpecBoundaryFiles.flatMap((relativePath) => {
    const fullPath = path.join(specsRoot, relativePath);
    if (!fs.existsSync(fullPath)) {
      return [];
    }

    const content = fs.readFileSync(fullPath, "utf8");
    return [
      /apps[\\/]sdkwork-appbase[\\/]packages[\\/]native-rust[\\/](?:commerce|payment|billing|wallet|order|subscription|membership|invoice|refund|checkout)\b/iu,
      /apps[\\/]sdkwork-appbase[\\/]packages[\\/]common[\\/](?:commerce|payment|billing|wallet|order|subscription|membership|invoice|refund|checkout)\b/iu,
      /apps[\\/]sdkwork-appbase[\\/]packages[\\/]pc-react[\\/](?:commerce|payment|billing|wallet|order|subscription|membership|invoice|refund|checkout)\b/iu,
    ].flatMap((pattern) => {
      const match = content.match(pattern);
      return match ? [`${relativePath}: ${match[0]}`] : [];
    });
  });

  assert.deepEqual(violations, []);
});

test("appbase OpenAPI authority specs do not expose commerce operations", () => {
  const violations = openApiFiles.flatMap((relativePath) => {
    const document = parseJsonLikeOpenApi(relativePath);
    return collectOperations(document).flatMap(({ routePath, method, operation }) => {
      if (operation?.["x-sdkwork-domain"] !== "commerce") {
        return [];
      }

      return [`${relativePath}: ${method.toUpperCase()} ${routePath} ${operation.operationId}`];
    });
  });

  assert.deepEqual(violations, []);
});

test("appbase generated SDK outputs do not expose commerce resource clients", () => {
  const files = sdkFamilies.flatMap((familyRoot) =>
    collectTextFiles(path.join(appbaseRoot, familyRoot)).filter((filePath) =>
      filePath.includes(`${path.sep}generated${path.sep}server-openapi${path.sep}`) ||
      filePath.includes(`${path.sep}src${path.sep}`),
    ),
  );

  const violations = files.flatMap((filePath) => {
    const relativePath = path.relative(appbaseRoot, filePath).replaceAll("\\", "/");
    const content = fs.readFileSync(filePath, "utf8");
    const patterns = [
      /\bCommerce[A-Za-z]*Api\b/u,
      /\bcommerceReports\b/u,
      /\bclient\.commerce\b/u,
      /\/(?:app|backend)\/v3\/api\/(?:catalog|orders|payments|wallet|billing|invoices|promotions|memberships|recharges|fulfillments|shipments|commerce_reports)\b/u,
      /\/backend\/v3\/api\/reports\/commerce_overview\b/u,
      /\/backend\/v3\/api\/audit\/commerce_events\b/u,
    ];

    return patterns.flatMap((pattern) => {
      const match = content.match(pattern);
      return match ? [`${relativePath}: ${match[0]}`] : [];
    });
  });

  assert.deepEqual(violations, []);
});

test("appbase user-center keeps IAM organization membership but does not own commercial membership projection", () => {
  const files = userCenterCoreRoots.flatMap((relativePath) =>
    collectTextFiles(path.join(appbaseRoot, relativePath)),
  );

  const violations = files.flatMap((filePath) => {
    const relativePath = path.relative(appbaseRoot, filePath).replaceAll("\\", "/");
    const content = fs.readFileSync(filePath, "utf8");
    const patterns = [
      /\/memberships\/current/u,
      /\bIamMembership\b/u,
      /\bUserCenterMembership(?:Payload|Record|Snapshot)\b/u,
      /\bUpdateUserCenterMembershipRequest\b/u,
      /\bmembership_level_id\b/u,
      /\bpoint_balance\b/u,
      /\btotal_recharged_points\b/u,
      /\b(?:get|read|update|upsert|request)_membership\b/u,
      /\b(?:get|update)Membership\b/u,
      /(?:^|[^A-Za-z0-9-])membership-service\b/u,
      /(?:^|[^A-Za-z0-9-])membership-repository\b/u,
      /\baccountSummary\b/u,
      /\baccount_summary\b/u,
      /\/accounts\/current\/summary/u,
      /\baccount\.summary\.get\b/u,
      /\bavailable(?:Balance|Points)\b/u,
      /\bfrozen(?:Balance|Points|TokenBalance)\b/u,
      /\bfrozenToken\b/u,
      /\btokenBalance\b/u,
      /\baccount balance\b/iu,
    ];

    return patterns.flatMap((pattern) => {
      const match = content.match(pattern);
      return match ? [`${relativePath}: ${match[0]}`] : [];
    });
  });

  assert.deepEqual(violations, []);
});

test("appbase active packages do not keep product, order, payment, wallet, or commercial access debt", () => {
  const files = activeAppbaseCommerceDebtFiles.flatMap((relativePath) =>
    collectTextFiles(path.join(appbaseRoot, relativePath)),
  );

  const violations = files.flatMap((filePath) => {
    const relativePath = path.relative(appbaseRoot, filePath).replaceAll("\\", "/");
    const content = fs.readFileSync(filePath, "utf8");
    const patterns = [
      /\bbilling\b/iu,
      /\binvoice(?:s)?\b/iu,
      /\bpayment(?:s)?\b/iu,
      /\bpayBinding(?:s)?\b/u,
      /\bPayBinding(?:s)?\b/u,
      /\bopen_platform_pay_binding\b/u,
      /\/pay_bindings\b/u,
      /\bbillingMeter\b/u,
      /\bPlatformPay(?:Mode|Scene|Spec)?\b/u,
      /(?:^|[^A-Za-z0-9])pay(?:[^A-Za-z0-9]|$)/iu,
      /\bwallet\b/iu,
      /\baccount balance\b/iu,
      /\bavailable(?:Balance|Points)\b/u,
      /\bfrozen(?:Balance|Points|TokenBalance)\b/u,
      /\btokenBalance\b/u,
      /\bpurchase(?:d|Mode|Route|Intent|Required| states?| routing)?\b/iu,
      /\bpricing(?:Tiers?)?\b/u,
      /\bPricing(?:Tier)?\b/u,
      /\bprice-ascending\b/u,
      /\bbudget(?:-fit)?\b/iu,
      /(?:^|[^A-Za-z0-9])(?:free|paid|premium)(?:[^A-Za-z0-9]|$)/iu,
      /\bsubscriptionTier\b/u,
      /\bplan-required\b/u,
      /\bupgrade-required\b/u,
    ];

    return patterns.flatMap((pattern) => {
      const match = content.match(pattern);
      return match ? [`${relativePath}: ${match[0]}`] : [];
    });
  });

  assert.deepEqual(violations, []);
});

test("appbase tracked files do not keep hidden commerce ownership markers", () => {
  assert.deepEqual(collectTrackedCommerceOwnershipViolations(), []);
});
