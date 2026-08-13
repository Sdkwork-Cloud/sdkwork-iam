import { createSdkWorkPagedListSession, type SdkWorkPageInfo } from "@sdkwork/iam-contracts";
import type { SdkworkIamService } from "@sdkwork/iam-service";
import { isBlank, trim } from "@sdkwork/utils";

import type {
  CreateSdkworkIamOauthAdminControllerInput,
  SdkworkIamOauthAccountFollowQrCode,
  SdkworkIamOauthAccountKind,
  SdkworkIamOauthAccountSetupDraft,
  SdkworkIamOauthAdminController,
  SdkworkIamOauthAdminResourceSnapshot,
  SdkworkIamOauthAdminState,
  SdkworkIamOauthClaimMappingDraft,
  SdkworkIamOauthClientDraft,
  SdkworkIamOauthCustomMenuButton,
  SdkworkIamOauthCustomMenuContext,
  SdkworkIamOauthCustomMenuDraft,
  SdkworkIamOauthCustomMenuPublishResult,
  SdkworkIamOauthDiagnosticRunDraft,
  SdkworkIamOauthFlowConfigDraft,
  SdkworkIamOauthIntegrationDraft,
  SdkworkIamOauthOperatorPlatformDraft,
  SdkworkIamOauthPolicyDraft,
  SdkworkIamOauthProviderCatalogDraft,
  SdkworkIamOauthRelyingPartyDraft,
  SdkworkIamOauthResourceAccountDraft,
  SdkworkIamOauthResourceAuthorizationDraft,
  SdkworkIamOauthScopeProfileDraft,
  SdkworkIamOauthSecretDraft,
  SdkworkIamOauthSurfaceDraft,
  SdkworkIamOauthTenantBindingDraft,
  SdkworkIamOauthWebhookConfigDraft,
  SdkworkIamOauthAccountLinkUpdateDraft,
  SdkworkIamOauthOperationalResourceDraft,
  SdkworkIamOauthScanLoginModeEntry,
  SdkworkIamOauthScanLoginPreview,
  SdkworkIamOauthScanLoginSettings,
  SdkworkIamOauthScanLoginWebhookInfo,
} from "../types/oauth-admin-types";
import {
  buildStandardCallbackUri,
  normalizeList,
  readAccountConfig,
  readAccountIntegrationId,
  readDisplayName,
  readIntegrationId,
  readProviderClientId,
  readProviderCode,
  readResourceAccountId,
  readWebhookConfigId,
  splitMultilineList,
  parseRelyingPartyDraftFromTenantApplication,
} from "../utils/oauth-admin-utils";
import { validateCustomMenuDraft } from "../utils/custom-menu-rules";

function accountSetupProvider(kind: SdkworkIamOauthAccountKind): {
  providerCode: string;
  surfaceKind: string;
} {
  return kind === "mini_program"
    ? { providerCode: "wechat_mini_program", surfaceKind: "mini_program" }
    : { providerCode: "wechat", surfaceKind: "web" };
}

function lifecycleStatus(active: boolean): { status: string } {
  return { status: active ? "active" : "inactive" };
}

const EMPTY_SNAPSHOT: SdkworkIamOauthAdminResourceSnapshot = {
  accountLinks: [],
  callbackEvents: [],
  claimMappings: [],
  clients: [],
  diagnosticRuns: [],
  flowConfigs: [],
  grants: [],
  integrations: [],
  operationalResources: [],
  operatorPlatforms: [],
  policies: [],
  providerCatalog: [],
  resourceAccounts: [],
  resourceAuthorizations: [],
  scopeProfiles: [],
  secrets: [],
  surfaces: [],
  tenantBindings: [],
  webhookConfigs: [],
};

function cloneListPageInfo(
  value: SdkworkIamOauthAdminState["listPageInfo"],
): SdkworkIamOauthAdminState["listPageInfo"] {
  if (!value) {
    return undefined;
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, pageInfo]) => [
      key,
      pageInfo ? { ...pageInfo } : undefined,
    ]),
  ) as SdkworkIamOauthAdminState["listPageInfo"];
}

type OauthResourceKey = keyof SdkworkIamOauthAdminResourceSnapshot;

function createOauthResourceSessions(service: SdkworkIamService) {
  const mapItem = (value: unknown) => value;
  return {
    accountLinks: createSdkWorkPagedListSession({ fetchPage: (query) => service.iam.oauth.accountLinks.list(query), mapItem }),
    callbackEvents: createSdkWorkPagedListSession({ fetchPage: (query) => service.iam.oauth.callbackEvents.list(query), mapItem }),
    claimMappings: createSdkWorkPagedListSession({ fetchPage: (query) => service.iam.oauth.claimMappings.list(query), mapItem }),
    clients: createSdkWorkPagedListSession({ fetchPage: (query) => service.iam.oauth.clients.list(query), mapItem }),
    diagnosticRuns: createSdkWorkPagedListSession({ fetchPage: (query) => service.iam.oauth.diagnosticRuns.list(query), mapItem }),
    flowConfigs: createSdkWorkPagedListSession({ fetchPage: (query) => service.iam.oauth.flowConfigs.list(query), mapItem }),
    grants: createSdkWorkPagedListSession({ fetchPage: (query) => service.iam.oauth.grants.list(query), mapItem }),
    integrations: createSdkWorkPagedListSession({ fetchPage: (query) => service.iam.oauth.integrations.list(query), mapItem }),
    operationalResources: createSdkWorkPagedListSession({ fetchPage: (query) => service.iam.oauth.operationalResources.list(query), mapItem }),
    operatorPlatforms: createSdkWorkPagedListSession({ fetchPage: (query) => service.iam.oauth.operatorPlatforms.list(query), mapItem }),
    policies: createSdkWorkPagedListSession({ fetchPage: (query) => service.iam.oauth.policies.list(query), mapItem }),
    providerCatalog: createSdkWorkPagedListSession({ fetchPage: (query) => service.iam.oauth.providerCatalog.list(query), mapItem }),
    resourceAccounts: createSdkWorkPagedListSession({ fetchPage: (query) => service.iam.oauth.resourceAccounts.list(query), mapItem }),
    resourceAuthorizations: createSdkWorkPagedListSession({ fetchPage: (query) => service.iam.oauth.resourceAuthorizations.list(query), mapItem }),
    scopeProfiles: createSdkWorkPagedListSession({ fetchPage: (query) => service.iam.oauth.scopeProfiles.list(query), mapItem }),
    secrets: createSdkWorkPagedListSession({ fetchPage: (query) => service.iam.oauth.secrets.list(query), mapItem }),
    surfaces: createSdkWorkPagedListSession({ fetchPage: (query) => service.iam.oauth.surfaces.list(query), mapItem }),
    tenantBindings: createSdkWorkPagedListSession({ fetchPage: (query) => service.iam.oauth.tenantBindings.list(query), mapItem }),
    webhookConfigs: createSdkWorkPagedListSession({ fetchPage: (query) => service.iam.oauth.webhookConfigs.list(query), mapItem }),
  } satisfies Record<OauthResourceKey, ReturnType<typeof createSdkWorkPagedListSession<unknown>>>;
}

