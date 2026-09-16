import { NextRequest, NextResponse } from 'next/server';
import { backendUrl } from '@/server/api/backend';
import { isMockPortalToken, mockPortalMutate } from '@/lib/mocks/portal';
import { isMockMode } from '@/lib/mocks/mode';

async function handler(request: NextRequest, method: 'POST' | 'PATCH' | 'DELETE') {
  const token = request.cookies.get('portal_token')?.value;
  if (!token) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });

  const path = request.nextUrl.searchParams.get('path');
  if (!path) return NextResponse.json({ message: 'Missing path' }, { status: 400 });

  if (isMockMode()) {
    if (!isMockPortalToken(token)) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    return mockPortalMutate(method, path, request, token);
  }

  const contentType = request.headers.get('content-type') ?? '';
  let body: BodyInit | undefined;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'ngrok-skip-browser-warning': 'true',
  };

  if (contentType.includes('multipart/form-data')) {
    body = await request.blob();
    headers['content-type'] = contentType;
  } else {
    const text = await request.text().catch(() => '');
    if (text) {
      body = text;
      headers['content-type'] = 'application/json';
    }
  }

  const upstream = await fetch(backendUrl(path), {
    method,
    headers,
    body,
    cache: 'no-store',
  });

  if (upstream.status === 204) return new NextResponse(null, { status: 204 });

  const data = await upstream.json().catch(() => null);
  return NextResponse.json(data ?? {}, { status: upstream.status });
}

export const POST = (request: NextRequest) => handler(request, 'POST');
export const PATCH = (request: NextRequest) => handler(request, 'PATCH');
export const DELETE = (request: NextRequest) => handler(request, 'DELETE');
