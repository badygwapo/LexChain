import { NextResponse } from "next/server";

import { backendUrl } from "@/server/api/backend";

type ApiErrorPayload = {
  detail?: unknown;
  message?: unknown;
};

function getErrorMessage(payload: ApiErrorPayload | null, fallback: string) {
  if (typeof payload?.message === "string") {
    return payload.message;
  }

  if (typeof payload?.detail === "string") {
    return payload.detail;
  }

  if (Array.isArray(payload?.detail) && payload.detail.length > 0) {
    return "Enter a valid email address.";
  }

  return fallback;
}

export async function POST(request: Request) {
  const apiBase = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
  if (!apiBase) {
    return NextResponse.json({ message: "Missing API_URL." }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(backendUrl("/auth/resend-verification"), {
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

  const payload = (await upstream.json().catch(() => null)) as ApiErrorPayload | null;

  if (!upstream.ok) {
    return NextResponse.json(
      { message: getErrorMessage(payload, "Could not resend verification email.") },
      { status: upstream.status },
    );
  }

  return NextResponse.json(payload ?? { message: "Verification email sent." });
}