const OAUTH_RESOURCE_KEYS = Object.keys(EMPTY_SNAPSHOT) as OauthResourceKey[];

/**
 * Resource keys the quick-setup pages depend on; mutation helpers reload only
 * these instead of the full 19-resource snapshot.
 */
const QUICK_SETUP_RESOURCE_KEYS: OauthResourceKey[] = ["resourceAccounts", "integrations"];

function snapshotFromSessions(
  sessions: ReturnType<typeof createOauthResourceSessions>,
): { listPageInfo: Partial<Record<OauthResourceKey, SdkWorkPageInfo>>; snapshot: SdkworkIamOauthAdminResourceSnapshot } {
  const snapshot = cloneSnapshot(EMPTY_SNAPSHOT);
  const listPageInfo: Partial<Record<OauthResourceKey, SdkWorkPageInfo>> = {};
  for (const key of OAUTH_RESOURCE_KEYS) {
    snapshot[key] = [...sessions[key].getItems()];
    const pageInfo = sessions[key].getPageInfo();
    if (pageInfo) {
      listPageInfo[key] = pageInfo;
    }
  }
  return { listPageInfo, snapshot };
}

function cloneSnapshot(snapshot: SdkworkIamOauthAdminResourceSnapshot): SdkworkIamOauthAdminResourceSnapshot {
  return {
    accountLinks: [...snapshot.accountLinks],
    callbackEvents: [...snapshot.callbackEvents],
    claimMappings: [...snapshot.claimMappings],
    clients: [...snapshot.clients],
    diagnosticRuns: [...snapshot.diagnosticRuns],
    flowConfigs: [...snapshot.flowConfigs],
    grants: [...snapshot.grants],
    integrations: [...snapshot.integrations],
    operationalResources: [...snapshot.operationalResources],
    operatorPlatforms: [...snapshot.operatorPlatforms],
    policies: [...snapshot.policies],
    providerCatalog: [...snapshot.providerCatalog],
    resourceAccounts: [...snapshot.resourceAccounts],
    resourceAuthorizations: [...snapshot.resourceAuthorizations],
    scopeProfiles: [...snapshot.scopeProfiles],
    secrets: [...snapshot.secrets],
    surfaces: [...snapshot.surfaces],
    tenantBindings: [...snapshot.tenantBindings],
    webhookConfigs: [...snapshot.webhookConfigs],
  };
}

