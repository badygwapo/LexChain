import type { PortalUiRole } from "@/features/access";

export function getDocumentStatusLabel(status?: string | null): string {
  const value = status?.trim().toUpperCase();
  if (value === 'QUEUED') return 'Queued';
  if (value === 'PROCESSING') return 'Processing';
  if (value === 'AWAITING_REVIEW' || value === 'READY_FOR_REVIEW') return 'Ready for review';
  if (value === 'ENRICHING') return 'Preparing document';
  if (value === 'COMPLETED') return 'Completed';
  if (value === 'ANCHORED') return 'Completed';
  if (value === 'FAILED') return 'Failed';
  return 'Unknown';
}

export function getDocumentActions(
  role: PortalUiRole,
  document: { status?: string | null; on_chain?: boolean | null },
): string[] {
  if (role !== 'lawyer') return ['View PDF'];
  const actions = ['View PDF'];
  const status = document.status?.trim().toUpperCase();
  if (status === 'AWAITING_REVIEW' || status === 'READY_FOR_REVIEW') actions.push('Review extracted text');
  if (document.on_chain) actions.push('Verify Integrity');
  return actions;
}
