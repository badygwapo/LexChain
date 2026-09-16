import type { ApiSchema } from '@/shared/types/index';

export type ExtractionReview = ApiSchema<'ExtractionReviewResponse'>;

export class ExtractionApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'ExtractionApiError';
  }
}

async function portalRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const proxy = init?.method ? '/api/portal/proxy-post' : '/api/portal/proxy';
  const response = await fetch(`${proxy}?path=${encodeURIComponent(path)}`, {
    credentials: 'same-origin',
    cache: 'no-store',
    ...init,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null) as { detail?: string; message?: string } | null;
    throw new ExtractionApiError(error?.detail ?? error?.message ?? `API error: ${response.status}`, response.status);
  }

  return response.json() as Promise<T>;
}

export function getExtractionReview(id: string): Promise<ExtractionReview> {
  return portalRequest(`/documents/${id}/extraction`);
}

export function saveExtractionEdits(id: string, edits: ApiSchema<'BlockEdit'>[]): Promise<ExtractionReview> {
  return portalRequest(`/documents/${id}/extraction`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ edits }),
  });
}

export function analyzeExtraction(id: string): Promise<ExtractionReview> {
  return portalRequest(`/documents/${id}/extraction/analyze`, { method: 'POST' });
}

export function approveExtraction(id: string): Promise<ApiSchema<'ApproveExtractionResponse'>> {
  return portalRequest(`/documents/${id}/extraction/approve`, { method: 'POST' });
}
