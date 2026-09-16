import { NextRequest, NextResponse } from 'next/server';
import { backendUrl } from '@/server/api/backend';
import { isMockPortalToken, mockPortalGet } from '@/lib/mocks/portal';
import { isMockMode } from '@/lib/mocks/mode';
import { getPortalUiRole } from "@/features/access";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const token = request.cookies.get('portal_token')?.value;
  if (!token) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });

  const mockMode = isMockMode();
  if (mockMode && !isMockPortalToken(token)) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const profile = mockMode
    ? mockPortalGet('/users/', token)
    : await fetch(backendUrl('/users/'), {
        headers: {
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
        cache: 'no-store',
      });
  const profileData = await profile.json().catch(() => null);
  if (getPortalUiRole(profileData?.role) !== 'lawyer') {
    return NextResponse.json(
      { message: 'Document activity is available to Lawyers only.' },
      { status: 403 },
    );
  }

  const { id } = await context.params;
  const upstream = mockMode
    ? mockPortalGet(`/documents/${id}/audit-logs`, token)
    : await fetch(backendUrl(`/documents/${id}/audit-logs`), {
        headers: {
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
        cache: 'no-store',
      });

  const data = await upstream.json().catch(() => null);
  return NextResponse.json(data, { status: upstream.status });
}