export function createSdkworkIamOauthAdminController(
  input: SdkworkIamService | CreateSdkworkIamOauthAdminControllerInput,
): SdkworkIamOauthAdminController {
  const service = "service" in input ? input.service : input;
  let resourceSessions = createOauthResourceSessions(service);
  let state: SdkworkIamOauthAdminState = {
    ...cloneSnapshot(EMPTY_SNAPSHOT),
    listPageInfo: undefined,
    status: "idle",
  };

  const setState = (patch: Partial<SdkworkIamOauthAdminState>) => {
    state = {
      ...state,
      ...patch,
      ...cloneSnapshot({
        accountLinks: patch.accountLinks ?? state.accountLinks,
        callbackEvents: patch.callbackEvents ?? state.callbackEvents,
        claimMappings: patch.claimMappings ?? state.claimMappings,
        clients: patch.clients ?? state.clients,
        diagnosticRuns: patch.diagnosticRuns ?? state.diagnosticRuns,
        flowConfigs: patch.flowConfigs ?? state.flowConfigs,
        grants: patch.grants ?? state.grants,
        integrations: patch.integrations ?? state.integrations,
        operationalResources: patch.operationalResources ?? state.operationalResources,
        operatorPlatforms: patch.operatorPlatforms ?? state.operatorPlatforms,
        policies: patch.policies ?? state.policies,
        providerCatalog: patch.providerCatalog ?? state.providerCatalog,
        resourceAccounts: patch.resourceAccounts ?? state.resourceAccounts,
        resourceAuthorizations: patch.resourceAuthorizations ?? state.resourceAuthorizations,
        scopeProfiles: patch.scopeProfiles ?? state.scopeProfiles,
        secrets: patch.secrets ?? state.secrets,
        surfaces: patch.surfaces ?? state.surfaces,
        tenantBindings: patch.tenantBindings ?? state.tenantBindings,
        webhookConfigs: patch.webhookConfigs ?? state.webhookConfigs,
      }),
    };
  };

  const retrieveDetail = (
    label: string,
    action: () => Promise<unknown>,
    extraState?: (detail: unknown) => Partial<SdkworkIamOauthAdminState>,
  ): Promise<unknown> => {
    setState({ status: "saving", lastError: undefined });
    return action()
      .then((detail) => {
        setState({
          lastResourceDetail: { detail, label },
          status: "ready",
          ...(extraState ? extraState(detail) : {}),
        });
        return detail;
      })
      .catch((error) => {
        setState({
          status: "error",
          lastError: error instanceof Error ? error.message : `Failed to retrieve ${label}`,
        });
        throw error;
      });
  };

  const wrapCreate = async (
    action: () => Promise<unknown>,
    errorMessage: string,
    reload: boolean,
  ): Promise<unknown> => {
    setState({ status: "saving", lastError: undefined });
    try {
      const created = await action();
      if (reload) {
        await controller.load();
      } else {
        setState({ status: "ready" });
      }
      return created;
    } catch (error) {
      setState({
        status: "error",
        lastError: error instanceof Error ? error.message : errorMessage,
      });
      throw error;
    }
  };

  const controller: SdkworkIamOauthAdminController = {
    getState() {
      return {
        ...state,
        ...cloneSnapshot(state),
        listPageInfo: cloneListPageInfo(state.listPageInfo),
      };
    },
    async createAccountSetup(kind, body) {
      setState({ status: "saving", lastError: undefined });
      try {
        const { providerCode, surfaceKind } = accountSetupProvider(kind);
        const appId = body.appId.trim();
        const appSecret = body.appSecret.trim();
        const displayName = body.displayName.trim();
        const enabled = body.enabled;
        const config = body.config && typeof body.config === "object"
          ? { ...body.config }
          : undefined;
        // The callback URL follows the SDKWork IAM standard
        // `https://{webDomain}/auth/oauth/callback` shape whenever the primary
        // domain is configured; a manually provided redirect URI wins. The
        // resolved URL is also mirrored back into the stored account config so
        // the developer configuration drawer shows the effective callback.
        const autoRedirectUri = config?.webDomain
          ? buildStandardCallbackUri(config.webDomain)
          : "";
        const redirectUri = (body.redirectUri.trim() || autoRedirectUri).trim();
        if (config && redirectUri) {
          config.redirectUri = redirectUri;
        }

        // Reuse an existing integration for the same provider + app id when
        // present; otherwise create the login integration in one step.
        const existingRows = normalizeList(
          await service.iam.oauth.integrations.list({ page_size: 200, q: providerCode }),
        );
        const existing = existingRows.find((row) =>
          readProviderCode(row) === providerCode && readProviderClientId(row) === appId);
        const integrationId = existing ? readIntegrationId(existing) : "";

        const resolvedIntegrationId = integrationId || readIntegrationId(await service.iam.oauth.integrations.create({
          integrationCode: `${kind === "mini_program" ? "mini-program" : "official-account"}-${appId}`,
          displayName,
          providerCode,
          providerClientId: appId,
          providerClientSecret: appSecret,
          redirectUri,
          surfaceKind,
          enabled,
        }));

        if (integrationId) {
          const integrationPatch: Record<string, unknown> = {};
          if (enabled !== undefined) {
            integrationPatch.enabled = enabled;
          }
          if (redirectUri) {
            integrationPatch.redirectUri = redirectUri;
          }
          if (Object.keys(integrationPatch).length > 0) {
            await service.iam.oauth.integrations.update(integrationId, integrationPatch);
          }
        }

        // Refuse a second account row for the same provider AppID so every
        // account stays unique and the credential cascades keep one owner.
        const existingAccounts = normalizeList(
          await service.iam.oauth.resourceAccounts.list({ page_size: 200, q: appId }),
        );
        const duplicate = existingAccounts.find((row) =>
          readProviderCode(row) === providerCode && readProviderClientId(row) === appId);
        if (duplicate) {
          throw new Error(
            `An ${kind === "mini_program" ? "mini program" : "official account"} with AppID ${appId} already exists`,
          );
        }

        const account = await service.iam.oauth.resourceAccounts.create({
          integrationId: resolvedIntegrationId,
          providerCode,
          resourceAccountCode: `${kind === "mini_program" ? "mini" : "oa"}-${appId}`,
          resourceAccountKind: kind,
          displayName,
          providerAccountId: appId,
          providerAccountType: optionalString(body.accountType),
          providerAccountOriginalId: optionalString(body.originalId),
          accessMode: "operator_managed",
          enabled,
          config,
        });

        await controller.load(QUICK_SETUP_RESOURCE_KEYS);
        return account;
      } catch (error) {
        setState({
          status: "error",
          lastError: error instanceof Error
            ? error.message
            : `Failed to create ${kind} account setup`,
        });
        throw error;
      }
    },
    async setResourceAccountEnabled(resourceAccountId, integrationId, enabled) {
      setState({ status: "saving", lastError: undefined });
      try {
        await service.iam.oauth.resourceAccounts.update(resourceAccountId.trim(), { enabled });
        if (integrationId.trim()) {
          await service.iam.oauth.integrations.update(integrationId.trim(), { enabled });
        }
        await controller.load(QUICK_SETUP_RESOURCE_KEYS);
        return { resourceAccountId: resourceAccountId.trim(), enabled };
      } catch (error) {
        setState({
          status: "error",
          lastError: error instanceof Error
            ? error.message
            : "Failed to update resource account status",
        });
        throw error;
      }
    },
    async deleteResourceAccount(resourceAccountId) {
      setState({ status: "saving", lastError: undefined });
      try {
        // Only the account row is removed; the shared login integration,
        // OAuth client, and secret rows stay untouched.
        await service.iam.oauth.resourceAccounts.delete(resourceAccountId.trim());
        await controller.load(QUICK_SETUP_RESOURCE_KEYS);
        return { resourceAccountId: resourceAccountId.trim() };
      } catch (error) {
        setState({
          status: "error",
          lastError: error instanceof Error
            ? error.message
            : "Failed to delete resource account",
        });
        throw error;
      }
    },
    async updateAccountConfig(resourceAccountId, config) {
      setState({ status: "saving", lastError: undefined });
      try {
        const normalizedId = resourceAccountId.trim();
        const account = state.resourceAccounts.find(
          (item) => readResourceAccountId(item) === normalizedId,
        );
        const integrationId = account ? readAccountIntegrationId(account) : "";
        const redirectUri = config.redirectUri?.trim() ?? "";
        await service.iam.oauth.resourceAccounts.update(normalizedId, { config });
        // Keep the login integration's callback in sync so the standardized
        // callback URL actually takes effect for provider redirects.
        if (integrationId && redirectUri) {
          await service.iam.oauth.integrations.update(integrationId, { redirectUri });
        }
        // Official account server configuration (message push) syncs to the
        // message-push webhook row bound to this account, so the scan-login
        // surface reflects the configured callback and can confirm follows.
        const notifyUrl = config.notify?.url?.trim();
        if (notifyUrl && integrationId) {
          const webhookRows = normalizeList(
            await service.iam.oauth.webhookConfigs.list({ page_size: 200 }),
          );
          // Webhook rows carry their bound account in `resourceAccountId`
          // (the row's own id lives in `id` / `webhookConfigId`).
          const existingWebhook = webhookRows.find((row) => {
            const record = toRecord(row);
            return (optionalString(record.resourceAccountId)
              || optionalString(record.resource_account_id)) === normalizedId;
          });
          const displayName = account ? readDisplayName(account) : "";
          if (existingWebhook) {
            await service.iam.oauth.webhookConfigs.update(
              readWebhookConfigId(existingWebhook),
              {
                callbackUrl: notifyUrl,
                encodingAesKeyStatus: config.notify?.encodingAesKey?.trim() ? "configured" : "missing",
                verificationTokenStatus: config.notify?.token?.trim() ? "configured" : "missing",
              },
            );
          } else {
            await service.iam.oauth.webhookConfigs.create({
              callbackUrl: notifyUrl,
              displayName: displayName || "Official account message push",
              encodingAesKeyStatus: config.notify?.encodingAesKey?.trim() ? "configured" : "missing",
              integrationId,
              providerCode: "wechat",
              resourceAccountId: normalizedId,
              verificationTokenStatus: config.notify?.token?.trim() ? "configured" : "missing",
              webhookCode: `oa-notify-${normalizedId}`,
              webhookKind: "message_push",
            });
          }
        }
        await controller.load(QUICK_SETUP_RESOURCE_KEYS);
        return { resourceAccountId: normalizedId, config };
      } catch (error) {
        setState({
          status: "error",
          lastError: error instanceof Error
            ? error.message
            : "Failed to update account developer configuration",
        });
        throw error;
      }
    },
    async updateAccountCredentials(resourceAccountId, body) {
      setState({ status: "saving", lastError: undefined });
      try {
        const normalizedId = resourceAccountId.trim();
        const patch: Record<string, unknown> = {};
        const appId = body.appId?.trim();
        const appSecret = body.appSecret?.trim();
        // The backend cascades providerAccountId to the linked OAuth client
        // and rotates the encoded AppSecret on the client's secret row; an
        // empty AppSecret keeps the current secret unchanged.
        if (appId) {
          patch.providerAccountId = appId;
        }
        if (appSecret) {
          patch.providerClientSecret = appSecret;
        }
        await service.iam.oauth.resourceAccounts.update(normalizedId, patch);
        await controller.load(QUICK_SETUP_RESOURCE_KEYS);
        return { resourceAccountId: normalizedId, patch };
      } catch (error) {
        setState({
          status: "error",
          lastError: error instanceof Error
            ? error.message
            : "Failed to update account credentials",
        });
        throw error;
      }
    },
    async updateAccountProfile(resourceAccountId, integrationId, body) {
      setState({ status: "saving", lastError: undefined });
      try {
        const normalizedId = resourceAccountId.trim();
        const displayName = body.displayName.trim();
        const patch: Record<string, unknown> = { displayName };
        const accountType = body.accountType?.trim();
        const originalId = body.originalId?.trim();
        // Official account profile metadata mirrors the WeChat console
        // account-info fields; type/original id stay optional and an explicit
        // empty value clears the stored one.
        if (body.accountType !== undefined) {
          patch.providerAccountType = accountType;
        }
        if (body.originalId !== undefined) {
          patch.providerAccountOriginalId = originalId;
        }
        await service.iam.oauth.resourceAccounts.update(normalizedId, patch);
        // Keep the login integration's display name in sync so provider
        // lists and logs show the same account name.
        if (integrationId.trim()) {
          await service.iam.oauth.integrations.update(integrationId.trim(), { displayName });
        }
        await controller.load(QUICK_SETUP_RESOURCE_KEYS);
        return { resourceAccountId: normalizedId, patch };
      } catch (error) {
        setState({
          status: "error",
          lastError: error instanceof Error
            ? error.message
            : "Failed to update account profile",
        });
        throw error;
      }
    },
    async load(resourceKeys = OAUTH_RESOURCE_KEYS) {
      setState({ status: "loading", lastError: undefined });
      try {
        resourceSessions = createOauthResourceSessions(service);
        await Promise.all(resourceKeys.map((key) => resourceSessions[key].list()));
        const { listPageInfo, snapshot } = snapshotFromSessions(resourceSessions);
        setState({ ...snapshot, listPageInfo, status: "ready" });
        return snapshot;
      } catch (error) {
        setState({
          status: "error",
          lastError: error instanceof Error ? error.message : "Failed to load OAuth admin resources",
        });
        throw error;
      }
    },
    async loadMoreResource(resourceKey) {
      setState({ status: "loading", lastError: undefined });
      try {
        await resourceSessions[resourceKey].loadMore();
        const items = [...resourceSessions[resourceKey].getItems()];
        const listPageInfo = {
          ...state.listPageInfo,
          [resourceKey]: resourceSessions[resourceKey].getPageInfo(),
        };
        setState({ [resourceKey]: items, listPageInfo, status: "ready" });
        return items;
      } catch (error) {
        setState({
          status: "error",
          lastError: error instanceof Error ? error.message : `Failed to load more ${resourceKey}`,
        });
        throw error;
      }
    },
    async listPageResource(resourceKey, params) {
      setState({ status: "loading", lastError: undefined });
      try {
        await resourceSessions[resourceKey].list(params);
        const items = [...resourceSessions[resourceKey].getItems()];
        const listPageInfo = {
          ...state.listPageInfo,
          [resourceKey]: resourceSessions[resourceKey].getPageInfo(),
        };
        setState({ [resourceKey]: items, listPageInfo, status: "ready" });
        return items;
      } catch (error) {
        setState({
          status: "error",
          lastError: error instanceof Error ? error.message : `Failed to load ${resourceKey}`,
        });
        throw error;
      }
    },
    createIntegration(body) {
      return wrapCreate(
        () => {
          const optional = (value: string | undefined) => value?.trim() || undefined;
          return service.iam.oauth.integrations.create({
            displayName: body.displayName.trim(),
            integrationCode: body.integrationCode.trim(),
            providerCode: body.providerCode.trim(),
            enabled: body.enabled ?? true,
            ...(optional(body.appId) ? { appId: optional(body.appId) } : {}),
            ...(optional(body.providerCatalogId) ? { providerCatalogId: optional(body.providerCatalogId) } : {}),
            ...(optional(body.providerClientId) ? { providerClientId: optional(body.providerClientId) } : {}),
            ...(optional(body.providerClientSecret) ? { providerClientSecret: optional(body.providerClientSecret) } : {}),
            ...(optional(body.providerTenantId) ? { providerTenantId: optional(body.providerTenantId) } : {}),
            ...(optional(body.redirectUri) ? { redirectUri: optional(body.redirectUri) } : {}),
            ...(optional(body.surfaceKind) ? { surfaceKind: optional(body.surfaceKind) } : {}),
          });
        },
        "Failed to create OAuth integration",
        true,
      );
    },
    updateIntegrationSetup(integrationId, body) {
      return wrapCreate(
        () => {
          const patch: Record<string, unknown> = {
            displayName: body.displayName.trim(),
            enabled: body.enabled ?? true,
          };
          const redirectUri = body.redirectUri?.trim();
          if (redirectUri) {
            patch.redirectUri = redirectUri;
          }
          // Credentials are only re-submitted when the operator changed them;
          // the backend cascades them to the linked client/secret rows.
          const clientId = body.providerClientId?.trim();
          if (clientId) {
            patch.providerClientId = clientId;
          }
          const clientSecret = body.providerClientSecret?.trim();
          if (clientSecret) {
            patch.providerClientSecret = clientSecret;
          }
          return service.iam.oauth.integrations.update(integrationId.trim(), patch);
        },
        "Failed to update OAuth integration",
        true,
      );
    },
    createClient(body) {
      return wrapCreate(
        () => {
          const providerTenantId = body.providerTenantId.trim();
          return service.iam.oauth.clients.create({
            clientCode: body.clientCode.trim(),
            displayName: body.displayName.trim(),
            integrationId: body.integrationId.trim(),
            providerClientId: body.providerClientId.trim(),
            providerCode: body.providerCode.trim(),
            enabled: true,
            ...(providerTenantId ? { providerTenantId } : {}),
          });
        },
        "Failed to create OAuth client",
        true,
      );
    },
    createSecret(body) {
      return wrapCreate(
        () => service.iam.oauth.secrets.create({
          secretKind: body.secretKind.trim(),
          secretOwnerId: body.secretOwnerId.trim(),
          secretOwnerKind: body.secretOwnerKind.trim(),
          secretValue: body.secretValue.trim(),
        }),
        "Failed to register OAuth secret",
        true,
      );
    },
    createScopeProfile(body) {
      return wrapCreate(
        () => service.iam.oauth.scopeProfiles.create({
          displayName: body.displayName.trim(),
          integrationId: body.integrationId.trim(),
          providerCode: body.providerCode.trim(),
          purpose: body.purpose.trim(),
          scopeProfileCode: body.scopeProfileCode.trim(),
        }),
        "Failed to create OAuth scope profile",
        true,
      );
    },
    createPolicy(body) {
      return wrapCreate(
        () => {
          const payload: Record<string, string> = {
            displayName: body.displayName.trim(),
            policyCode: body.policyCode.trim(),
          };
          if (body.integrationId.trim()) {
            payload.integrationId = body.integrationId.trim();
          }
          return service.iam.oauth.policies.create(payload);
        },
        "Failed to create OAuth policy",
        true,
      );
    },
    createTenantBinding(body) {
      return wrapCreate(
        () => service.iam.oauth.tenantBindings.create({
          bindingKind: body.bindingKind.trim(),
          integrationId: body.integrationId.trim(),
          providerCode: body.providerCode.trim(),
        }),
        "Failed to create OAuth tenant binding",
        true,
      );
    },
    createOperatorPlatform(body) {
      return wrapCreate(
        () => service.iam.oauth.operatorPlatforms.create({
          displayName: body.displayName.trim(),
          integrationId: body.integrationId.trim(),
          operatorMode: body.operatorMode.trim(),
          platformCode: body.platformCode.trim(),
          providerCode: body.providerCode.trim(),
          providerPlatformId: body.providerPlatformId.trim(),
        }),
        "Failed to create OAuth operator platform",
        true,
      );
    },
    createDiagnosticRun(body) {
      return wrapCreate(
        () => {
          const payload: Record<string, string> = {
            providerCode: body.providerCode.trim(),
            runKind: body.runKind.trim(),
          };
          if (body.integrationId.trim()) {
            payload.integrationId = body.integrationId.trim();
          }
          return service.iam.oauth.diagnosticRuns.create(payload);
        },
        "Failed to queue OAuth diagnostic run",
        true,
      );
    },
    createClaimMapping(body) {
      return wrapCreate(
        () => service.iam.oauth.claimMappings.create({
          externalClaim: body.externalClaim.trim(),
          integrationId: body.integrationId.trim(),
          providerCode: body.providerCode.trim(),
          targetField: body.targetField.trim(),
          targetKind: body.targetKind.trim(),
        }),
        "Failed to create OAuth claim mapping",
        true,
      );
    },
    createWebhookConfig(body) {
      return wrapCreate(
        () => service.iam.oauth.webhookConfigs.create({
          callbackUrl: body.callbackUrl.trim(),
          displayName: body.displayName.trim(),
          integrationId: body.integrationId.trim(),
          providerCode: body.providerCode.trim(),
          webhookCode: body.webhookCode.trim(),
          webhookKind: body.webhookKind.trim(),
          ...(body.resourceAccountId?.trim()
            ? { resourceAccountId: body.resourceAccountId.trim() }
            : {}),
        }),
        "Failed to create OAuth webhook config",
        true,
      );
    },
    updateWebhookConfigSetup(webhookConfigId, body) {
      return wrapCreate(
        () => {
          const patch: Record<string, unknown> = {};
          const callbackUrl = body.callbackUrl?.trim();
          if (callbackUrl) {
            patch.callbackUrl = callbackUrl;
          }
          const displayName = body.displayName?.trim();
          if (displayName) {
            patch.displayName = displayName;
          }
          if (body.resourceAccountId !== undefined) {
            patch.resourceAccountId = body.resourceAccountId.trim();
          }
          return service.iam.oauth.webhookConfigs.update(webhookConfigId.trim(), patch);
        },
        "Failed to update OAuth webhook config",
        true,
      );
    },
    deleteWebhookConfig(webhookConfigId) {
      return wrapCreate(
        () => service.iam.oauth.webhookConfigs.delete(webhookConfigId.trim()),
        "Failed to delete OAuth webhook config",
        true,
      );
    },
    createFlowConfig(body) {
      return wrapCreate(
        () => service.iam.oauth.flowConfigs.create({
          flowKind: body.flowKind.trim(),
          flowPurpose: body.flowPurpose.trim(),
          integrationId: body.integrationId.trim(),
          oauthClientId: body.oauthClientId.trim(),
        }),
        "Failed to create OAuth flow config",
        true,
      );
    },
    createSurface(body) {
      return wrapCreate(
        () => service.iam.oauth.surfaces.create({
          displayName: body.displayName.trim(),
          integrationId: body.integrationId.trim(),
          oauthClientId: body.oauthClientId.trim(),
          redirectUri: body.redirectUri.trim(),
          surfaceCode: body.surfaceCode.trim(),
          surfaceKind: body.surfaceKind.trim(),
          enabled: true,
        }),
        "Failed to create OAuth surface",
        true,
      );
    },
    createResourceAccount(body) {
      return wrapCreate(
        () => service.iam.oauth.resourceAccounts.create({
          accessMode: body.accessMode.trim(),
          displayName: body.displayName.trim(),
          integrationId: body.integrationId.trim(),
          providerAccountId: body.providerAccountId.trim(),
          providerCode: body.providerCode.trim(),
          resourceAccountCode: body.resourceAccountCode.trim(),
          resourceAccountKind: body.resourceAccountKind.trim(),
        }),
        "Failed to create OAuth resource account",
        true,
      );
    },
    createResourceAuthorization(body) {
      return wrapCreate(
        () => service.iam.oauth.resourceAuthorizations.create({
          authorizationMode: body.authorizationMode.trim(),
          integrationId: body.integrationId.trim(),
          providerCode: body.providerCode.trim(),
          resourceAccountId: body.resourceAccountId.trim(),
        }),
        "Failed to create OAuth resource authorization",
        true,
      );
    },
    createOperationalResource(body) {
      return wrapCreate(
        () => service.iam.oauth.operationalResources.create({
          displayName: body.displayName.trim(),
          integrationId: body.integrationId.trim(),
          providerCode: body.providerCode.trim(),
          resourceAccountId: body.resourceAccountId.trim(),
          resourceCode: body.resourceCode.trim(),
          resourceKind: body.resourceKind.trim(),
        }),
        "Failed to create OAuth operational resource",
        true,
      );
    },
    createProviderCatalog(body) {
      return wrapCreate(
        () => {
          const payload: Record<string, string> = {
            providerCode: body.providerCode.trim(),
            providerName: body.providerName.trim(),
          };
          const displayName = body.providerDisplayName.trim();
          if (displayName) {
            payload.providerDisplayName = displayName;
          }
          return service.iam.oauth.providerCatalog.create(payload);
        },
        "Failed to create OAuth provider catalog entry",
        true,
      );
    },
    updateAccountLink(body) {
      return wrapCreate(
        () => service.iam.oauth.accountLinks.update(body.accountLinkId.trim(), {
          status: body.status.trim(),
        }),
        "Failed to update OAuth account link",
        true,
      );
    },
    revokeGrant(grantId) {
      return wrapCreate(
        () => service.iam.oauth.grants.delete(grantId.trim()),
        "Failed to revoke OAuth grant",
        true,
      );
    },
    updateIntegration(integrationId, enabled) {
      return wrapCreate(
        () => service.iam.oauth.integrations.update(integrationId.trim(), { enabled }),
        "Failed to update OAuth integration",
        true,
      );
    },
    deleteIntegration(integrationId) {
      return wrapCreate(
        () => service.iam.oauth.integrations.delete(integrationId.trim()),
        "Failed to delete OAuth integration",
        true,
      );
    },
    deleteClient(oauthClientId) {
      return wrapCreate(
        () => service.iam.oauth.clients.delete(oauthClientId.trim()),
        "Failed to delete OAuth client",
        true,
      );
    },
    updateClient(oauthClientId, enabled) {
      return wrapCreate(
        () => service.iam.oauth.clients.update(oauthClientId.trim(), { enabled }),
        "Failed to update OAuth client",
        true,
      );
    },
    deleteSecret(secretId) {
      return wrapCreate(
        () => service.iam.oauth.secrets.delete(secretId.trim()),
        "Failed to delete OAuth secret reference",
        true,
      );
    },
    updateSurface(surfaceId, enabled) {
      return wrapCreate(
        () => service.iam.oauth.surfaces.update(surfaceId.trim(), { enabled }),
        "Failed to update OAuth surface",
        true,
      );
    },
    deleteSurface(surfaceId) {
      return wrapCreate(
        () => service.iam.oauth.surfaces.delete(surfaceId.trim()),
        "Failed to delete OAuth surface",
        true,
      );
    },
    deleteOperationalResource(resourceId) {
      return wrapCreate(
        () => service.iam.oauth.operationalResources.delete(resourceId.trim()),
        "Failed to delete OAuth operational resource",
        true,
      );
    },
    updateFlowConfig(flowConfigId, enabled) {
      return wrapCreate(
        () => service.iam.oauth.flowConfigs.update(flowConfigId.trim(), { enabled }),
        "Failed to update OAuth flow config",
        true,
      );
    },
    updateWebhookConfig(webhookConfigId, enabled) {
      return wrapCreate(
        () => service.iam.oauth.webhookConfigs.update(webhookConfigId.trim(), { enabled }),
        "Failed to update OAuth webhook config",
        true,
      );
    },
    updateOperatorPlatform(operatorPlatformId, enabled) {
      return wrapCreate(
        () => service.iam.oauth.operatorPlatforms.update(operatorPlatformId.trim(), { enabled }),
        "Failed to update OAuth operator platform",
        true,
      );
    },
    updateResourceAccount(resourceAccountId, enabled) {
      return wrapCreate(
        () => service.iam.oauth.resourceAccounts.update(resourceAccountId.trim(), { enabled }),
        "Failed to update OAuth resource account",
        true,
      );
    },
    updateOperationalResource(resourceId, enabled) {
      // `iam_oauth_operational_resource` has no `enabled` column — its
      // lifecycle is expressed through `status` (the same contract the
      // scope/claim/policy toggles use), so the toggle maps to status.
      return wrapCreate(
        () => service.iam.oauth.operationalResources.update(resourceId.trim(), lifecycleStatus(enabled)),
        "Failed to update OAuth operational resource",
        true,
      );
    },
    updateScopeProfileStatus(scopeProfileId, active) {
      return wrapCreate(
        () => service.iam.oauth.scopeProfiles.update(scopeProfileId.trim(), lifecycleStatus(active)),
        "Failed to update OAuth scope profile status",
        true,
      );
    },
    updateClaimMappingStatus(mappingId, active) {
      return wrapCreate(
        () => service.iam.oauth.claimMappings.update(mappingId.trim(), lifecycleStatus(active)),
        "Failed to update OAuth claim mapping status",
        true,
      );
    },
    updatePolicyStatus(policyId, active) {
      return wrapCreate(
        () => service.iam.oauth.policies.update(policyId.trim(), lifecycleStatus(active)),
        "Failed to update OAuth policy status",
        true,
      );
    },
    updateTenantBindingStatus(bindingId, active) {
      return wrapCreate(
        () => service.iam.oauth.tenantBindings.update(bindingId.trim(), lifecycleStatus(active)),
        "Failed to update OAuth tenant binding status",
        true,
      );
    },
    updateResourceAuthorizationStatus(authorizationId, active) {
      return wrapCreate(
        () => service.iam.oauth.resourceAuthorizations.update(authorizationId.trim(), lifecycleStatus(active)),
        "Failed to update OAuth resource authorization status",
        true,
      );
    },
    runWebhookVerification(webhookConfigId) {
      return wrapCreate(
        () => service.iam.oauth.webhookConfigs.verifications.create(webhookConfigId.trim(), {}),
        "Failed to queue OAuth webhook verification",
        true,
      );
    },
    runResourceAccountVerification(resourceAccountId) {
      return wrapCreate(
        () => service.iam.oauth.resourceAccounts.verifications.create(resourceAccountId.trim(), {}),
        "Failed to queue OAuth resource account verification",
        true,
      );
    },
    runResourceAccountAuthorizationRefresh(resourceAccountId) {
      return wrapCreate(
        () => service.iam.oauth.resourceAccounts.authorizationRefreshes.create(resourceAccountId.trim(), {}),
        "Failed to queue OAuth resource account authorization refresh",
        true,
      );
    },
    runResourceAccountMiniProgramLoginCheck(resourceAccountId) {
      return wrapCreate(
        () => service.iam.oauth.resourceAccounts.miniProgramLoginChecks.create(resourceAccountId.trim(), {}),
        "Failed to queue OAuth mini program login check",
        true,
      );
    },
    runOperatorPlatformPreAuthorization(operatorPlatformId) {
      return wrapCreate(
        () => service.iam.oauth.operatorPlatforms.preAuthorizations.create(operatorPlatformId.trim(), {}),
        "Failed to queue OAuth operator platform pre-authorization",
        true,
      );
    },
    publishOperationalResource(resourceId) {
      return wrapCreate(
        () => service.iam.oauth.operationalResources.publishes.create(resourceId.trim(), {}),
        "Failed to queue OAuth operational resource publish",
        true,
      );
    },
    retrieveDiagnosticRun(diagnosticRunId) {
      return retrieveDetail(
        "OAuth diagnostic run",
        () => service.iam.oauth.diagnosticRuns.retrieve(diagnosticRunId.trim()),
        (detail) => ({ lastDiagnosticRunDetail: detail }),
      );
    },
    retrieveIntegration(integrationId) {
      return retrieveDetail(
        "OAuth integration",
        () => service.iam.oauth.integrations.retrieve(integrationId.trim()),
      );
    },
    retrieveClient(oauthClientId) {
      return retrieveDetail(
        "OAuth client",
        () => service.iam.oauth.clients.retrieve(oauthClientId.trim()),
      );
    },
    retrieveProviderCatalogEntry(providerCatalogId) {
      return retrieveDetail(
        "OAuth provider catalog entry",
        () => service.iam.oauth.providerCatalog.retrieve(providerCatalogId.trim()),
      );
    },
    updateProviderCatalogStatus(providerCatalogId, active) {
      return wrapCreate(
        () => service.iam.oauth.providerCatalog.update(providerCatalogId.trim(), lifecycleStatus(active)),
        "Failed to update OAuth provider catalog status",
        true,
      );
    },
    loadRelyingPartyConfig(tenantId, tenantApplicationId) {
      setState({ status: "saving", lastError: undefined });
      return service.iam.tenantApplications.retrieve(tenantApplicationId.trim())
        .then((detail) => {
          const draft = parseRelyingPartyDraftFromTenantApplication(detail, tenantId, tenantApplicationId);
          if (draft.tenantId && tenantId.trim() && draft.tenantId !== tenantId.trim()) {
            throw new Error("Loaded tenant application does not match the requested tenant scope");
          }
          setState({ status: "ready" });
          return draft;
        })
        .catch((error) => {
          setState({
            status: "error",
            lastError: error instanceof Error ? error.message : "Failed to load relying party OAuth configuration",
          });
          throw error;
        });
    },
    updateRelyingParty(body) {
      return wrapCreate(
        () => {
          const relyingParty: Record<string, unknown> = {
            enabled: body.enabled,
            redirectUris: splitMultilineList(body.redirectUrisText),
            allowedScopes: splitMultilineList(body.allowedScopesText),
            confidential: body.confidential,
          };
          if (body.confidential && body.clientSecretHash.trim()) {
            relyingParty.clientSecretHash = body.clientSecretHash.trim();
          }
          return service.iam.tenantApplications.update(body.tenantApplicationId.trim(), {
            tenantId: body.tenantId.trim(),
            runtimeConfig: {
              oauth: {
                relyingParty,
              },
            },
          });
        },
        "Failed to update relying party OAuth configuration",
        false,
      );
    },
    loadScanLoginSettings() {
      setState({ status: "saving", lastError: undefined });
      return service.iam.oauth.scanLoginSettings.retrieve()
        .then((detail) => {
          setState({ status: "ready" });
          return normalizeScanLoginSettings(detail);
        })
        .catch((error) => {
          setState({
            status: "error",
            lastError: error instanceof Error ? error.message : "Failed to load scan login settings",
          });
          throw error;
        });
    },
    updateScanLoginSettings(body) {
      return wrapCreate(
        () => service.iam.oauth.scanLoginSettings.update(body),
        "Failed to update scan login settings",
        false,
      ).then((updated) => normalizeScanLoginSettings(updated));
    },
    generateScanLoginPreview(qrMode, accountId) {
      setState({ status: "saving", lastError: undefined });
      const previewBody: Record<string, unknown> = { qrMode };
      if (accountId && accountId.trim()) {
        previewBody.accountId = accountId.trim();
      }
      return service.iam.oauth.scanLoginPreviews.create(previewBody)
        .then((detail) => {
          setState({ status: "ready" });
          return normalizeScanLoginPreview(detail);
        })
        .catch((error) => {
          setState({
            status: "error",
            lastError: error instanceof Error ? error.message : "Failed to generate scan login preview",
          });
          throw error;
        });
    },
    createAccountFollowQrCode(resourceAccountId) {
      setState({ status: "saving", lastError: undefined });
      return service.iam.oauth.resourceAccounts.followQrCodes.create(resourceAccountId.trim(), {})
        .then((detail) => {
          setState({ status: "ready" });
          return normalizeAccountFollowQrCode(detail);
        })
        .catch((error) => {
          setState({
            status: "error",
            lastError: error instanceof Error ? error.message : "Failed to generate official account follow QR code",
          });
          throw error;
        });
    },
    async loadAccountCustomMenu(resourceAccountId) {
      setState({ status: "loading", lastError: undefined });
      try {
        const normalizedId = resourceAccountId.trim();
        const remote = await service.iam.oauth.resourceAccounts.customMenus.retrieve(normalizedId);
        const remoteRecord = toRecord(remote);
        const remoteMenu = toRecord(remoteRecord.menu);
        if (!Array.isArray(remoteMenu.buttons)) {
          throw new Error("Official account custom menu response is missing buttons");
        }
        setState({ status: "ready" });
        return {
          displayName: optionalString(remoteRecord.displayName) ?? normalizedId,
          logoUrl: optionalString(remoteRecord.logoUrl),
          draft: normalizeCustomMenuDraft(remoteMenu),
          source: normalizeCustomMenuSource(remoteRecord.source),
        } satisfies SdkworkIamOauthCustomMenuContext;
      } catch (error) {
        setState({
          status: "error",
          lastError: error instanceof Error
            ? error.message
            : "Failed to load official account custom menu",
        });
        throw error;
      }
    },
    async saveAccountCustomMenu(resourceAccountId, draft) {
      setState({ status: "saving", lastError: undefined });
      try {
        const normalizedId = resourceAccountId.trim();
        const preparedDraft = prepareCustomMenuDraft(draft);
        await service.iam.oauth.resourceAccounts.customMenus.update(normalizedId, {
          buttons: preparedDraft.buttons,
        });
        const context = await controller.loadAccountCustomMenu(normalizedId);
        setState({ status: "ready" });
        return context;
      } catch (error) {
        setState({
          status: "error",
          lastError: error instanceof Error
            ? error.message
            : "Failed to save official account custom menu",
        });
        throw error;
      }
    },
    async publishAccountCustomMenu(resourceAccountId, draft) {
      setState({ status: "saving", lastError: undefined });
      const normalizedId = resourceAccountId.trim();
      const preparedDraft = prepareCustomMenuDraft(draft);
      const issues = validateCustomMenuDraft(preparedDraft);
      if (issues.length > 0) {
        const first = issues[0];
        const error = new Error(`Invalid official account custom menu: ${first.kind} at ${first.path || "root"}`);
        setState({ status: "error", lastError: error.message });
        throw error;
      }
      let context: SdkworkIamOauthCustomMenuContext;
      try {
        context = await controller.saveAccountCustomMenu(normalizedId, preparedDraft);
      } catch (error) {
        setState({ status: "error", lastError: error instanceof Error ? error.message : "Failed to save custom menu draft" });
        throw error;
      }
      try {
        await service.iam.oauth.resourceAccounts.customMenus.publish(normalizedId, {
          buttons: preparedDraft.buttons,
        });
        // Read back the provider/database canonical representation after
        // publish. This prevents stale list snapshots from becoming the next
        // editor baseline when WeChat normalizes the menu payload.
        context = await controller.loadAccountCustomMenu(normalizedId);
        setState({ status: "ready" });
        return { context, saved: true, published: true } satisfies SdkworkIamOauthCustomMenuPublishResult;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to publish custom menu";
        try {
          // A concurrent save can supersede the just-published snapshot. The
          // backend reports that as a conflict; always prefer its latest draft
          // over the pre-publish context before returning control to the UI.
          context = await controller.loadAccountCustomMenu(normalizedId);
        } catch {
          // Preserve the publish error as the primary operator-facing failure.
        }
        setState({
          status: "error",
          lastError: message,
        });
        // The publish capability only exists once the IAM backend exposes the
        // custom-menu SDK resource; until then keep the saved draft and tell
        // the UI why publishing did not run.
        const backendUnavailable = message.includes("Missing SDKWork IAM SDK resource");
        return {
          context,
          saved: true,
          published: false,
          reason: backendUnavailable ? "backend_unavailable" : "publish_failed",
          errorMessage: backendUnavailable ? undefined : message,
        } satisfies SdkworkIamOauthCustomMenuPublishResult;
      }
    },
    setResourceAccountQrLogin(resourceAccountId, enabled) {
      return wrapCreate(
        () => {
          const patch: Record<string, unknown> = { qrDefaultEnabled: enabled };
          // Only enabling QR login activates the account; disabling it must
          // never silently re-enable an account the operator turned off.
          if (enabled) {
            patch.enabled = true;
          }
          return service.iam.oauth.resourceAccounts.update(resourceAccountId.trim(), patch);
        },
        "Failed to update official account scan login",
        true,
      );
    },
  };

  return controller;
}

