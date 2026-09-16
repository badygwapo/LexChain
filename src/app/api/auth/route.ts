import { NextResponse } from "next/server";
import { backendUrl } from "@/server/api/backend";

const useMock = process.env.NEXT_PUBLIC_USE_MOCK_API === "true" || process.env.USE_MOCK_API === "true";
const mockPassword = "Password123";
const mockAccounts = [
  { id: "mock-document-issuer", email: "issuer@example.com", role: "document_issuer", name: "Document Issuer" },
  { id: "mock-document-participant", email: "participant@example.com", role: "document_participant", name: "Document Participant" },
] as const;

function isIssuerRole(role?: unknown) {
  return typeof role === "string" && ["document_issuer", "lawyer", "admin", "super_admin"].includes(role.trim().toLowerCase());
}

function createSessionResponse(token: string, maxAge: number, user: { role?: string; email?: string; name?: string; id?: string }) {
  const response = NextResponse.json({ ok: true, user });

  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge,
    path: "/",
  };

  const issuer = isIssuerRole(user.role);
  response.cookies.set({
    name: "issuer_token",
    value: issuer ? token : "",
    ...cookieOpts,
    maxAge: issuer ? maxAge : 0,
  });
  response.cookies.set({ name: "portal_token", value: token, ...cookieOpts });
  response.cookies.set({ name: "admin_token", value: "", ...cookieOpts, maxAge: 0 });
  // Client-readable routing hint only; authorization uses server-only cookies.
  response.cookies.set({ name: "user_role", value: user.role ?? "", httpOnly: false, secure: cookieOpts.secure, sameSite: cookieOpts.sameSite, maxAge, path: "/" });

  return response;
}

export async function POST(request: Request) {
  const apiBase = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
  if (!apiBase && !useMock) {
    return NextResponse.json({ message: "Missing API_URL." }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  // Mock mode
  if (useMock) {
    const credentials = body as { email?: unknown; password?: unknown };
    const email = typeof credentials.email === "string" ? credentials.email.toLowerCase() : "";
    const password = typeof credentials.password === "string" ? credentials.password : "";
    const account = mockAccounts.find((a) => a.email === email);

    if (!account || password !== mockPassword) {
      return NextResponse.json({ message: "Invalid credentials." }, { status: 401 });
    }

    return createSessionResponse(`mock-token:${account.id}`, 60 * 60 * 24, account);
  }

  // Real backend
  let upstream: Response;
  try {
    upstream = await fetch(backendUrl("/auth/signin"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify(body),
    });
  } catch {
    return NextResponse.json({ message: "Unable to reach the API." }, { status: 502 });
  }

  const payload = await upstream.json().catch(() => null);

  if (!upstream.ok) {
    return NextResponse.json(
      { message: payload?.detail ?? payload?.message ?? "Login failed." },
      { status: upstream.status },
    );
  }

  const token: string | undefined = payload?.access_token ?? payload?.token;
  if (!token) {
    return NextResponse.json(
      { message: "Login succeeded, but no token was returned." },
      { status: 502 },
    );
  }

  const maxAge = payload?.expires_in ?? 60 * 60 * 24;
  const rawUser = payload?.user ?? {};

  // The authenticated sign-in response is the primary role source. Retain the
  // profile lookup only for older backends that do not return a role there.
  let appRole = typeof rawUser.role === "string" ? rawUser.role : "";
  if (!appRole) {
    try {
      const meRes = await fetch(backendUrl("/users/"), {
        headers: {
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
        cache: "no-store",
      });
      if (meRes.ok) {
        const me = await meRes.json();
        appRole = me?.role ?? "";
      }
    } catch { /* ignore */ }
  }

  const name = rawUser.user_metadata?.full_name
    ?? rawUser.user_metadata?.name
    ?? (`${rawUser.user_metadata?.f_name ?? ""} ${rawUser.user_metadata?.l_name ?? ""}`.trim() || rawUser.email);

  const user = {
    id: rawUser.id ?? rawUser.sub,
    email: rawUser.email,
    name,
    role: appRole,
  };

  return createSessionResponse(token, maxAge, user);
}
