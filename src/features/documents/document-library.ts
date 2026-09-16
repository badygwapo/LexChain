import type { PortalUiRole } from "@/features/access";

export type DocumentListItem = {
  id: string;
  document_id?: string;
  document_number?: number | string | null;
  file_name?: string | null;
  status?: string | null;
  on_chain?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
  storage_url?: string | null;
};

export type DocumentListFilters = {
  query: string;
  status: string;
  sort: 'newest' | 'oldest' | 'title';
  updatedFrom?: string;
  updatedThrough?: string;
};

function searchableReference(document: DocumentListItem) {
  return [document.document_number, document.document_id, document.id]
    .filter((value): value is string | number => value !== undefined && value !== null)
    .join(' ')
    .toLowerCase();
}

function documentDate(document: DocumentListItem) {
  return new Date(document.updated_at ?? document.created_at ?? 0).getTime();
}

export function getVisibleDocuments<T extends DocumentListItem>(documents: T[], filters: DocumentListFilters): T[] {
  const query = filters.query.trim().toLowerCase();

  return documents
    .filter((document) => !query || document.file_name?.toLowerCase().includes(query) || searchableReference(document).includes(query))
    .filter((document) => filters.status === 'all' || document.status?.trim().toLowerCase() === filters.status)
    .filter((document) => {
      if (!filters.updatedFrom && !filters.updatedThrough) return true;
      const date = new Date(documentDate(document));
      if (Number.isNaN(date.getTime()) || (!document.updated_at && !document.created_at)) return false;
      const day = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      return (!filters.updatedFrom || day >= filters.updatedFrom) && (!filters.updatedThrough || day <= filters.updatedThrough);
    })
    .sort((left, right) => {
      if (filters.sort === 'title') return (left.file_name ?? '').localeCompare(right.file_name ?? '');
      const difference = documentDate(left) - documentDate(right);
      return filters.sort === 'oldest' ? difference : -difference;
    });
}

export function getDocumentStatuses(documents: DocumentListItem[]) {
  return [...new Set(documents.map((document) => document.status?.trim().toLowerCase()).filter(Boolean))] as string[];
}

export function getDocumentListActions(role: PortalUiRole, document: DocumentListItem) {
  const actions = ['Open'];
  if (document.storage_url) actions.push('View / Download');
  const status = document.status?.trim().toUpperCase();
  if (role === 'lawyer' && (status === 'AWAITING_REVIEW' || status === 'READY_FOR_REVIEW')) actions.push('Review');
  if (role === 'lawyer' && document.on_chain) actions.push('Verify integrity');
  return actions;
}
