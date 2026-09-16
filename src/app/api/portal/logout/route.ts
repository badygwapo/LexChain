import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  for (const name of ["portal_token", "issuer_token", "admin_token", "user_role"]) {
    response.cookies.set({
      name,
      value: "",
      httpOnly: name !== "user_role",
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });
  }
  return response;
}
