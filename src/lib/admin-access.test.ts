import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { getRedirectUrl } from "next/experimental/testing/server";
import { ISSUER_MANAGEMENT_PATHS, proxy } from "../proxy";

function adminRequest(path: string, cookie?: string) {
  return new NextRequest(`https://lexchain.test${path}`, {
    headers: cookie ? { cookie } : undefined,
  });
}

describe("issuer management proxy access", () => {
  it.each([
    ["/admin/dashboard", "/portal/dashboard"],
    ["/admin/users", "/portal/users"],
    ["/admin/invitations-permissions", "/portal/issuer-invitations"],
    ["/admin/generated-reports", "/portal/reports"],
    ["/admin/audit-logs", "/portal/audit-logs"],
    ["/admin/login", "/login"],
    ["/admin/unmapped", "/portal/dashboard"],
  ])("redirects legacy %s pages to %s", (legacyPath, target) => {
    const response = proxy(adminRequest(
      legacyPath,
      "admin_token=admin-token; portal_token=admin-token",
    ));

    expect(getRedirectUrl(response)).toBe(`https://lexchain.test${target}`);
  });

  it("preserves admin API routes", () => {
    const response = proxy(adminRequest("/api/admin/dashboard"));

    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(getRedirectUrl(response)).toBeNull();
  });

  it("redirects retired pages to the consolidated dashboard", () => {
    for (const path of [
      "/portal/analytics",
      "/portal/system-statistics",
      "/portal/processing",
      "/portal/blockchain-records",
    ]) {
      const response = proxy(adminRequest(
        path,
        "portal_token=portal-token; issuer_token=issuer-token",
      ));

      expect(getRedirectUrl(response)).toBe("https://lexchain.test/portal/dashboard");
    }
  });

  it("redirects retired system reports to the unified reports page", () => {
    const response = proxy(adminRequest(
      "/portal/system-reports",
      "portal_token=portal-token; issuer_token=issuer-token",
    ));

    expect(getRedirectUrl(response)).toBe("https://lexchain.test/portal/reports");
  });

  it("defines the three issuer management portal route prefixes", () => {
    expect(ISSUER_MANAGEMENT_PATHS).toEqual([
      "/portal/users",
      "/portal/issuer-invitations",
      "/portal/audit-logs",
    ]);
  });

  it("uses cookie presence only as a coarse gate before page-level issuer authorization", () => {
    const response = proxy(adminRequest(
      "/portal/users",
      "portal_token=portal-token; issuer_token=issuer-token",
    ));

    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(getRedirectUrl(response)).toBeNull();
  });

  it("redirects a portal-only session away from management routes", () => {
    const response = proxy(adminRequest(
      "/portal/users",
      "portal_token=portal-token",
    ));

    expect(getRedirectUrl(response)).toBe("https://lexchain.test/portal/dashboard");
  });

  it("redirects retired system reports before checking stale admin authority", () => {
    const response = proxy(adminRequest(
      "/portal/system-reports",
      "admin_token=stale-admin-token; portal_token=portal-token",
    ));

    expect(getRedirectUrl(response)).toBe("https://lexchain.test/portal/reports");
  });

  it("redirects an issuer token without portal authentication to login", () => {
    const response = proxy(adminRequest("/portal/users", "issuer_token=issuer-token"));

    expect(getRedirectUrl(response)).toBe("https://lexchain.test/login");
  });

  it("redirects unauthenticated management requests to login", () => {
    const response = proxy(adminRequest("/portal/users"));

    expect(getRedirectUrl(response)).toBe("https://lexchain.test/login");
  });

  it("keeps ordinary portal routes available to portal sessions", () => {
    const response = proxy(adminRequest(
      "/portal/documents",
      "portal_token=participant-token",
    ));

    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(getRedirectUrl(response)).toBeNull();
  });

  it("redirects legacy admin pages before portal authorization", () => {
    const response = proxy(adminRequest("/admin/users"));

    expect(getRedirectUrl(response)).toBe("https://lexchain.test/portal/users");
  });

  it("does not use a forged role to bypass privileged portal guards", () => {
    const response = proxy(adminRequest(
      "/portal/users",
      "portal_token=lawyer-token; user_role=admin",
    ));

    expect(getRedirectUrl(response)).toBe("https://lexchain.test/portal/dashboard");
  });
});