function normalizeScanLoginSettings(value: unknown): SdkworkIamOauthScanLoginSettings {
  const record = toRecord(value);
  const urlLogin = toRecord(record.urlLogin);
  const accounts = Array.isArray(record.officialAccounts)
    ? record.officialAccounts.map((item) => {
      const account = toRecord(item);
      return {
        accountId: optionalString(account.accountId) || "",
        appId: optionalString(account.appId),
        displayName: optionalString(account.displayName) || optionalString(account.accountId) || "",
        enabled: Boolean(account.enabled),
        integrationId: optionalString(account.integrationId) || "",
        qrLoginEnabled: Boolean(account.qrLoginEnabled),
        verificationStatus: optionalString(account.verificationStatus),
        webhook: toRecord(account.webhook) as SdkworkIamOauthScanLoginWebhookInfo,
      };
    })
    : [];
  const modes = normalizeScanLoginModes(record.modes);
  const requestedMode = optionalString(record.defaultQrMode) || "auto";
  return {
    defaultQrMode: requestedMode === "official_account" || requestedMode === "url" ? requestedMode : "auto",
    modes,
    officialAccounts: accounts,
    urlLogin: {
      enabled: typeof urlLogin.enabled === "boolean" ? urlLogin.enabled : true,
      h5LoginOrigin: optionalString(urlLogin.h5LoginOrigin) || "",
    },
  };
}

