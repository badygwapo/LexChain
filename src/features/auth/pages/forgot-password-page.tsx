"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { demoResetToken, type DemoForgotPasswordResult } from "@/features/auth/schemas/auth";

const resetMessage = "If an account exists for that email, a reset link has been sent." as const;
const unavailableMessage = "Password recovery is not connected yet. The backend password-recovery endpoints are required before this can send a real email.";
const demoSubmitDelayMs = 150;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DemoForgotPasswordResult | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim();

    if (!/\S+@\S+\.\S+/.test(normalizedEmail)) {
      setError("Enter a valid email address");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, demoSubmitDelayMs));
    setIsSubmitting(false);

    if (process.env.NEXT_PUBLIC_USE_MOCK_API === "true") {
      setResult({
        message: resetMessage,
        demoResetHref: `/reset-password?token=${demoResetToken}`,
      });
      return;
    }

    setError(unavailableMessage);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5FAFF] p-5 text-[#111827]">
      <section className="w-full max-w-[440px] rounded-[24px] border border-[#E4EEF9] bg-white p-7 shadow-[0_10px_24px_rgba(12,43,73,0.08)]">
        <div className="space-y-2">
          <div className="mb-1 flex items-center gap-2">
            <Image src="/lexchain/logo-lexchain.svg" alt="LexChain" width={36} height={36} className="rounded-[10px]" />
            <span className="text-lg font-black text-[#0C2B49]">Lex<span className="text-[#0985E7]">Chain</span></span>
          </div>
          <h1 className="text-3xl font-black leading-9 text-[#0C2B49]">Forgot password?</h1>
          <p className="text-sm font-semibold leading-5 text-[#64748b]">Enter account email and we will send reset instructions.</p>
        </div>

        {result ? (
          <div className="mt-6 space-y-3.5">
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3">
              <p className="text-sm font-black text-[#0C2B49]">{result.message}</p>
              <p className="mt-1 text-xs font-semibold text-[#64748b]">Demo mode — no email was sent and no password was changed.</p>
            </div>
            <Link href={result.demoResetHref} className="flex min-h-[52px] w-full items-center justify-center rounded-full bg-[#0985E7] px-5 py-3.5 text-[15px] font-black text-white transition hover:bg-[#0770c4]">
              Open demo reset page
            </Link>
            <button type="button" onClick={() => setResult(null)} className="flex min-h-[52px] w-full items-center justify-center rounded-full border-2 border-[#E4EEF9] px-5 py-3.5 text-[15px] font-black text-[#0C2B49] transition hover:bg-[#F5FAFF]">
              Try another email
            </button>
          </div>
        ) : (
          <form noValidate className="mt-6 space-y-3.5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-[13px] font-black text-[#0C2B49]">Email</span>
              <input
                className="mt-2 min-h-12 w-full rounded-[14px] border border-[#E4EEF9] bg-[#F5FAFF] px-3.5 text-sm font-semibold text-[#0C2B49] outline-none focus:border-[#0985E7]"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>

            {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600">{error}</p>}

            <button type="submit" disabled={isSubmitting} className="mt-2 flex min-h-[52px] w-full items-center justify-center rounded-full bg-[#0985E7] px-5 py-3.5 text-[15px] font-black text-white transition hover:bg-[#0770c4] disabled:opacity-60">
              {isSubmitting ? "Sending…" : "Send reset link"}
            </button>

            <Link href="/login" className="flex min-h-[52px] w-full items-center justify-center rounded-full border-2 border-[#E4EEF9] px-5 py-3.5 text-[15px] font-black text-[#0C2B49] transition hover:bg-[#F5FAFF]">
              Back to sign in
            </Link>
          </form>
        )}
      </section>
    </main>
  );
}
