import { adminFetch, getTokenFromRequest, missingApiUrl, missingToken } from "@/server/api/backend";
import { isMockDocumentIssuerToken } from "@/lib/mocks/portal";

const useMock = process.env.USE_MOCK_API === "true";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(request: Request, { params }: RouteContext) {
  const token = getTokenFromRequest(request);
  if (!token) return missingToken();

  const { id } = await params;

  if (useMock) {
    if (!isMockDocumentIssuerToken(token)) {
      return Response.json({ message: "Lawyer access required." }, { status: 403 });
    }
    return Response.json({ message: "Mock invitation revoked.", id });
  }

  const apiBase = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
  if (!apiBase) return missingApiUrl();

  let upstream: Response;
  try {
    upstream = await adminFetch(`/admin/invitations/${encodeURIComponent(id)}`, token, {
      method: "DELETE",
    });
  } catch {
    return Response.json({ message: "Unable to reach the API." }, { status: 502 });
  }

  if (upstream.status === 204) {
    return new Response(null, { status: 204 });
  }

  const payload = await upstream.json().catch(() => null);
  return Response.json(payload, { status: upstream.status });
}
