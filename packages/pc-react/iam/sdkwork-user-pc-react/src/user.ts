import {
  createSdkworkAppCapabilityManifest,
  type CreateSdkworkAppCapabilityManifestOptions,
  type SdkworkAppCapabilityManifest,
} from "@sdkwork/appbase-pc-react";
import type { SdkworkMediaResource } from "@sdkwork/runtime-bootstrap";
import { searchDocuments, type SdkworkSearchDocument } from "@sdkwork/search-pc-react";
import { coalesce, defaultIfBlank, isBlank, trim } from "@sdkwork/utils";

export type SdkworkUserCenterGroup = "account" | "activity" | "security" | "workspace";

export interface SdkworkUserProfileInput {
  avatar?: SdkworkMediaResource;
  displayName?: string;
  email?: string;
  firstName?: string;
  id: string;
  lastName?: string;
  username?: string;
}

export interface SdkworkUserProfileSummary {
  avatar?: SdkworkMediaResource;
  displayName: string;
  email?: string;
  id: string;
  initials: string;
}

export interface SdkworkUserCenterSection {
  description?: string;
  enabled?: boolean;
  group: SdkworkUserCenterGroup;
  id: string;
  keywords?: string[];
  order?: number;
  route: string;
  title: string;
}

export interface SdkworkUserCenterRegistry {
  groups: Record<SdkworkUserCenterGroup, SdkworkUserCenterSection[]>;
  sections: SdkworkUserCenterSection[];
  sectionsById: Record<string, SdkworkUserCenterSection>;
}

export interface SdkworkUserMenuEntry {
  id: string;
  route?: string;
  title: string;
}

export type SdkworkUserCenterSectionDigestStatus =
  | "attention"
  | "complete"
  | "current"
  | "restricted"
  | "standard";

export interface CreateUserCenterSectionDigestOptions {
  activeGroup?: SdkworkUserCenterGroup;
  attentionSectionIds?: readonly string[];
  completedSectionIds?: readonly string[];
  currentSectionId?: string;
  route?: string | null;
}

export interface SdkworkUserCenterSectionDigest {
  description?: string;
  digestStatus: SdkworkUserCenterSectionDigestStatus;
  group: SdkworkUserCenterGroup;
  id: string;
  isAvailable: boolean;
  isComplete: boolean;
  isCurrent: boolean;
  isEnabled: boolean;
  keywordCount: number;
  matchesGroup: boolean;
  needsAttention: boolean;
  route?: string;
  title: string;
}

export interface SdkworkUserCenterSectionDigestSummary {
  accountSections: number;
  activitySections: number;
  attentionSections: number;
  availableSections: number;
  completeSections: number;
  currentSections: number;
  restrictedSections: number;
  securitySections: number;
  totalSections: number;
  workspaceSections: number;
}

export type SdkworkUserCenterSectionAction = "focus-section" | "open-section";

export type SdkworkUserCenterSectionIssue =
  | "already-current-section"
  | "group-mismatch"
  | "missing-route"
  | "section-disabled";

export interface EvaluateUserCenterSectionReadinessOptions {
  action?: SdkworkUserCenterSectionAction;
}

export interface SdkworkUserCenterSectionChecklist {
  hasRoute: boolean;
  isAvailable: boolean;
  isCurrent: boolean;
  isEnabled: boolean;
  matchesGroup: boolean;
}

export interface SdkworkUserCenterSectionCapabilities {
  canFocusSection: boolean;
  canOpenSection: boolean;
}

export interface SdkworkUserCenterSectionReadiness {
  capabilities: SdkworkUserCenterSectionCapabilities;
  checklist: SdkworkUserCenterSectionChecklist;
  degraded: boolean;
  issues: SdkworkUserCenterSectionIssue[];
  ready: boolean;
}

export interface SdkworkUserWorkspaceManifest extends SdkworkAppCapabilityManifest {
  capability: "user";
  routePath: string;
  sectionRoutePattern: string;
}

export interface CreateUserWorkspaceManifestOptions
  extends Partial<
    Pick<CreateSdkworkAppCapabilityManifestOptions, "description" | "host" | "id" | "packageNames" | "theme" | "title">
  > {
  routePath?: string;
}

