import type { SdkworkIamService } from "@sdkwork/iam-service";

import type {
  CreateSdkworkIamOauthAdminControllerInput,
  SdkworkIamOauthAdminController,
  SdkworkIamOauthAdminResourceSnapshot,
  SdkworkIamOauthAdminState,
  SdkworkIamOauthClaimMappingDraft,
  SdkworkIamOauthClientDraft,
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
} from "../types/oauth-admin-types";
import { normalizeList, splitMultilineList, parseRelyingPartyDraftFromTenantApplication } from "../utils/oauth-admin-utils";

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
  let state: SdkworkIamOauthAdminState = {
    ...cloneSnapshot(EMPTY_SNAPSHOT),
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
      };
    },
    async load() {
      setState({ status: "loading", lastError: undefined });
      try {
        const [
          integrations,
          providerCatalog,
          surfaces,
          clients,
          secrets,
          claimMappings,
          webhookConfigs,
          flowConfigs,
          scopeProfiles,
          policies,
          tenantBindings,
          operatorPlatforms,
          diagnosticRuns,
          resourceAccounts,
          resourceAuthorizations,
          accountLinks,
          grants,
          callbackEvents,
          operationalResources,
        ] = await Promise.all([
          service.iam.oauth.integrations.list(),
          service.iam.oauth.providerCatalog.list(),
          service.iam.oauth.surfaces.list(),
          service.iam.oauth.clients.list(),
          service.iam.oauth.secrets.list(),
          service.iam.oauth.claimMappings.list(),
          service.iam.oauth.webhookConfigs.list(),
          service.iam.oauth.flowConfigs.list(),
          service.iam.oauth.scopeProfiles.list(),
          service.iam.oauth.policies.list(),
          service.iam.oauth.tenantBindings.list(),
          service.iam.oauth.operatorPlatforms.list(),
          service.iam.oauth.diagnosticRuns.list(),
          service.iam.oauth.resourceAccounts.list(),
          service.iam.oauth.resourceAuthorizations.list(),
          service.iam.oauth.accountLinks.list(),
          service.iam.oauth.grants.list(),
          service.iam.oauth.callbackEvents.list(),
          service.iam.oauth.operationalResources.list(),
        ]);
        const snapshot: SdkworkIamOauthAdminResourceSnapshot = {
          integrations: normalizeList(integrations),
          providerCatalog: normalizeList(providerCatalog),
          surfaces: normalizeList(surfaces),
          clients: normalizeList(clients),
          secrets: normalizeList(secrets),
          claimMappings: normalizeList(claimMappings),
          webhookConfigs: normalizeList(webhookConfigs),
          flowConfigs: normalizeList(flowConfigs),
          scopeProfiles: normalizeList(scopeProfiles),
          policies: normalizeList(policies),
          tenantBindings: normalizeList(tenantBindings),
          operatorPlatforms: normalizeList(operatorPlatforms),
          diagnosticRuns: normalizeList(diagnosticRuns),
          resourceAccounts: normalizeList(resourceAccounts),
          resourceAuthorizations: normalizeList(resourceAuthorizations),
          accountLinks: normalizeList(accountLinks),
          grants: normalizeList(grants),
          callbackEvents: normalizeList(callbackEvents),
          operationalResources: normalizeList(operationalResources),
        };
        setState({ ...snapshot, status: "ready" });
        return snapshot;
      } catch (error) {
        setState({
          status: "error",
          lastError: error instanceof Error ? error.message : "Failed to load OAuth admin resources",
        });
        throw error;
      }
    },
    createIntegration(body) {
      return wrapCreate(
        () => service.iam.oauth.integrations.create({
          displayName: body.displayName.trim(),
          integrationCode: body.integrationCode.trim(),
          providerCode: body.providerCode.trim(),
          enabled: true,
        }),
        "Failed to create OAuth integration",
        true,
      );
    },
    createClient(body) {
      return wrapCreate(
        () => service.iam.oauth.clients.create({
          clientCode: body.clientCode.trim(),
          displayName: body.displayName.trim(),
          integrationId: body.integrationId.trim(),
          providerClientId: body.providerClientId.trim(),
          providerCode: body.providerCode.trim(),
        }),
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
          secretRef: body.secretRef.trim(),
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
        }),
        "Failed to create OAuth webhook config",
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
          providerCode: body.providerCode.trim(),
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
      return wrapCreate(
        () => service.iam.oauth.operationalResources.update(resourceId.trim(), { enabled }),
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
  };

  return controller;
}
