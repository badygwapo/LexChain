import type { ApiSchema } from '@/shared/types/index';

type UploadAccepted = ApiSchema<'DocumentUploadAcceptedResponse'>;

export type UploadMetadata = { title: string; bookId: string };

export type UploadOutcome = {
  documentId: string;
  status: string;
  message: string;
};

export function getUploadFileError(file: File): string | null {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    ? null
    : 'Choose a PDF file.';
}

export function getRequiredUploadMetadataError({ title, bookId }: UploadMetadata): string | null {
  if (!title.trim()) return 'Enter a document title.';
  if (!bookId) return 'Choose a book.';
  return null;
}

export function getUploadOutcome(response: UploadAccepted): UploadOutcome {
  return {
    documentId: response.document_id,
    status: response.status,
    message: response.message,
  };
}

export async function uploadDocument({ file, title, bookId }: { file: File; title: string; bookId: string }): Promise<UploadAccepted> {
  const form = new FormData();
  form.append('file', file);
  const query = new URLSearchParams({ book_id: bookId, file_name: title });

  const res = await fetch(
    `/api/portal/proxy-post?path=${encodeURIComponent(`/documents/upload?${query.toString()}`)}`,
    { method: 'POST', body: form, credentials: 'same-origin' },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? err.message ?? 'Upload failed');
  }

  return res.json();
}
