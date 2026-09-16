import { buildApiUrl, getApiBaseUrl } from "@/config/api";

const apiBase = getApiBaseUrl(process.env);

export function backendUrl(path: string) {
  return buildApiUrl(apiBase, path);
}

export async function adminFetch(path: string, token: string, init?: RequestInit) {
  return fetch(backendUrl(path), {
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "ngrok-skip-browser-warning": "true",
      ...init?.headers,
    },
  });
}

export function missingApiUrl() {
  return Response.json({ message: "Missing API_URL." }, { status: 500 });
}

export function missingToken() {
  return Response.json({ message: "Not authenticated." }, { status: 401 });
}

export function getTokenFromRequest(request: Request): string | null {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(/(?:^|;\s*)issuer_token=([^;]+)/);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}