function normalizeScanLoginModes(value: unknown): SdkworkIamOauthScanLoginModeEntry[] {
  // The backend historically returned the modes registry as a JSON string;
  // accept both the array and the string shape.
  let entries: unknown[] = [];
  if (Array.isArray(value)) {
    entries = value;
  } else if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      if (Array.isArray(parsed)) {
        entries = parsed;
      }
    } catch {
      // Fall through to the empty registry.
    }
  }
  return entries.map((item) => {
    const mode = toRecord(item);
    const entryMode = optionalString(mode.mode) || "url";
    const providerCode = optionalString(mode.providerCode);
    return {
      displayName: optionalString(mode.displayName),
      enabled: Boolean(mode.enabled),
      mode: entryMode,
      providerCode,
      qrMode: optionalString(mode.qrMode)
        || (entryMode === "provider" && providerCode ? `provider:${providerCode}` : entryMode),
      sortOrder: typeof mode.sortOrder === "number" ? mode.sortOrder : 999,
    };
  }).filter((mode) => Boolean(mode.qrMode));
}

function normalizeScanLoginPreview(value: unknown): SdkworkIamOauthScanLoginPreview {
  const record = toRecord(value);
  return {
    expireSeconds: typeof record.expireSeconds === "number" ? record.expireSeconds : undefined,
    qrCode: optionalString(record.qrCode),
    qrContent: optionalString(record.qrContent) || "",
    qrMode: optionalString(record.qrMode) || "url",
  };
}

