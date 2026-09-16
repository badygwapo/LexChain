import { describe, expect, it } from "vitest";
import { getDashboardMetrics, getPortalNavigation, getRecentActivityStatus, getStatusOverviewLabel } from "@/features/portal/portal-dashboard";

describe("portal dashboard", () => {
  it("gives issuers the enabled office workspace navigation", () => {
    const navigation = getPortalNavigation("lawyer");

    expect(navigation.map((group) => group.label)).toEqual([
      "Workspace",
      "Office",
      "System Management",
      "Account",
    ]);
    expect(navigation[0].items.map((item) => item.label)).toEqual(["Dashboard", "Documents"]);
    expect(navigation.flatMap((group) => group.items).map((item) => item.href)).not.toContain("/portal/notifications");
    expect(navigation.find((group) => group.label === "Office")?.items.map((item) => item.label)).toEqual([
      "Categories",
      "Reports",
    ]);
  });

  it("only shows participant routes that exist", () => {
    expect(getPortalNavigation("user").flatMap((group) => group.items).map((item) => item.label)).toEqual([
      "Shared Documents",
      "Invitations",
      "My E-copy Requests",
    ]);
  });

  it("gives every issuer the three system management destinations", () => {
    const navigation = getPortalNavigation("lawyer");

    expect(navigation.find((group) => group.label === "System Management")?.items.map(({ label, href }) => [label, href])).toEqual([
      ["User Accounts", "/portal/users"],
      ["Issuer Invitations", "/portal/issuer-invitations"],
      ["Audit Logs", "/portal/audit-logs"],
    ]);
  });

  it("summarizes an empty document repository without unsupported metrics", () => {
    expect(getDashboardMetrics([])).toEqual([
      ["Total Documents", 0],
      ["Processing", 0],
      ["Failed Documents", 0],
    ]);
  });

  it("summarizes processing, ready, failed, and recorded blockchain states", () => {
    expect(getDashboardMetrics([
      { status: "PROCESSING", on_chain: false },
      { status: "PENDING", on_chain: false },
      { status: "COMPLETED", on_chain: true },
      { status: "ANCHORED", on_chain: false },
      { status: "FAILED", on_chain: false },
    ])).toEqual([
      ["Total Documents", 5],
      ["Processing", 2],
      ["Failed Documents", 1],
      ["On-Chain Records", 1],
    ]);
  });

  it("does not show unavailable roadmap metrics as zero", () => {
    const labels = getDashboardMetrics([{ status: "FAILED" }]).map(([label]) => label);

    expect(labels).not.toContain("Pending Invites");
    expect(labels).not.toContain("Recent Access");
    expect(labels).not.toContain("Integrity Alerts");
  });

  it("uses the mobile completed vocabulary for anchored recent activity", () => {
    expect(getRecentActivityStatus("anchored")).toBe("Completed");
  });

  it("uses the mobile completed vocabulary in the status overview", () => {
    expect(getStatusOverviewLabel("anchored")).toBe("Completed");
  });
});
