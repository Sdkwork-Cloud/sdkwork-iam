import type {
  UserCenterSeedContract,
  UserCenterSeedContractCatalog,
  UserCenterSeedContractField,
  UserCenterSeedStorageDomain,
} from "../types/userCenterTypes.ts";

export const USER_CENTER_SEED_STORAGE_DOMAINS = [
  "sqlite",
  "postgresql",
  "upstream-bridge",
] as const satisfies readonly UserCenterSeedStorageDomain[];

function createSeedField(
  name: string,
  _description: string,
  required: boolean,
  secret = false,
): UserCenterSeedContractField {
  return {
    name,
    required,
    ...(secret ? { secret: true } : {}),
  };
}

function createSeedContract(
  description: string,
  fields: readonly UserCenterSeedContractField[],
): UserCenterSeedContract {
  return {
    description,
    domains: [...USER_CENTER_SEED_STORAGE_DOMAINS],
    exportable: true,
    fields: fields.map((field) => ({
      ...field,
    })),
    idempotent: true,
    inspectable: true,
    replaySafe: true,
  };
}

export function createUserCenterSeedContractCatalog(): UserCenterSeedContractCatalog {
  return {
    authority: createSeedContract(
      "Operator-provided authority import records for user-center ownership and providers.",
      [
        createSeedField(
          "tenantRecords",
          "Tenant records imported from the governed IAM authority.",
          true,
        ),
        createSeedField(
          "userRecords",
          "User records imported from the governed IAM authority.",
          true,
        ),
        createSeedField("profileRecords", "User profile records imported from the governed IAM authority.", true),
        createSeedField(
          "providerMetadataRecords",
          "Provider metadata records imported from the governed IAM authority.",
          true,
        ),
        createSeedField(
          "oauthProviderMetadata",
          "OAuth provider metadata exposed to the canonical auth surface.",
          false,
        ),
      ],
    ),
    authDevelopment: createSeedContract(
      "Operator-provided login prefill metadata; credentials are never synthesized.",
      [
        createSeedField(
          "explicitPrefillAccount",
          "An explicitly configured account identifier for UI prefill only.",
          false,
        ),
        createSeedField(
          "explicitPrefillEmail",
          "An explicitly configured email for UI prefill only.",
          false,
        ),
        createSeedField(
          "explicitPrefillPhone",
          "An explicitly configured phone number for UI prefill only.",
          false,
        ),
        createSeedField(
          "explicitPrefillPassword",
          "An explicitly configured password for UI prefill only.",
          false,
          true,
        ),
        createSeedField(
          "explicitPrefillLoginMethod",
          "An explicitly configured login method for UI prefill only.",
          false,
        ),
      ],
    ),
    catalog: createSeedContract(
      "Operator-provided catalog records for models, templates, providers, and skills.",
      [
        createSeedField("skillCatalogRecords", "Skill catalog records imported from the governed catalog source.", true),
        createSeedField("templateCatalogRecords", "Template catalog records imported from the governed catalog source.", true),
        createSeedField("modelCatalogRecords", "Model catalog records imported from the governed catalog source.", true),
        createSeedField("providerCatalogRecords", "Provider catalog records imported from the governed catalog source.", true),
      ],
    ),
    workspace: createSeedContract(
      "Operator-provided workspace and project import records.",
      [
        createSeedField("workspaceRecords", "Workspace records imported from the governed workspace source.", true),
        createSeedField("projectRecords", "Project records and files imported from the governed workspace source.", true),
        createSeedField(
          "runtimeConfigurationRecords",
          "Runtime configuration records imported from the governed workspace source.",
          true,
        ),
        createSeedField("policyRecords", "Policy records imported from the governed workspace source.", true),
      ],
    ),
  };
}