function normalizeAccountFollowQrCode(value: unknown): SdkworkIamOauthAccountFollowQrCode {
  const record = toRecord(value);
  return {
    expireSeconds: typeof record.expireSeconds === "number" ? record.expireSeconds : 0,
    permanent: Boolean(record.permanent),
    qrCode: optionalString(record.qrCode) || "",
    qrContent: optionalString(record.qrContent) || "",
    qrMode: optionalString(record.qrMode) || "official_account",
    scene: optionalString(record.scene) || "",
    ticket: optionalString(record.ticket) || "",
  };
}

/**
 * Normalizes a raw `config.customMenu` document from the backend into the
 * typed draft, tolerating partial/foreign shapes and repairing malformed
 * entries so the editor always renders a valid tree.
 */
function normalizeCustomMenuDraft(value: unknown): SdkworkIamOauthCustomMenuDraft {
  const record = toRecord(value);
  if (!Array.isArray(record.buttons)) {
    return { buttons: [] };
  }
  return {
    buttons: record.buttons
      .map((button, index) => normalizeMenuButton(button, String(index)))
      .filter((button) => button !== undefined),
    updatedAt: optionalString(record.updatedAt),
  };
}

function normalizeCustomMenuSource(value: unknown): SdkworkIamOauthCustomMenuContext["source"] {
  return value === "database" || value === "wechat" || value === "empty" ? value : undefined;
}