export interface SdkworkUserRouteIntent {
  focusWindow: boolean;
  group?: SdkworkUserCenterGroup;
  route: string;
  source: "user-workspace";
  type: "user-route-intent";
}

export interface CreateUserRouteIntentOptions {
  basePath?: string;
  focusWindow?: boolean;
  group?: SdkworkUserCenterGroup;
}

export interface SdkworkUserSectionRouteIntent {
  focusWindow: boolean;
  group?: SdkworkUserCenterGroup;
  route: string;
  sectionId: string;
  source: "user-workspace";
  type: "user-section-route-intent";
}

export interface CreateUserSectionRouteIntentOptions {
  basePath?: string;
  focusWindow?: boolean;
  group?: SdkworkUserCenterGroup;
}

export interface SdkworkCanonicalUserCapability<
  TSourcePackageName extends string = string,
> {
  capability: "user";
  routePath: string;
  sectionRoutePattern: string;
  sourcePackageName: TSourcePackageName;
}

export interface CreateSdkworkCanonicalUserCapabilityOptions<
  TSourcePackageName extends string = string,
> {
  routePath?: string;
  sourcePackageName: TSourcePackageName;
}

export interface SdkworkCanonicalUserWorkspaceManifest<
  TArchitecture extends string = string,
  TBridgePackageName extends string = string,
  TSourcePackageName extends string = string,
> extends Omit<SdkworkUserWorkspaceManifest, "architecture"> {
  architecture: TArchitecture;
  bridgePackageName: TBridgePackageName;
  sourcePackageNames: readonly [TSourcePackageName];
}

export interface CreateSdkworkCanonicalUserWorkspaceManifestOptions<
  TArchitecture extends string = string,
  TBridgePackageName extends string = string,
  TSourcePackageName extends string = string,
> extends Omit<CreateUserWorkspaceManifestOptions, "packageNames"> {
  architecture: TArchitecture;
  bridgePackageName: TBridgePackageName;
  packageNames?: readonly string[];
  sourcePackageName: TSourcePackageName;
}

export interface SdkworkCanonicalUserRouteIntent<
  TSourcePackageName extends string = string,
> extends SdkworkUserRouteIntent {
  capability: "user";
  path: string;
  sourcePackageName: TSourcePackageName;
}

export interface CreateSdkworkCanonicalUserRouteIntentOptions<
  TSourcePackageName extends string = string,
> extends CreateUserRouteIntentOptions {
  sourcePackageName: TSourcePackageName;
}

export interface SdkworkCanonicalUserSectionRouteIntent<
  TSourcePackageName extends string = string,
> extends SdkworkUserSectionRouteIntent {
  capability: "user";
  path: string;
  sourcePackageName: TSourcePackageName;
}

export interface CreateSdkworkCanonicalUserSectionRouteIntentOptions<
  TSourcePackageName extends string = string,
> extends CreateUserSectionRouteIntentOptions {
  sourcePackageName: TSourcePackageName;
}

export interface CreateSdkworkUserMenuEntriesOptions {
  includeSignOut?: boolean;
  registry: SdkworkUserCenterRegistry;
}

const USER_CENTER_GROUP_ORDER: readonly SdkworkUserCenterGroup[] = [
  "account",
  "workspace",
  "security",
  "activity",
];

function createEmptyGroupRecord(): Record<SdkworkUserCenterGroup, SdkworkUserCenterSection[]> {
  return USER_CENTER_GROUP_ORDER.reduce<Record<SdkworkUserCenterGroup, SdkworkUserCenterSection[]>>(
    (accumulator, group) => {
      accumulator[group] = [];
      return accumulator;
    },
    {} as Record<SdkworkUserCenterGroup, SdkworkUserCenterSection[]>,
  );
}

function normalizeBasePath(basePath: string | undefined, fallback: string): string {
  const normalizedBasePath = basePath?.trim().replace(/\/+$/, "");
  return normalizedBasePath || fallback;
}

function normalizeRoute(route: string | null | undefined): string | undefined {
  const normalizedRoute = route?.trim();
  return normalizedRoute ? normalizedRoute : undefined;
}

function isEnabled(section: SdkworkUserCenterSection): boolean {
  return section.enabled !== false;
}

