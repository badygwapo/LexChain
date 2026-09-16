import { afterEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from './route';

const originalApiUrl = process.env.API_URL;

afterEach(() => {
  vi.restoreAllMocks();
  if (originalApiUrl === undefined) delete process.env.API_URL;
  else process.env.API_URL = originalApiUrl;
});

it('rejects unauthenticated requests and forwards a Document Issuer party list request', async () => {
  const params = Promise.resolve({ id: 'document-123' });

  const unauthenticated = await GET(
    new NextRequest('http://localhost/api/portal/documents/document-123/parties'),
    { params },
  );

  expect(unauthenticated.status).toBe(401);
  await expect(unauthenticated.json()).resolves.toEqual({ message: 'Not authenticated' });

  const fetchMock = vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify({ role: 'document_issuer' }), { status: 200 }))
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ parties: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
  vi.stubGlobal('fetch', fetchMock);

  const authenticated = await GET(
    new NextRequest('http://localhost/api/portal/documents/document-123/parties', {
      headers: { cookie: 'portal_token=portal-token' },
    }),
    { params },
  );

  expect(fetchMock).toHaveBeenLastCalledWith('/documents/document-123/parties', {
    headers: {
      Authorization: 'Bearer portal-token',
      'ngrok-skip-browser-warning': 'true',
    },
    cache: 'no-store',
  });
  expect(authenticated.status).toBe(200);
  await expect(authenticated.json()).resolves.toEqual({ parties: [] });
});

it('does not proxy participant management when the authenticated profile is not an issuer', async () => {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ role: 'document_participant' }), { status: 200 }),
  );
  vi.stubGlobal('fetch', fetchMock);
  const params = Promise.resolve({ id: 'document-123' });

  const listResponse = await GET(
    new NextRequest('http://localhost/api/portal/documents/document-123/parties', {
      headers: { cookie: 'portal_token=portal-token' },
    }),
    { params },
  );
  const inviteResponse = await POST(
    new NextRequest('http://localhost/api/portal/documents/document-123/parties', {
      method: 'POST',
      headers: { cookie: 'portal_token=portal-token', 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'person@example.com', role: 'viewer' }),
    }),
    { params },
  );

  expect(listResponse.status).toBe(403);
  await expect(listResponse.json()).resolves.toEqual({ message: 'Participant management is available to Lawyers only.' });
  expect(inviteResponse.status).toBe(403);
  await expect(inviteResponse.json()).resolves.toEqual({ message: 'Participant management is available to Lawyers only.' });
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(fetchMock).toHaveBeenNthCalledWith(1, '/users/', expect.any(Object));
  expect(fetchMock).toHaveBeenNthCalledWith(2, '/users/', expect.any(Object));
});

it('rejects malformed participant invitations before forwarding them upstream', async () => {
  const fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  const params = Promise.resolve({ id: 'document-123' });

  for (const body of [
    { email: 'not-an-email', role: 'viewer' },
    { email: 'person@example.com', role: 'owner' },
  ]) {
    const response = await POST(
      new NextRequest('http://localhost/api/portal/documents/document-123/parties', {
        method: 'POST',
        headers: { cookie: 'portal_token=portal-token', 'content-type': 'application/json' },
        body: JSON.stringify(body),
      }),
      { params },
    );

    expect(response.status).toBe(400);
  }

  expect(fetchMock).not.toHaveBeenCalled();
});
