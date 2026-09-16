import { adminFetch } from "@/features/admin/server";
import { InvitationsManagementView } from "@/features/admin/invitations-permissions";
import { requireDocumentIssuerPage } from "@/features/access/server/issuer-page-access";
import { isMockMode } from "@/lib/mocks/mode";

const useMock = isMockMode();

type Invitation = {
  id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
  created_at: string;
  magic_link?: string | null;
};

type InvitationsData = { invitations: Invitation[] };

async function getInvitations(): Promise<InvitationsData> {
  if (useMock) {
    const { adminInvitations } = await import("@/features/admin/admin-demo-data");
    return {
      invitations: adminInvitations.map((invitation, index) => ({
        id: `demo-${index}`,
        email: invitation.participant_email,
        role: "lawyer",
        status: invitation.status,
        expires_at: invitation.sent_at,
        created_at: invitation.sent_at,
        magic_link: null,
      })),
    };
  }

  try {
    return await adminFetch<InvitationsData>("/admin/invitations");
  } catch {
    return { invitations: [] };
  }
}

export default async function PortalIssuerInvitationsPage() {
  await requireDocumentIssuerPage();
  const data = await getInvitations();

  return <InvitationsManagementView invitations={data.invitations} mockMode={useMock} />;
}
