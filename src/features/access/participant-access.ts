import type { PortalUiRole } from "@/features/access/portal-role";

export const documentParticipantPermissions = ["viewer", "signer", "editor"] as const;

export type DocumentParticipantPermission = (typeof documentParticipantPermissions)[number];

export type ParticipantInvitation = {
  email: string;
  role: string;
};

export type ParticipantInvitationValidation =
  | { valid: true; value: { email: string; role: DocumentParticipantPermission } }
  | { valid: false; message: string };

export function canManageParticipants(role: PortalUiRole): boolean {
  return role === "lawyer";
}

export function validateParticipantInvitation(
  invitation: ParticipantInvitation,
): ParticipantInvitationValidation {
  const email = invitation.email.trim();
  if (!email) return { valid: false, message: "Enter a participant email address." };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { valid: false, message: "Enter a valid participant email address." };

  if (!documentParticipantPermissions.includes(invitation.role as DocumentParticipantPermission)) {
    return { valid: false, message: "Choose a supported document permission." };
  }

  return { valid: true, value: { email, role: invitation.role as DocumentParticipantPermission } };
}

export function isParticipantAccessCapabilityError(reason: unknown): boolean {
  return reason instanceof Error && /\b403\b|forbidden|not permitted|capability/i.test(reason.message);
}