function createIdSet(ids: readonly string[] | undefined): Set<string> {
  return new Set(ids ?? []);
}

function toUniquePackages(packageNames: readonly string[]): string[] {
  return Array.from(new Set(packageNames.map((packageName) => packageName.trim()).filter(Boolean)));
}

function sortSections(sections: readonly SdkworkUserCenterSection[]): SdkworkUserCenterSection[] {
  return [...sections].sort((left, right) => {
    if (left.group !== right.group) {
      return USER_CENTER_GROUP_ORDER.indexOf(left.group) - USER_CENTER_GROUP_ORDER.indexOf(right.group);
    }

    const leftOrder = left.order ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = right.order ?? Number.MAX_SAFE_INTEGER;
    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    return left.title.localeCompare(right.title);
  });
}

function toSearchDocument(section: SdkworkUserCenterSection): SdkworkSearchDocument {
  return {
    description: section.description,
    group: section.group,
    id: section.id,
    keywords: section.keywords,
    title: section.title,
  };
}

function computeDisplayName(profile: SdkworkUserProfileInput): string {
  const fullName = [
    profile.firstName,
    profile.lastName,
  ]
    .filter(Boolean)
    .map((value) => (value ? trim(value) : value))
    .filter((value): value is string => !isBlank(value))
    .join(" ");

  return (
    coalesce(
      profile.displayName,
      fullName,
      profile.username,
      profile.email,
    ) ?? "User"
  );
}

