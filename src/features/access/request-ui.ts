import type { PortalUiRole } from "@/features/access/portal-role";

export function getRequestActions(role: PortalUiRole, status?: string): string[] {
  return role === "lawyer" && status?.trim().toLowerCase() === "pending"
    ? ["Approve", "Reject"]
    : [];
}

export function getRequestActionError(action: "approve" | "reject"): string {
  return action === "approve"
    ? "Unable to approve this request. Please try again."
    : "Unable to reject this request. Please try again.";
}

export function getRequestStatusLabel(status: string): string {
  return status
    .trim()
    .toLowerCase()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`)
    .join(" ");
}

export function getRequestStatusClassName(status: string): string {
  switch (status.trim().toLowerCase()) {
    case "approved":
      return "bg-[#EAF8F0] text-[#12A150]";
    case "rejected":
      return "bg-red-50 text-red-700";
    default:
      return "bg-[#FFF4DD] text-[#B77900]";
  }
}
