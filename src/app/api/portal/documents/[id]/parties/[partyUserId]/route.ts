import { NextRequest, NextResponse } from 'next/server';
import { backendUrl } from '@/server/api/backend';
import { getPortalUiRole } from "@/features/access";

type RouteContext = { params: Promise<{ id: string; partyUserId: string }> };

export async function DELETE(request: NextRequest, context: RouteContext) {
  const token = request.cookies.get('portal_token')?.value;
  if (!token) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });

  const profile = await fetch(backendUrl('/users/'), {
    headers: {
      Authorization: `Bearer ${token}`,
      'ngrok-skip-browser-warning': 'true',
    },
    cache: 'no-store',
  });
  const profileData = await profile.json().catch(() => null);
  if (getPortalUiRole(profileData?.role) !== 'lawyer') {
    return NextResponse.json(
      { message: 'Participant management is available to Lawyers only.' },
      { status: 403 },
    );
  }

  const { id, partyUserId } = await context.params;
  const upstream = await fetch(backendUrl(`/documents/${id}/parties/${partyUserId}`), {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'ngrok-skip-browser-warning': 'true',
    },
    cache: 'no-store',
  });

  const data = await upstream.json().catch(() => null);
  return NextResponse.json(data, { status: upstream.status });
}
