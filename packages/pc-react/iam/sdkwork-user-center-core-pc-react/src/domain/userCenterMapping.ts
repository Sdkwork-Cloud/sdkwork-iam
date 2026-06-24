import type {
  CanonicalUserCenterSnapshot,
  StandardUserCenterOrganizationRelationRecord,
  StandardUserCenterSnapshotInput,
} from "../types/userCenterTypes.ts";

function normalizeOptionalText(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function toUniqueSortedValues(values: Array<string | undefined>): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => normalizeOptionalText(value))
        .filter((value): value is string => Boolean(value)),
    ),
  );
}

function collectOrganizationTargetIds(
  relations: StandardUserCenterOrganizationRelationRecord[] | undefined,
  type: StandardUserCenterOrganizationRelationRecord["type"],
): string[] {
  return toUniqueSortedValues(
    (relations ?? [])
      .filter((relation) => relation.type === type && relation.isActive !== false)
      .map((relation) => relation.targetId),
  );
}

export function mapStandardUserCenterSnapshot(
  snapshot: StandardUserCenterSnapshotInput,
): CanonicalUserCenterSnapshot {
  const userDisplayName =
    normalizeOptionalText(snapshot.user?.displayName)
    || normalizeOptionalText(snapshot.user?.nickname)
    || normalizeOptionalText(snapshot.user?.username)
    || normalizeOptionalText(snapshot.user?.email)
    || "User";

  return {
    organization: {
      departmentIds: collectOrganizationTargetIds(
        snapshot.organizationMembership?.membershipRelations,
        "DEPARTMENT",
      ),
      isActive: snapshot.organizationMembership?.isActive !== false,
      owner: normalizeOptionalText(snapshot.organizationMembership?.owner),
      ownerId: normalizeOptionalText(snapshot.organizationMembership?.ownerId),
      positionIds: collectOrganizationTargetIds(
        snapshot.organizationMembership?.membershipRelations,
        "POSITION",
      ),
      roleIds: collectOrganizationTargetIds(
        snapshot.organizationMembership?.membershipRelations,
        "ROLE",
      ),
      userId: normalizeOptionalText(snapshot.organizationMembership?.userId),
    },
    tenant: {
      bizType: normalizeOptionalText(snapshot.tenant?.bizType),
      code: normalizeOptionalText(snapshot.tenant?.code),
      name: normalizeOptionalText(snapshot.tenant?.name),
      status: normalizeOptionalText(snapshot.tenant?.status),
      type: normalizeOptionalText(snapshot.tenant?.type),
    },
    user: {
      bio: normalizeOptionalText(snapshot.user?.bio),
      displayName: userDisplayName,
      email: normalizeOptionalText(snapshot.user?.email),
      id: normalizeOptionalText(snapshot.user?.userId) || userDisplayName,
      metadata: snapshot.user?.metadata ?? {},
      roleIds: toUniqueSortedValues(snapshot.user?.roles ?? []),
      status: normalizeOptionalText(snapshot.user?.status),
      type: normalizeOptionalText(snapshot.user?.type),
      username: normalizeOptionalText(snapshot.user?.username),
    },
  };
}
