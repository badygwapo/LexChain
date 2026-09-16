import type { PortalUiRole } from "@/features/access";
import { getDocumentStatusLabel } from "@/features/documents";

export type PortalDocument = {
  status?: string | null;
  on_chain?: boolean | null;
};

export type PortalNavigationItem = {
  label: string;
  href: string;
};

export type PortalNavigationGroup = {
  label: string;
  items: PortalNavigationItem[];
};

export type DashboardMetric = readonly [label: string, value: number];

export function getRecentActivityStatus(status?: string | null) {
  return getDocumentStatusLabel(status);
}

export function getStatusOverviewLabel(status?: string | null) {
  return getDocumentStatusLabel(status);
}

export function getPortalNavigation(role: PortalUiRole): PortalNavigationGroup[] {
  if (role === "lawyer") {
    const navigation: PortalNavigationGroup[] = [
      {
        label: "Workspace",
        items: [
          { label: "Dashboard", href: "/portal/dashboard" },
          { label: "Documents", href: "/portal/documents" },
        ],
      },
      {
        label: "Office",
        items: [
          { label: "Categories", href: "/portal/categories" },
          { label: "Reports", href: "/portal/reports" },
        ],
      },
      {
        label: "System Management",
        items: [
          { label: "User Accounts", href: "/portal/users" },
          { label: "Issuer Invitations", href: "/portal/issuer-invitations" },
          { label: "Audit Logs", href: "/portal/audit-logs" },
        ],
      },
      {
        label: "Account",
        items: [
          { label: "Office Settings", href: "/portal/office-settings" },
        ],
      },
    ];

    return navigation;
  }

  return [
    {
      label: "Workspace",
      items: [
        { label: "Shared Documents", href: "/portal/documents" },
        { label: "Invitations", href: "/portal/invitations" },
        { label: "My E-copy Requests", href: "/portal/requests/my" },
      ],
    },
  ];
}

export function getDashboardMetrics(documents: PortalDocument[]): DashboardMetric[] {
  const processing = documents.filter(
    (document) => {
      const status = document.status?.trim().toUpperCase();
      return status === "PROCESSING" || status === "PENDING";
    },
  ).length;
  const failed = documents.filter(
    (document) => document.status?.trim().toUpperCase() === "FAILED",
  ).length;
  const metrics: DashboardMetric[] = [
    ["Total Documents", documents.length],
    ["Processing", processing],
    ["Failed Documents", failed],
  ];

  if (documents.some((document) => typeof document.on_chain === "boolean")) {
    metrics.push(["On-Chain Records", documents.filter((document) => document.on_chain).length]);
  }

  return metrics;
}