function computeInitials(displayName: string): string {
  const parts = displayName
    .split(/\s+/)
    .map((value) => value.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return "U";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function createUserProfileSummary(
  profile: SdkworkUserProfileInput,
): SdkworkUserProfileSummary {
  const displayName = computeDisplayName(profile);

  return {
    avatar: profile.avatar,
    displayName,
    email: coalesce(profile.email),
    id: profile.id,
    initials: computeInitials(displayName),
  };
}

export function createUserCenterRegistry(
  sections: readonly SdkworkUserCenterSection[],
): SdkworkUserCenterRegistry {
  const sectionsById: Record<string, SdkworkUserCenterSection> = {};

  for (const section of sections) {
    if (sectionsById[section.id]) {
      throw new Error(`Duplicate user center section id: ${section.id}`);
    }

    sectionsById[section.id] = section;
  }

  const sortedSections = sortSections(sections);
  const groups = createEmptyGroupRecord();

  for (const section of sortedSections) {
    groups[section.group].push(section);
  }

  return {
    groups,
    sections: sortedSections,
    sectionsById,
  };
}

export function searchUserCenterRegistry(
  registry: SdkworkUserCenterRegistry,
  query: string,
): SdkworkUserCenterSection[] {
  return searchDocuments(registry.sections.map(toSearchDocument), query)
    .map((result) => registry.sectionsById[result.document.id])
    .filter((section): section is SdkworkUserCenterSection => Boolean(section));
}

export function resolveDefaultUserCenterSection(
  registry: Pick<SdkworkUserCenterRegistry, "sections">,
): SdkworkUserCenterSection | undefined {
  return registry.sections[0];
}

export function createUserCenterSectionDigest(
  section: SdkworkUserCenterSection,
  options: CreateUserCenterSectionDigestOptions = {},
): SdkworkUserCenterSectionDigest {
  const attentionSectionIds = createIdSet(options.attentionSectionIds);
  const completedSectionIds = createIdSet(options.completedSectionIds);
  const route = Object.prototype.hasOwnProperty.call(options, "route")
    ? normalizeRoute(options.route)
    : normalizeRoute(section.route);
  const isCurrent = options.currentSectionId === section.id;
  const isEnabledValue = isEnabled(section);
  const isAvailable = isEnabledValue && Boolean(route);
  const isComplete = completedSectionIds.has(section.id);
  const needsAttention = attentionSectionIds.has(section.id);
  const matchesGroup = options.activeGroup ? options.activeGroup === section.group : true;

  let digestStatus: SdkworkUserCenterSectionDigestStatus = "standard";
  if (!isAvailable) {
    digestStatus = "restricted";
  } else if (isCurrent) {
    digestStatus = "current";
  } else if (needsAttention) {
    digestStatus = "attention";
  } else if (isComplete) {
    digestStatus = "complete";
  }

  return {
    description: section.description,
    digestStatus,
    group: section.group,
    id: section.id,
    isAvailable,
    isComplete,
    isCurrent,
    isEnabled: isEnabledValue,
    keywordCount: section.keywords?.length ?? 0,
    matchesGroup,
    needsAttention,
    ...(route ? { route } : {}),
    title: section.title,
  };
}

export function summarizeUserCenterSectionDigests(
  digests: readonly SdkworkUserCenterSectionDigest[],
): SdkworkUserCenterSectionDigestSummary {
  return digests.reduce<SdkworkUserCenterSectionDigestSummary>(
    (summary, digest) => {
      summary.totalSections += 1;

      if (digest.isAvailable) {
        summary.availableSections += 1;
      } else {
        summary.restrictedSections += 1;
      }

      if (digest.isCurrent) {
        summary.currentSections += 1;
      }

      if (digest.isComplete) {
        summary.completeSections += 1;
      }

      if (digest.needsAttention) {
        summary.attentionSections += 1;
      }

      if (digest.group === "account") {
        summary.accountSections += 1;
      } else if (digest.group === "workspace") {
        summary.workspaceSections += 1;
      } else if (digest.group === "security") {
        summary.securitySections += 1;
      } else {
        summary.activitySections += 1;
      }

      return summary;
    },
    {
      accountSections: 0,
      activitySections: 0,
      attentionSections: 0,
      availableSections: 0,
      completeSections: 0,
      currentSections: 0,
      restrictedSections: 0,
      securitySections: 0,
      totalSections: 0,
      workspaceSections: 0,
    },
  );
}

export function evaluateUserCenterSectionReadiness(
  digest: SdkworkUserCenterSectionDigest,
  options: EvaluateUserCenterSectionReadinessOptions = {},
): SdkworkUserCenterSectionReadiness {
  const action = options.action ?? "open-section";
  const checklist: SdkworkUserCenterSectionChecklist = {
    hasRoute: Boolean(digest.route),
    isAvailable: digest.isAvailable,
    isCurrent: digest.isCurrent,
    isEnabled: digest.isEnabled,
    matchesGroup: digest.matchesGroup,
  };
  const capabilities: SdkworkUserCenterSectionCapabilities = {
    canFocusSection: digest.isEnabled && Boolean(digest.route) && !digest.isCurrent,
    canOpenSection: digest.isEnabled && Boolean(digest.route),
  };

  const issues: SdkworkUserCenterSectionIssue[] = [];
  if (!digest.matchesGroup) {
    issues.push("group-mismatch");
  }

  if (!digest.isEnabled) {
    issues.push("section-disabled");
  }

  if (!digest.route) {
    issues.push("missing-route");
  }

  if (action === "focus-section" && digest.isCurrent) {
    issues.push("already-current-section");
  }

  return {
    capabilities,
    checklist,
    degraded: issues.includes("group-mismatch"),
    issues,
    ready: action === "focus-section" ? capabilities.canFocusSection : capabilities.canOpenSection,
  };
}

export function createUserMenuEntries({
  includeSignOut = false,
  registry,
}: CreateSdkworkUserMenuEntriesOptions): SdkworkUserMenuEntry[] {
  const entries: SdkworkUserMenuEntry[] = registry.sections.map((section) => ({
    id: section.id,
    route: section.route,
    title: section.title,
  }));

  if (includeSignOut) {
    entries.push({
      id: "sign-out",
      title: "Sign out",
    });
  }

  return entries;
}

export function createUserWorkspaceManifest({
  description = "User workspace for profile-center routing, section navigation, and reusable account-surface assembly.",
  host,
  id = "sdkwork-user",
  packageNames = ["@sdkwork/user-pc-react"],
  routePath = "/user",
  theme,
  title = "User",
}: CreateUserWorkspaceManifestOptions = {}): SdkworkUserWorkspaceManifest {
  const resolvedRoutePath = normalizeBasePath(routePath, "/user");

  return {
    ...createSdkworkAppCapabilityManifest({
      description,
      host,
      id,
      packageNames: toUniquePackages(packageNames),
      theme,
      title,
    }),
    capability: "user",
    routePath: resolvedRoutePath,
    sectionRoutePattern: `${resolvedRoutePath}/sections/:sectionId`,
  };
}

export function createSdkworkCanonicalUserCapability<
  TSourcePackageName extends string,
>({
  routePath = "/user",
  sourcePackageName,
}: CreateSdkworkCanonicalUserCapabilityOptions<TSourcePackageName>): SdkworkCanonicalUserCapability<TSourcePackageName> {
  const resolvedRoutePath = normalizeBasePath(routePath, "/user");

  return {
    capability: "user",
    routePath: resolvedRoutePath,
    sectionRoutePattern: `${resolvedRoutePath}/sections/:sectionId`,
    sourcePackageName,
  };
}

export function createSdkworkCanonicalUserWorkspaceManifest<
  TArchitecture extends string,
  TBridgePackageName extends string,
  TSourcePackageName extends string,
>({
  architecture,
  bridgePackageName,
  packageNames,
  sourcePackageName,
  ...options
}: CreateSdkworkCanonicalUserWorkspaceManifestOptions<
  TArchitecture,
  TBridgePackageName,
  TSourcePackageName
>): SdkworkCanonicalUserWorkspaceManifest<
  TArchitecture,
  TBridgePackageName,
  TSourcePackageName
> {
  return {
    ...createUserWorkspaceManifest({
      ...options,
      packageNames: packageNames ? [...packageNames] : undefined,
    }),
    architecture,
    bridgePackageName,
    sourcePackageNames: [sourcePackageName],
  };
}

export function createUserRouteIntent(
  options: CreateUserRouteIntentOptions = {},
): SdkworkUserRouteIntent {
  const basePath = normalizeBasePath(options.basePath, "/user");
  const queryParams = new URLSearchParams();

  if (options.group) {
    queryParams.set("group", options.group);
  }

  const querySuffix = queryParams.toString() ? `?${queryParams.toString()}` : "";

  return {
    focusWindow: options.focusWindow !== false,
    ...(options.group ? { group: options.group } : {}),
    route: `${basePath}${querySuffix}`,
    source: "user-workspace",
    type: "user-route-intent",
  };
}

export function createSdkworkCanonicalUserRouteIntent<
  TSourcePackageName extends string,
>({
  sourcePackageName,
  ...options
}: CreateSdkworkCanonicalUserRouteIntentOptions<TSourcePackageName>): SdkworkCanonicalUserRouteIntent<TSourcePackageName> {
  const intent = createUserRouteIntent(options);

  return {
    ...intent,
    capability: "user",
    path: intent.route,
    sourcePackageName,
  };
}

export function createUserSectionRouteIntent(
  sectionId: string,
  options: CreateUserSectionRouteIntentOptions = {},
): SdkworkUserSectionRouteIntent {
  const basePath = normalizeBasePath(options.basePath, "/user");
  const queryParams = new URLSearchParams();

  if (options.group) {
    queryParams.set("group", options.group);
  }

  const querySuffix = queryParams.toString() ? `?${queryParams.toString()}` : "";

  return {
    focusWindow: options.focusWindow !== false,
    ...(options.group ? { group: options.group } : {}),
    route: `${basePath}/sections/${sectionId}${querySuffix}`,
    sectionId,
    source: "user-workspace",
    type: "user-section-route-intent",
  };
}

export function createSdkworkCanonicalUserSectionRouteIntent<
  TSourcePackageName extends string,
>(
  sectionId: string,
  {
    sourcePackageName,
    ...options
  }: CreateSdkworkCanonicalUserSectionRouteIntentOptions<TSourcePackageName>,
): SdkworkCanonicalUserSectionRouteIntent<TSourcePackageName> {
  const intent = createUserSectionRouteIntent(sectionId, options);

  return {
    ...intent,
    capability: "user",
    path: intent.route,
    sourcePackageName,
  };
}

export const userPackageMeta = {
  architecture: "pc-react",
  domain: "iam",
  package: "@sdkwork/user-pc-react",
  status: "ready",
} as const;

export type UserPackageMeta = typeof userPackageMeta;
