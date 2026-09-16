import { expect, it } from 'vitest';
import { mockPortalGet, mockPortalMutate } from '@/lib/mocks/portal';
import { GET } from './route';

type RouteContext = { params: Promise<{ fileName: string }> };

function contextFor(storageUrl: string): RouteContext {
  return {
    params: Promise.resolve({
      fileName: decodeURIComponent(storageUrl.slice('/mock-documents/'.length)),
    }),
  };
}

function uploadMockDocument(fileName: string) {
  const form = new FormData();
  form.append('file', new File(['PDF'], 'original.pdf', { type: 'application/pdf' }));
  return mockPortalMutate(
    'POST',
    `/documents/upload?book_id=mock-book-1&file_name=${encodeURIComponent(fileName)}`,
    new Request('http://localhost/api/portal/proxy-post', { method: 'POST', body: form }),
    'mock-token:mock-document-issuer',
  );
}

it('serves a seeded mock extraction source as a renderable one-page PDF', async () => {
  const extractionResponse = mockPortalGet(
    '/documents/mock-document-2/extraction',
    'mock-token:mock-document-issuer',
  );
  const extraction = await extractionResponse.json() as { storage_url: string };

  const response = await GET(
    new Request(`http://localhost${extraction.storage_url}`),
    contextFor(extraction.storage_url),
  );

  expect(response.status).toBe(200);
  expect(response.headers.get('content-type')).toBe('application/pdf');
  expect(response.headers.get('content-disposition')).toBe(
    'inline; filename="lexchain-mock-document.pdf"',
  );

  const source = new Uint8Array(await response.arrayBuffer());
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const loadingTask = pdfjs.getDocument({ data: source });
  const document = await loadingTask.promise;

  expect(document.numPages).toBe(1);
  await loadingTask.destroy();
}, 10_000);

it('keeps an extensionless mock upload title behind a PDF storage URL', async () => {
  const upload = await uploadMockDocument('Deed of Sale');
  const { document_id: documentId } = await upload.json() as { document_id: string };
  const detail = await mockPortalGet(
    `/documents/${documentId}`,
    'mock-token:mock-document-issuer',
  ).json() as { storage_url: string };

  expect(detail.storage_url).toMatch(/^\/mock-documents\/.*\.pdf$/i);
  const response = await GET(
    new Request(`http://localhost${detail.storage_url}`),
    contextFor(detail.storage_url),
  );
  expect(response.status).toBe(200);
});

it('serves an extensionless upload title at the 255-character PDF boundary', async () => {
  const title = 'c'.repeat(251);
  const upload = await uploadMockDocument(title);
  expect(upload.status).toBe(201);
  const { document_id: documentId } = await upload.json() as { document_id: string };
  const detail = await mockPortalGet(
    `/documents/${documentId}`,
    'mock-token:mock-document-issuer',
  ).json() as { storage_url: string };

  expect(detail.storage_url).toBe(`/mock-documents/${title}.pdf`);
  const response = await GET(
    new Request(`http://localhost${detail.storage_url}`),
    contextFor(detail.storage_url),
  );
  expect(response.status).toBe(200);
});

it('rejects mock upload titles that cannot form one safe PDF path segment', async () => {
  const response = await uploadMockDocument('bad/name');

  expect(response.status).toBe(400);
});

it('rejects an overlong upload title before it can create an unreachable storage URL', async () => {
  const before = await mockPortalGet(
    '/documents/',
    'mock-token:mock-document-issuer',
  ).json() as Array<{ storage_url: string }>;
  const response = await uploadMockDocument('a'.repeat(252));
  const after = await mockPortalGet(
    '/documents/',
    'mock-token:mock-document-issuer',
  ).json() as Array<{ storage_url: string }>;

  expect(response.status).toBe(400);
  expect(after).toHaveLength(before.length);
});

it('keeps an extensionless mock version title behind a PDF storage URL', async () => {
  const upload = await uploadMockDocument('Draft record.pdf');
  const { document_id: documentId } = await upload.json() as { document_id: string };
  const form = new FormData();
  form.append('file', new File(['PDF'], 'updated.pdf', { type: 'application/pdf' }));
  const update = await mockPortalMutate(
    'POST',
    `/documents/${documentId}/update?file_name=Updated%20record`,
    new Request('http://localhost/api/portal/proxy-post', { method: 'POST', body: form }),
    'mock-token:mock-document-issuer',
  );
  const { document_id: versionId } = await update.json() as { document_id: string };
  const detail = await mockPortalGet(
    `/documents/${versionId}`,
    'mock-token:mock-document-issuer',
  ).json() as { storage_url: string };

  expect(detail.storage_url).toMatch(/^\/mock-documents\/.*\.pdf$/i);
  const response = await GET(
    new Request(`http://localhost${detail.storage_url}`),
    contextFor(detail.storage_url),
  );
  expect(response.status).toBe(200);
});

it('rejects an overlong version title without appending an unreachable version', async () => {
  const upload = await uploadMockDocument('Version boundary.pdf');
  const { document_id: documentId } = await upload.json() as { document_id: string };
  const form = new FormData();
  form.append('file', new File(['PDF'], 'updated.pdf', { type: 'application/pdf' }));
  const response = await mockPortalMutate(
    'POST',
    `/documents/${documentId}/update?file_name=${encodeURIComponent('b'.repeat(252))}`,
    new Request('http://localhost/api/portal/proxy-post', { method: 'POST', body: form }),
    'mock-token:mock-document-issuer',
  );
  const history = await mockPortalGet(
    `/documents/${documentId}/versions`,
    'mock-token:mock-document-issuer',
  ).json() as { total_version: number };

  expect(response.status).toBe(400);
  expect(history.total_version).toBe(1);
});

it.each([
  ['non-PDF', 'notes.txt'],
  ['path separator', '../secret.pdf'],
  ['control character', 'unsafe\nname.pdf'],
  ['surrounding whitespace', ' report.pdf'],
  ['overlong value', `${'a'.repeat(252)}.pdf`],
])('rejects a %s mock document name without reflecting it into headers', async (_case, fileName) => {
  const response = await GET(
    new Request('http://localhost/mock-documents/invalid'),
    { params: Promise.resolve({ fileName }) },
  );

  expect(response.status).toBe(404);
  expect(response.headers.get('content-disposition')).toBeNull();
});
