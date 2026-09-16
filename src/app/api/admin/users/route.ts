import { adminFetch, getTokenFromRequest, missingApiUrl, missingToken } from "@/server/api/backend";

export async function GET(request: Request) {
  const apiBase = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
  if (!apiBase) return missingApiUrl();

  const token = getTokenFromRequest(request);
  if (!token) return missingToken();

  let upstream: Response;
  try {
    upstream = await adminFetch("/admin/users", token);
  } catch {
    return Response.json({ message: "Unable to reach the API." }, { status: 502 });
  }

  const payload = await upstream.json().catch(() => null);
  return Response.json(payload, { status: upstream.status });
}
