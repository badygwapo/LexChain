// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PortalBottomNav } from "@/features/portal/components/portal-bottom-nav";

afterEach(cleanup);

const systemManagementTools = [
  "User Accounts",
  "Issuer Invitations",
  "Audit Logs",
];

describe("PortalBottomNav", () => {
  it("exposes the three distinct system management tools for every issuer", () => {
    render(<PortalBottomNav pathname="/portal/dashboard" role="lawyer" />);

    for (const label of systemManagementTools) {
      expect(screen.getByRole("link", { name: label })).toBeTruthy();
    }

    expect(screen.getByRole("navigation", { name: "Mobile portal navigation" }).className)
      .toContain("overflow-x-auto");
    expect(screen.getByRole("link", { name: "User Accounts" }).className)
      .toContain("shrink-0");
    expect(screen.getByText("Issuer Invitations")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Processing Monitor" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Blockchain Records" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Analytics" })).toBeNull();
    expect(screen.queryByRole("link", { name: "System Statistics" })).toBeNull();
    expect(screen.queryByRole("link", { name: "System Reports" })).toBeNull();
  });

  it("exposes visible participant navigation labels on mobile", () => {
    render(<PortalBottomNav pathname="/portal/documents" role="user" />);

    for (const label of ["Shared Documents", "Invitations", "My E-copy Requests"]) {
      expect(screen.getByRole("link", { name: label })).toBeTruthy();
      expect(screen.getByText(label)).toBeTruthy();
    }
  });
});
