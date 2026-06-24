import { describe, expect, it } from "vitest";
import { userCenterPackageMeta } from "../src";

describe("@sdkwork/user-center-pc-react package meta", () => {
  it("exports the canonical package identity for the user center capability", () => {
    expect(userCenterPackageMeta).toEqual({
      architecture: "pc-react",
      capability: "user-center",
      domain: "iam",
      package: "@sdkwork/user-center-pc-react",
      status: "ready",
    });
  });
});
