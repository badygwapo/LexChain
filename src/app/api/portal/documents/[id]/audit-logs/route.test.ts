import { afterEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { mockPortalMutate } from '@/lib/mocks/portal';
import { GET } from './route';

const originalApiUrl = process.env.API_URL;
const originalMockApi = process.env.NEXT_PUBLIC_USE_MOCK_API;

afterEach(() => {
  vi.restoreAllMocks();
  if (originalApiUrl === undefined) delete process.env.API_URL;
  else process.env.API_URL = originalApiUrl;
  if (originalMockApi === undefined) delete process.env.NEXT_PUBLIC_USE_MOCK_API;
  else process.env.NEXT_PUBLIC_USE_MOCK_API = originalMockApi;
});

it('does not proxy audit logs when the authenticated profile is not an issuer', async () => {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ role: 'document_participant' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }),
  );
  vi.stubGlobal('fetch', fetchMock);

  const response = await GET(
    new NextRequest('http://localhost/api/portal/documents/document-123/audit-logs', {
      headers: { cookie: 'portal_token=portal-token' },
    }),
    { params: Promise.resolve({ id: 'document-123' }) },
  );

  expect(response.status).toBe(403);
  await expect(response.json()).resolves.toEqual({ message: 'Document activity is available to Lawyers only.' });
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(fetchMock).toHaveBeenCalledWith('/users/', {
    headers: {
      Authorization: 'Bearer portal-token',
      'ngrok-skip-browser-warning': 'true',
    },
    cache: 'no-store',
  });
});

it('proxies audit logs after the authenticated profile confirms a Document Issuer issuer', async () => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify({ role: 'document_issuer' }), { status: 200 }))
    .mockResolvedValueOnce(new Response(JSON.stringify([{ id: 'audit-1' }]), { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);

  const response = await GET(
    new NextRequest('http://localhost/api/portal/documents/document-123/audit-logs', {
      headers: { cookie: 'portal_token=portal-token' },
    }),
    { params: Promise.resolve({ id: 'document-123' }) },
  );

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual([{ id: 'audit-1' }]);
  expect(fetchMock).toHaveBeenLastCalledWith('/documents/document-123/audit-logs', {
    headers: {
      Authorization: 'Bearer portal-token',
      'ngrok-skip-browser-warning': 'true',
    },
    cache: 'no-store',
  });
});

it('returns the current document lifecycle history for a mock issuer without calling the backend', async () => {
  process.env.NEXT_PUBLIC_USE_MOCK_API = 'true';
  const approval = await mockPortalMutate(
    'POST',
    '/documents/mock-document-2/extraction/approve',
    new Request('http://localhost/documents/mock-document-2/extraction/approve', { method: 'POST' }),
    'mock-token:mock-document-issuer',
  );
  expect(approval.status).toBe(200);
  const finalization = await mockPortalMutate(
    'POST',
    '/documents/mock-document-2/finalize',
    new Request('http://localhost/documents/mock-document-2/finalize', { method: 'POST' }),
    'mock-token:mock-document-issuer',
  );
  expect(finalization.status).toBe(200);
  const fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);

  const response = await GET(
    new NextRequest('http://localhost/api/portal/documents/mock-document-2/audit-logs', {
      headers: { cookie: 'portal_token=mock-token:mock-document-issuer' },
    }),
    { params: Promise.resolve({ id: 'mock-document-2' }) },
  );

  expect(response.status).toBe(200);
  const auditLogs = await response.json() as Array<{ action: string; document_id: string }>;
  expect(auditLogs).toEqual(expect.arrayContaining([
    expect.objectContaining({ action: 'document_created', document_id: 'mock-document-2' }),
    expect.objectContaining({ action: 'document_finalized', document_id: 'mock-document-2' }),
  ]));
  expect(auditLogs.every((entry) => entry.document_id === 'mock-document-2')).toBe(true);
  expect(fetchMock).not.toHaveBeenCalled();
});

it('keeps mock document activity restricted to Document Issuers', async () => {
  process.env.NEXT_PUBLIC_USE_MOCK_API = 'true';
  const fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);

  const response = await GET(
    new NextRequest('http://localhost/api/portal/documents/mock-document-4/audit-logs', {
      headers: { cookie: 'portal_token=mock-token:mock-document-participant' },
    }),
    { params: Promise.resolve({ id: 'mock-document-4' }) },
  );

  expect(response.status).toBe(403);
  await expect(response.json()).resolves.toEqual({ message: 'Document activity is available to Lawyers only.' });
  expect(fetchMock).not.toHaveBeenCalled();
});
