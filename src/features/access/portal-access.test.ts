import { describe, expect, it } from "vitest";
import { canAccessPortalFeature } from "@/features/access/portal-access";

describe("portal feature access", () => {
  it("allows lawyers to use every lawyer-facing portal feature", () => {
    for (const feature of ["upload", "books", "categories", "reports", "office-settings"] as const) {
      expect(canAccessPortalFeature("lawyer", feature)).toBe(true);
      expect(canAccessPortalFeature("user", feature)).toBe(false);
    }
  });

  it("keeps issuer-only features out of participant direct routes", () => {
    expect(canAccessPortalFeature("user", "upload")).toBe(false);
    expect(canAccessPortalFeature("user", "books")).toBe(false);
  });

  it("keeps participant-only features out of issuer direct routes", () => {
    expect(canAccessPortalFeature("lawyer", "invitations")).toBe(false);
    expect(canAccessPortalFeature("lawyer", "my-requests")).toBe(false);
  });

  it("does not grant protected features to unsupported roles", () => {
    expect(canAccessPortalFeature("unsupported", "upload")).toBe(false);
    expect(canAccessPortalFeature("unsupported", "invitations")).toBe(false);
  });
});
