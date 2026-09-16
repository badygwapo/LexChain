import { afterEach, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';

const originalMockApi = process.env.NEXT_PUBLIC_USE_MOCK_API;

afterEach(() => {
  if (originalMockApi === undefined) delete process.env.NEXT_PUBLIC_USE_MOCK_API;
  else process.env.NEXT_PUBLIC_USE_MOCK_API = originalMockApi;
});

it('rejects an unknown mock portal token before returning mock profile data', async () => {
  process.env.NEXT_PUBLIC_USE_MOCK_API = 'true';
  const request = new NextRequest('http://localhost/api/portal/proxy?path=%2Fusers%2F', {
    headers: { cookie: 'portal_token=mock-token:unknown-user' },
  });

  const response = await GET(request);

  expect(response.status).toBe(401);
  await expect(response.json()).resolves.toEqual({ message: 'Not authenticated' });
});
