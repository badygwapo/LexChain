import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getRequiredUploadMetadataError,
  getUploadFileError,
  getUploadOutcome,
  uploadDocument,
} from '@/features/documents/portal-upload';

describe('portal document upload', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('sends the selected book and title through the same-origin proxy', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ document_id: 'doc-1', status: 'QUEUED', message: 'Accepted' }), { status: 202 }));
    vi.stubGlobal('fetch', fetchMock);
    const file = new File(['PDF'], 'original.pdf', { type: 'application/pdf' });

    await uploadDocument({ file, title: 'Deed of Sale', bookId: 'book-1' });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/portal/proxy-post?path=%2Fdocuments%2Fupload%3Fbook_id%3Dbook-1%26file_name%3DDeed%2Bof%2BSale');
    expect(options).toMatchObject({ method: 'POST', credentials: 'same-origin' });
    expect((options.body as FormData).get('file')).toBe(file);
  });

  it('rejects a non-PDF before it can be submitted', () => {
    expect(getUploadFileError(new File(['text'], 'notes.txt', { type: 'text/plain' }))).toBe('Choose a PDF file.');
    expect(getUploadFileError(new File(['PDF'], 'record.pdf', { type: 'application/pdf' }))).toBeNull();
  });

  it('requires only the supported title and book metadata', () => {
    expect(getRequiredUploadMetadataError({ title: '  ', bookId: '' })).toBe('Enter a document title.');
    expect(getRequiredUploadMetadataError({ title: 'Deed of Sale', bookId: '' })).toBe('Choose a book.');
    expect(getRequiredUploadMetadataError({ title: 'Deed of Sale', bookId: 'book-1' })).toBeNull();
  });

  it('preserves an accepted queued result for the confirmation step', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      document_id: 'doc-queued',
      status: 'QUEUED',
      message: 'Your document is queued for processing.',
    }), { status: 202 }));
    vi.stubGlobal('fetch', fetchMock);

    const accepted = await uploadDocument({ file: new File(['PDF'], 'record.pdf', { type: 'application/pdf' }), title: 'Deed of Sale', bookId: 'book-1' });

    expect(getUploadOutcome(accepted)).toEqual({
      documentId: 'doc-queued',
      status: 'QUEUED',
      message: 'Your document is queued for processing.',
    });
  });

  it('returns the proxy API failure for inline display', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ detail: 'The PDF is too large.' }), { status: 400 })));

    await expect(uploadDocument({ file: new File(['PDF'], 'record.pdf', { type: 'application/pdf' }), title: 'Deed of Sale', bookId: 'book-1' })).rejects.toThrow('The PDF is too large.');
  });
});
