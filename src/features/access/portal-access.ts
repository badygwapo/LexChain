import type { PortalUiRole } from "@/features/access/portal-role";

export type ProtectedPortalFeature = "upload" | "books" | "categories" | "reports" | "office-settings" | "invitations" | "my-requests";

export function canAccessPortalFeature(role: PortalUiRole, feature: ProtectedPortalFeature): boolean {
  if (feature === "upload" || feature === "books" || feature === "categories" || feature === "reports" || feature === "office-settings") return role === "lawyer";
  return role === "user";
}
