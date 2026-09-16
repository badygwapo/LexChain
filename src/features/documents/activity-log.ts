const auditEventLabels: Record<string, string> = {
  document_created: 'Document created',
  document_uploaded: 'Document uploaded',
  document_anchored: 'Document anchored',
  document_finalized: 'Document finalized',
  document_restored: 'Document restored',
  document_verified: 'Document verified',
  document_viewed: 'Document viewed',
  verification_completed: 'Verification completed',
  access_granted: 'Access granted',
  access_revoked: 'Access revoked',
};

export function formatAuditEvent(action?: string | null): string {
  if (!action) return 'Unknown event';
  return auditEventLabels[action] ?? action;
}
