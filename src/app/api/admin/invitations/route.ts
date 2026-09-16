import { adminFetch, getTokenFromRequest, missingApiUrl, missingToken } from "@/server/api/backend";
import { isMockDocumentIssuerToken } from "@/lib/mocks/portal";
import { z } from "zod";

const useMock = process.env.USE_MOCK_API === "true";
const invitationSchema = z.object({
  email: z.string().trim().min(1).email(),
  role: z.literal("lawyer").optional(),
});

export async function GET(request: Request) {
  const apiBase = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
  if (!apiBase) return missingApiUrl();

  const token = getTokenFromRequest(request);
  if (!token) return missingToken();

  let upstream: Response;
  try {
    upstream = await adminFetch("/admin/invitations", token);
  } catch {
    return Response.json({ message: "Unable to reach the API." }, { status: 502 });
  }

  const payload = await upstream.json().catch(() => null);
  return Response.json(payload, { status: upstream.status });
}

export async function POST(request: Request) {
  const token = getTokenFromRequest(request);
  if (!token) return missingToken();

  if (useMock && !isMockDocumentIssuerToken(token)) {
    return Response.json({ message: "Lawyer access required." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = invitationSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ message: "Enter a valid Lawyer email." }, { status: 400 });
  }
  const invitation = { email: parsed.data.email, role: "lawyer" as const };

  if (useMock) return Response.json({ message: "Mock invitation accepted." }, { status: 201 });

  const apiBase = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
  if (!apiBase) return missingApiUrl();

  let upstream: Response;
  try {
    upstream = await adminFetch("/admin/invitations", token, {
      method: "POST",
      body: JSON.stringify(invitation),
    });
  } catch {
    return Response.json({ message: "Unable to reach the API." }, { status: 502 });
  }

  const payload = await upstream.json().catch(() => null);
  return Response.json(payload, { status: upstream.status });
}
