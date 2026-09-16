import { afterEach, expect, it, vi } from 'vitest';
import { verifyRepositoryDocument } from '@/features/verification/integrity-api';

afterEach(() => {
  vi.restoreAllMocks();
});

it('gets a verification request through the same-origin portal route', async () => {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ document_id: 'document-123', data_hash: 'hash' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }),
  );
  vi.stubGlobal('fetch', fetchMock);

  await verifyRepositoryDocument('document-123');

  expect(fetchMock).toHaveBeenCalledWith('/api/portal/proxy?path=%2Fdocuments%2Fdocument-123%2Fverify', {
    method: 'GET',
    credentials: 'same-origin',
    cache: 'no-store',
  });
});

it('keeps failed verification requests available for the UI to map to unavailable', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 503 })));

  await expect(verifyRepositoryDocument('document-123')).rejects.toThrow('API error: 503');
});
