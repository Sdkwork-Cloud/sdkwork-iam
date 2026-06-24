import { describe, expect, it } from "vitest";
import {
  createUserCenterSectionDigest,
  createSdkworkUserProfileFromCanonicalIdentity,
  createUserCenterRegistry,
  createUserMenuEntries,
  createUserProfileSummary,
  createUserRouteIntent,
  createUserSectionRouteIntent,
  createUserWorkspaceManifest,
  evaluateUserCenterSectionReadiness,
  resolveDefaultUserCenterSection,
  searchUserCenterRegistry,
  summarizeUserCenterSectionDigests,
} from "../src";

describe("sdkwork-user-pc-react", () => {
  it("does not synthesize profile names from missing canonical identity", () => {
    expect(createSdkworkUserProfileFromCanonicalIdentity({})).toEqual({
      avatar: undefined,
      email: "",
      emailVerified: false,
      firstName: "",
      lastName: "",
      phone: "",
      phoneVerified: false,
    });
  });

  it("builds user summaries with stable display names and initials", () => {
    expect(
      createUserProfileSummary({
        email: "jason@sdkwork.ai",
        firstName: "Jason",
        id: "user-1",
        lastName: "Young",
      }),
    ).toEqual({
      avatar: undefined,
      displayName: "Jason Young",
      email: "jason@sdkwork.ai",
      id: "user-1",
      initials: "JY",
    });

    expect(
      createUserProfileSummary({
        id: "user-2",
        username: "codebox",
      }).displayName,
    ).toBe("codebox");
  });

  it("creates user center registries and menu entries", () => {
    const registry = createUserCenterRegistry([
      {
        group: "account",
        id: "profile",
        route: "/settings/profile",
        title: "Profile",
      },
      {
        group: "security",
        id: "security",
        keywords: [
          "passkey",
          "password",
        ],
        route: "/settings/security",
        title: "Security",
      },
    ]);

    expect(registry.groups.account.map((item) => item.id)).toEqual(["profile"]);
    expect(searchUserCenterRegistry(registry, "passkey").map((item) => item.id)).toEqual(["security"]);
    expect(
      createUserMenuEntries({
        includeSignOut: true,
        registry,
      }).map((entry) => entry.id),
    ).toEqual([
      "profile",
      "security",
      "sign-out",
    ]);
  });

  it("resolves default user sections, creates section digests, and summarizes user-center capability", () => {
    const registry = createUserCenterRegistry([
      {
        group: "account",
        id: "profile",
        order: 1,
        route: "/settings/profile",
        title: "Profile",
      },
      {
        group: "account",
        id: "activity",
        order: 2,
        route: "/settings/activity",
        title: "Activity",
      },
      {
        group: "workspace",
        id: "members",
        order: 1,
        route: "/settings/workspace/members",
        title: "Members",
      },
      {
        group: "security",
        id: "security",
        order: 1,
        route: "/settings/security",
        title: "Security",
      },
      {
        enabled: false,
        group: "activity",
        id: "activity-log",
        order: 1,
        route: "/settings/activity",
        title: "Activity",
      },
    ]);

    expect(resolveDefaultUserCenterSection(registry)?.id).toBe("profile");

    const digests = registry.sections.map((section) =>
      createUserCenterSectionDigest(section, {
        activeGroup: "account",
        attentionSectionIds: ["security"],
        completedSectionIds: ["profile", "members"],
        currentSectionId: "profile",
      }),
    );

    expect(digests[0]).toEqual({
      description: undefined,
      digestStatus: "current",
      group: "account",
      id: "profile",
      isAvailable: true,
      isComplete: true,
      isCurrent: true,
      isEnabled: true,
      keywordCount: 0,
      matchesGroup: true,
      needsAttention: false,
      route: "/settings/profile",
      title: "Profile",
    });

    expect(digests[2].digestStatus).toBe("complete");
    expect(digests[3].digestStatus).toBe("attention");
    expect(digests[4].digestStatus).toBe("restricted");

    expect(summarizeUserCenterSectionDigests(digests)).toEqual({
      accountSections: 2,
      activitySections: 1,
      attentionSections: 1,
      availableSections: 4,
      completeSections: 2,
      currentSections: 1,
      restrictedSections: 1,
      securitySections: 1,
      totalSections: 5,
      workspaceSections: 1,
    });
  });

  it("evaluates user-center section readiness for normal, degraded, and blocked navigation", () => {
    const currentDigest = createUserCenterSectionDigest(
      {
        group: "account",
        id: "profile",
        route: "/settings/profile",
        title: "Profile",
      },
      {
        activeGroup: "account",
        completedSectionIds: ["profile"],
        currentSectionId: "profile",
      },
    );
    const securityDigest = createUserCenterSectionDigest(
      {
        group: "security",
        id: "security",
        route: "/settings/security",
        title: "Security",
      },
      {
        activeGroup: "account",
        attentionSectionIds: ["security"],
      },
    );
    const disabledDigest = createUserCenterSectionDigest(
      {
        enabled: false,
        group: "activity",
        id: "activity-log",
        route: "/settings/activity",
        title: "Activity",
      },
      {
        activeGroup: "activity",
      },
    );
    const brokenRouteDigest = createUserCenterSectionDigest(
      {
        group: "account",
        id: "activity",
        route: "/settings/activity",
        title: "Activity",
      },
      {
        activeGroup: "account",
        route: null,
      },
    );

    expect(
      evaluateUserCenterSectionReadiness(securityDigest, {
        action: "focus-section",
      }),
    ).toEqual({
      capabilities: {
        canFocusSection: true,
        canOpenSection: true,
      },
      checklist: {
        hasRoute: true,
        isAvailable: true,
        isCurrent: false,
        isEnabled: true,
        matchesGroup: false,
      },
      degraded: true,
      issues: ["group-mismatch"],
      ready: true,
    });

    expect(
      evaluateUserCenterSectionReadiness(currentDigest, {
        action: "focus-section",
      }),
    ).toEqual({
      capabilities: {
        canFocusSection: false,
        canOpenSection: true,
      },
      checklist: {
        hasRoute: true,
        isAvailable: true,
        isCurrent: true,
        isEnabled: true,
        matchesGroup: true,
      },
      degraded: false,
      issues: ["already-current-section"],
      ready: false,
    });

    expect(evaluateUserCenterSectionReadiness(disabledDigest)).toEqual({
      capabilities: {
        canFocusSection: false,
        canOpenSection: false,
      },
      checklist: {
        hasRoute: true,
        isAvailable: false,
        isCurrent: false,
        isEnabled: false,
        matchesGroup: true,
      },
      degraded: false,
      issues: ["section-disabled"],
      ready: false,
    });

    expect(evaluateUserCenterSectionReadiness(brokenRouteDigest)).toEqual({
      capabilities: {
        canFocusSection: false,
        canOpenSection: false,
      },
      checklist: {
        hasRoute: false,
        isAvailable: false,
        isCurrent: false,
        isEnabled: true,
        matchesGroup: true,
      },
      degraded: false,
      issues: ["missing-route"],
      ready: false,
    });
  });

  it("creates user manifests and user-center route intents", () => {
    const manifest = createUserWorkspaceManifest({
      packageNames: ["@sdkwork/user-pc-react", "@sdkwork/user-pc-react"],
      title: "User Center",
    });

    expect(manifest).toMatchObject({
      capability: "user",
      routePath: "/user",
      sectionRoutePattern: "/user/sections/:sectionId",
      title: "User Center",
    });
    expect(manifest.packageNames).toEqual(["@sdkwork/user-pc-react"]);

    expect(
      createUserRouteIntent({
        basePath: "/account",
        focusWindow: false,
        group: "security",
      }),
    ).toEqual({
      focusWindow: false,
      group: "security",
      route: "/account?group=security",
      source: "user-workspace",
      type: "user-route-intent",
    });

    expect(
      createUserSectionRouteIntent("security", {
        basePath: "/account",
        group: "security",
      }),
    ).toEqual({
      focusWindow: true,
      group: "security",
      route: "/account/sections/security?group=security",
      sectionId: "security",
      source: "user-workspace",
      type: "user-section-route-intent",
    });
  });
});
