import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ApiSchema } from '@/shared/types/index';
import {
  analyzeExtraction,
  approveExtraction,
  getExtractionReview,
  saveExtractionEdits,
} from '@/features/documents/extraction-api';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('extraction review client', () => {
  it('gets an extraction review through the same-origin read proxy', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ document_id: 'doc-1' }));
    vi.stubGlobal('fetch', fetchMock);

    await getExtractionReview('doc-1');

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/portal/proxy?path=%2Fdocuments%2Fdoc-1%2Fextraction',
      expect.objectContaining({ credentials: 'same-origin' }),
    );
  });

  it('saves block edits through the existing same-origin mutation proxy', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ document_id: 'doc-1' }));
    vi.stubGlobal('fetch', fetchMock);

    await saveExtractionEdits('doc-1', [{ index: 2, text: 'Corrected' }]);

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/portal/proxy-post?path=%2Fdocuments%2Fdoc-1%2Fextraction',
      expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ edits: [{ index: 2, text: 'Corrected' }] }) }),
    );
  });

  it('analyzes an extraction through the mutation proxy', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ document_id: 'doc-1' }));
    vi.stubGlobal('fetch', fetchMock);

    await analyzeExtraction('doc-1');

    expect(fetchMock).toHaveBeenCalledWith(
      `/api/portal/proxy-post?path=${encodeURIComponent('/documents/doc-1/extraction/analyze')}`,
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('returns the generated approval response contract through the mutation proxy', async () => {
    const approval: ApiSchema<'ApproveExtractionResponse'> = {
      document_id: 'doc-1',
      status: 'approved',
      edited_block_count: 1,
      content_hash: 'a'.repeat(64),
      message: 'Extraction review approved.',
    };
    const fetchMock = vi.fn().mockResolvedValue(Response.json(approval));
    vi.stubGlobal('fetch', fetchMock);

    const result: ApiSchema<'ApproveExtractionResponse'> = await approveExtraction('doc-1');

    expect(result).toEqual(approval);
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/portal/proxy-post?path=${encodeURIComponent('/documents/doc-1/extraction/approve')}`,
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('preserves the proxy API error detail', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ detail: 'Extraction is not ready' }, { status: 409 })));

    await expect(getExtractionReview('doc-1')).rejects.toThrow('Extraction is not ready');
  });

  it('preserves the response status on extraction API errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      Response.json({ message: 'Review state changed' }, { status: 409 }),
    ));

    await expect(getExtractionReview('doc-1')).rejects.toMatchObject({
      message: 'Review state changed',
      status: 409,
    });
  });

  it('falls back to the HTTP status when the proxy returns null error JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(null, { status: 502 })));

    await expect(getExtractionReview('doc-1')).rejects.toThrow('API error: 502');
  });
});