function normalizeMenuButton(value: unknown, path: string): SdkworkIamOauthCustomMenuButton | undefined {
  const record = toRecord(value);
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const key = optionalString(record.key) ?? `imported-menu-${path.replaceAll(".", "-")}`;
  const type = optionalString(record.type);
  const actionType = type === "click" || type === "view" || type === "miniprogram" ? type : undefined;
  const unsupportedType = optionalString(record.unsupportedType);
  const providerAction = toRecord(record.providerAction);
  const subButtons = Array.isArray(record.subButtons)
    ? record.subButtons
        .map((button, index) => normalizeMenuButton(button, `${path}.${index}`))
        .filter((button) => button !== undefined)
    : [];
  return {
    key,
    name: optionalString(record.name) || "",
    type: actionType,
    url: optionalString(record.url),
    appId: optionalString(record.appId),
    pagePath: optionalString(record.pagePath),
    message: optionalString(record.message),
    unsupportedType,
    providerAction: unsupportedType && Object.keys(providerAction).length > 0
      ? providerAction
      : undefined,
    subButtons: subButtons.length > 0 ? subButtons : undefined,
  };
}

function prepareCustomMenuDraft(draft: SdkworkIamOauthCustomMenuDraft): SdkworkIamOauthCustomMenuDraft {
  return {
    ...draft,
    buttons: draft.buttons.map(prepareMenuButton),
  };
}

function prepareMenuButton(button: SdkworkIamOauthCustomMenuButton): SdkworkIamOauthCustomMenuButton {
  const base = {
    key: button.key,
    name: button.name.trim(),
  };
  if (button.subButtons?.length) {
    return {
      ...base,
      subButtons: button.subButtons.map(prepareMenuButton),
    };
  }
  if (button.unsupportedType) {
    return {
      ...base,
      unsupportedType: button.unsupportedType,
      providerAction: button.providerAction,
    };
  }
  switch (button.type) {
    case "click":
      return { ...base, type: "click", message: button.message };
    case "view":
      return { ...base, type: "view", url: button.url?.trim() };
    case "miniprogram":
      return {
        ...base,
        type: "miniprogram",
        appId: button.appId?.trim(),
        pagePath: button.pagePath?.trim(),
        url: button.url?.trim(),
      };
    default:
      return base;
  }
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function optionalString(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  const normalized = trim(String(value));
  return isBlank(normalized) ? undefined : normalized;
}
