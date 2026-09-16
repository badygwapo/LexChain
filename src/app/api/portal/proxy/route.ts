import { NextRequest, NextResponse } from 'next/server';
import { backendUrl } from '@/server/api/backend';
import { isMockPortalToken, mockPortalGet } from '@/lib/mocks/portal';
import { isMockMode } from '@/lib/mocks/mode';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('portal_token')?.value;
  if (!token) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });

  const path = request.nextUrl.searchParams.get('path');
  if (!path) return NextResponse.json({ message: 'Missing path' }, { status: 400 });

  if (isMockMode()) {
    if (!isMockPortalToken(token)) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    return mockPortalGet(path, token);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);

  try {
    const upstream = await fetch(backendUrl(path), {
      headers: {
        Authorization: `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true',
      },
      cache: 'no-store',
      signal: controller.signal,
    });

    const data = await upstream.json().catch(() => null);
    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    const message = error instanceof Error && error.name === 'AbortError'
      ? 'Backend request timed out'
      : 'Backend request failed';
    return NextResponse.json({ message, detail: error instanceof Error ? error.message : String(error) }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
