import type { components } from '@/shared/types/index';
import type { PortalAuditLog } from '@/features/access/portal-compat-types';

type DocumentPartyList = components['schemas']['DocumentPartyListResponse'];
type AddPartyRequest = components['schemas']['AddPartyRequest'];
type DocumentParty = components['schemas']['DocumentPartyResponse'];
type RemovePartyResponse = components['schemas']['RemovePartyResponse'];

async function portalAccessFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    credentials: 'same-origin',
    cache: 'no-store',
    ...init,
  });

  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json() as Promise<T>;
}

export function listDocumentParties(documentId: string) {
  return portalAccessFetch<DocumentPartyList>(`/api/portal/documents/${documentId}/parties`);
}

export function inviteDocumentParty(documentId: string, invitation: AddPartyRequest) {
  return portalAccessFetch<DocumentParty>(`/api/portal/documents/${documentId}/parties`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(invitation),
  });
}

export function revokeDocumentParty(documentId: string, partyUserId: string) {
  return portalAccessFetch<RemovePartyResponse>(`/api/portal/documents/${documentId}/parties/${partyUserId}`, {
    method: 'DELETE',
  });
}

export function listDocumentAuditLogs(documentId: string) {
  return portalAccessFetch<PortalAuditLog[]>(`/api/portal/documents/${documentId}/audit-logs`);
}
