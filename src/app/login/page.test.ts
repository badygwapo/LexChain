import { describe, expect, it } from "vitest";
import { getRedirectPath } from "@/features/auth/pages/login-page";

describe("unified login routing", () => {
  it("routes the issuer to the dashboard and the participant to shared documents", () => {
    expect(getRedirectPath({ user: { role: "document_issuer" } })).toBe("/portal/dashboard");
    expect(getRedirectPath({ user: { role: "document_participant" } })).toBe("/portal/documents");
  });

  it("keeps unsupported roles at login", () => {
    expect(getRedirectPath({ user: { role: "staff" } })).toBe("/login");
  });
});
