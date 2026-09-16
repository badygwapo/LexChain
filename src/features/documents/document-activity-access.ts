import { getPortalUiRole } from "@/features/access";

export function canLoadDocumentActivity(role?: string): boolean {
  return getPortalUiRole(role) === 'lawyer';
}
