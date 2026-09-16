"use client";

import Image from "next/image";

import Link from "next/link";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { getPortalLoginRedirect } from "@/features/access";

async function signIn(data: { email: string; password: string }) {
  const res = await fetch("/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "same-origin",
  });
  const payload = await res.json().catch(() => null);
  if (!res.ok) throw new Error(payload?.message ?? "Login failed. Check your credentials.");
  return payload;
}

function decodeJwtRole(token?: string): string {
  if (!token) return "";
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return String(payload.role ?? payload.user_role ?? payload.user_metadata?.role ?? payload.app_metadata?.role ?? "");
  } catch { return ""; }
}

export function getRedirectPath(data: Record<string, unknown> | null): string {
  if (!data) return "/login";
  const user = (data.user as Record<string, unknown>) ?? data;
  const role = String(
    user.role ??
    (user.user_metadata as Record<string, unknown> | undefined)?.role ??
    (user.app_metadata as Record<string, unknown> | undefined)?.role ??
    user.user_role ??
    decodeJwtRole(data.access_token as string) ??
    ""
  ).toLowerCase();
  return getPortalLoginRedirect(role) ?? "/login";
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const mutation = useMutation({
    mutationFn: signIn,
    onSuccess: (data) => {
      toast.success("Signed in successfully");
      window.location.href = getRedirectPath(data);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.warning("Enter your email and password");
      return;
    }
    mutation.mutate({ email: email.trim(), password });
  }

  const error = mutation.error?.message || null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5FAFF] p-5 text-[#111827]">
      <section className="w-full max-w-[440px] rounded-[24px] border border-[#E4EEF9] bg-white p-7 shadow-[0_10px_24px_rgba(12,43,73,0.08)]">
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <Image src="/lexchain/logo-lexchain.svg" alt="LexChain" width={36} height={36} className="rounded-[10px]" />
            <span className="text-lg font-black text-[#0C2B49]">Lex<span className="text-[#0985E7]">Chain</span></span>
          </div>
          <h1 className="text-3xl font-black leading-9 text-[#0C2B49]">Sign in</h1>
          <p className="text-sm font-semibold leading-5 text-[#64748b]">
            For Document Issuers and invited participants. Sign in with your credentials.
          </p>
        </div>

        <form className="mt-6 space-y-3.5" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-[13px] font-black text-[#0C2B49]">Email</span>
            <input
              className="mt-2 min-h-12 w-full rounded-[14px] border border-[#E4EEF9] bg-[#F5FAFF] px-3.5 text-sm font-semibold text-[#0C2B49] outline-none focus:border-[#0985E7]"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-[13px] font-black text-[#0C2B49]">Password</span>
            <input
              className="mt-2 min-h-12 w-full rounded-[14px] border border-[#E4EEF9] bg-[#F5FAFF] px-3.5 text-sm font-semibold text-[#0C2B49] outline-none focus:border-[#0985E7]"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setRememberMe((v) => !v)}
              className={`flex items-center gap-2 rounded-full px-3.5 py-2 text-[11px] font-black uppercase tracking-wide transition ${rememberMe ? "bg-[#EAF4FF]/60 border border-[#D7EBFF] text-[#0C2B49]" : "text-[#64748b]"}`}
            >
              <span className={`inline-flex items-center justify-center w-4 h-4 rounded border-2 ${rememberMe ? "border-[#0985E7] bg-[#0985E7]" : "border-[#D7EBFF] bg-white"}`}>
                {rememberMe && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </span>
              Remember me
            </button>
            <Link href="/forgot-password" className="text-[12px] font-black text-[#0985E7]">
              Forgot password?
            </Link>
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={mutation.isPending}
            className="mt-2 flex min-h-[52px] w-full items-center justify-center rounded-full bg-[#0985E7] px-5 py-3.5 text-[15px] font-black text-white transition hover:bg-[#0770c4] disabled:opacity-60"
          >
            {mutation.isPending ? "Signing in…" : "Sign in"}
          </button>

          <Link
            href="/register"
            className="flex min-h-[52px] w-full items-center justify-center rounded-full border-2 border-[#E4EEF9] px-5 py-3.5 text-[15px] font-black text-[#0C2B49] transition hover:bg-[#F5FAFF]"
          >
            Create an account
          </Link>
        </form>

        <Link className="mt-5 block text-center text-[13px] font-black text-[#0985E7]" href="/">
          Return to LexChain
        </Link>
      </section>
    </main>
  );
}
