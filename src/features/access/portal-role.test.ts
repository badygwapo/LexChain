import { describe, expect, it } from "vitest";
import { getPortalLoginRedirect, getPortalProfileRequestShortcut, getPortalRoleLabel, getPortalUiRole, isSupportedPortalUiRole } from "@/features/access/portal-role";

describe("portal UI roles", () => {
  it("maps the canonical Document Issuer role", () => {
    expect(getPortalUiRole("document_issuer")).toBe("lawyer");
    expect(getPortalRoleLabel("document_issuer")).toBe("Lawyer");
  });

  it("maps the canonical Document Participant role", () => {
    expect(getPortalUiRole("document_participant")).toBe("user");
    expect(getPortalRoleLabel("document_participant")).toBe("User");
  });

  it("maps backend account roles to the corresponding portal roles", () => {
    for (const issuerRole of ["lawyer", "admin", "super_admin"]) {
      expect(getPortalUiRole(issuerRole)).toBe("lawyer");
      expect(getPortalRoleLabel(issuerRole)).toBe("Lawyer");
    }
    expect(getPortalUiRole("user")).toBe("user");
    expect(getPortalRoleLabel("user")).toBe("User");
  });

  it("routes each canonical actor to a useful portal destination", () => {
    expect(getPortalLoginRedirect("document_issuer")).toBe("/portal/dashboard");
    expect(getPortalLoginRedirect("lawyer")).toBe("/portal/dashboard");
    expect(getPortalLoginRedirect("document_participant")).toBe("/portal/documents");
    expect(getPortalLoginRedirect("user")).toBe("/portal/documents");
    expect(getPortalLoginRedirect("staff")).toBeUndefined();
  });

  it("keeps unrecognized roles out of restricted UI", () => {
    const uiRole = getPortalUiRole("staff");

    expect(uiRole).toBe("unsupported");
    expect(isSupportedPortalUiRole(uiRole)).toBe(false);
    expect(getPortalProfileRequestShortcut(uiRole)).toBeUndefined();
  });

  it("maps profile shortcuts only for supported portal roles", () => {
    expect(getPortalProfileRequestShortcut("lawyer")).toEqual({
      label: "Document Requests",
      href: "/portal/requests",
    });
    expect(getPortalProfileRequestShortcut("user")).toEqual({
      label: "My E-copy Requests",
      href: "/portal/requests/my",
    });
  });
});
