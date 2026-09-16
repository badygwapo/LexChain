"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, type ReactNode } from "react";
import { demoResetToken, webResetPasswordSchema } from "@/features/auth/schemas/auth";

const unavailableMessage = "Password recovery is not connected yet. The backend password-recovery endpoints are required before this can send a real email.";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const tokens = useSearchParams().getAll("token");
  const isDemoMode = process.env.NEXT_PUBLIC_USE_MOCK_API === "true";
  const hasValidToken = tokens.length === 1 && tokens[0] === demoResetToken;
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  if (!hasValidToken) {
    return (
      <ResetPasswordShell>
        <div className="mt-6 space-y-4">
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            This password reset link is invalid or has expired.
          </p>
          <Link href="/login" className="flex min-h-[52px] w-full items-center justify-center rounded-full border-2 border-[#E4EEF9] px-5 py-3.5 text-[15px] font-black text-[#0C2B49] transition hover:bg-[#F5FAFF]">
            Back to sign in
          </Link>
        </div>
      </ResetPasswordShell>
    );
  }

  if (!isDemoMode) {
    return (
      <ResetPasswordShell>
        <div className="mt-6 space-y-4">
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {unavailableMessage}
          </p>
          <Link href="/login" className="flex min-h-[52px] w-full items-center justify-center rounded-full border-2 border-[#E4EEF9] px-5 py-3.5 text-[15px] font-black text-[#0C2B49] transition hover:bg-[#F5FAFF]">
            Back to sign in
          </Link>
        </div>
      </ResetPasswordShell>
    );
  }

  if (isComplete) {
    return (
      <ResetPasswordShell>
        <div className="mt-6 space-y-4">
          <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-black text-[#0C2B49]">
            Demo complete — no real password was changed.
          </p>
          <Link href="/login" className="flex min-h-[52px] w-full items-center justify-center rounded-full bg-[#0985E7] px-5 py-3.5 text-[15px] font-black text-white transition hover:bg-[#0770c4]">
            Back to sign in
          </Link>
        </div>
      </ResetPasswordShell>
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = webResetPasswordSchema.safeParse({ password, confirmPassword });

    if (!parsed.success) {
      setErrors(parsed.error.issues.map((issue) => issue.message));
      return;
    }

    setErrors([]);
    setIsComplete(true);
  }

  return (
    <ResetPasswordShell>
      <form noValidate className="mt-6 space-y-3.5" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-[13px] font-black text-[#0C2B49]">New password</span>
          <input
            className="mt-2 min-h-12 w-full rounded-[14px] border border-[#E4EEF9] bg-[#F5FAFF] px-3.5 text-sm font-semibold text-[#0C2B49] outline-none focus:border-[#0985E7]"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-[13px] font-black text-[#0C2B49]">Confirm new password</span>
          <input
            className="mt-2 min-h-12 w-full rounded-[14px] border border-[#E4EEF9] bg-[#F5FAFF] px-3.5 text-sm font-semibold text-[#0C2B49] outline-none focus:border-[#0985E7]"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </label>
        {errors.length > 0 && (
          <ul role="alert" className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600">
            {errors.map((error) => <li key={error}>{error}</li>)}
          </ul>
        )}
        <button type="submit" className="mt-2 flex min-h-[52px] w-full items-center justify-center rounded-full bg-[#0985E7] px-5 py-3.5 text-[15px] font-black text-white transition hover:bg-[#0770c4]">
          Reset password
        </button>
      </form>
    </ResetPasswordShell>
  );
}

function ResetPasswordShell({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5FAFF] p-5 text-[#111827]">
      <section className="w-full max-w-[440px] rounded-[24px] border border-[#E4EEF9] bg-white p-7 shadow-[0_10px_24px_rgba(12,43,73,0.08)]">
        <div className="space-y-2">
          <div className="mb-1 flex items-center gap-2">
            <Image src="/lexchain/logo-lexchain.svg" alt="LexChain" width={36} height={36} className="rounded-[10px]" />
            <span className="text-lg font-black text-[#0C2B49]">Lex<span className="text-[#0985E7]">Chain</span></span>
          </div>
          <h1 className="text-3xl font-black leading-9 text-[#0C2B49]">Reset password</h1>
          <p className="text-sm font-semibold leading-5 text-[#64748b]">Choose a new password for this demo account.</p>
        </div>
        {children}
      </section>
    </main>
  );
}
