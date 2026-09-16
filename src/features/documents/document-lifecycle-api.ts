import type { ApiSchema } from '@/shared/types/index';
import type {
  DemoDocumentLifecycle,
  DemoDocumentSnapshot,
} from '@/features/documents/document-lifecycle-ui';

function required(value: string, message: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(message);
  return normalized;
}

async function lifecycleFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const proxy = init?.method ? '/api/portal/proxy-post' : '/api/portal/proxy';
  const response = await fetch(`${proxy}?path=${encodeURIComponent(path)}`, {
    credentials: 'same-origin',
    cache: 'no-store',
    ...init,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as { detail?: string; message?: string };
    throw new Error(error.detail ?? error.message ?? `API error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function finalizeDocument(documentId: string): Promise<ApiSchema<'RecordResponse'>> {
  const id = required(documentId, 'Document ID is required');
  return lifecycleFetch(`/documents/${id}/finalize`, { method: 'POST' });
}

type DocumentVersion = {
  document_id: string;
  version: number;
  file_name: string;
  status: string;
  lifecycle: string;
  is_latest: boolean;
  created_at: string;
};

export async function renameDocument(documentId: string, fileName: string) {
  return lifecycleFetch(`/documents/${required(documentId, 'Document ID is required')}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ file_name: required(fileName, 'Document name is required') }),
  });
}

export async function listDocumentVersions(documentId: string): Promise<{ versions: DocumentVersion[]; total_version: number }> {
  return lifecycleFetch(`/documents/${required(documentId, 'Document ID is required')}/versions`);
}

export async function createDocumentVersion(documentId: string, file: File) {
  const id = required(documentId, 'Document ID is required');
  if (file.type !== 'application/pdf') throw new Error('Choose a PDF file.');
  const data = new FormData();
  data.append('file', file);
  return lifecycleFetch(`/documents/${id}/update?file_name=${encodeURIComponent(file.name)}`, {
    method: 'POST',
    body: data,
  });
}

export async function listDemoSnapshots(documentId: string): Promise<DemoDocumentSnapshot[]> {
  const id = required(documentId, 'Document ID is required');
  return lifecycleFetch(`/documents/${id}/snapshots`);
}

export async function restoreDemoSnapshot(
  documentId: string,
  snapshotId: string,
  reason: string,
): Promise<DemoDocumentLifecycle> {
  const id = required(documentId, 'Document ID is required');
  const snapshot = required(snapshotId, 'Snapshot ID is required');
  const restorationReason = required(reason, 'Restoration reason is required');
  return lifecycleFetch(`/documents/${id}/snapshots/${snapshot}/restore`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ reason: restorationReason }),
  });
}
