"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { z } from "zod";

const resendSchema = z.object({
  email: z.string().trim().min(1, "Email is required.").email("Enter a valid email."),
});

type ResendState = {
  status: "idle" | "success" | "error";
  message: string;
};

async function resendVerification(email: string) {
  const res = await fetch("/api/portal/resend-verification", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const payload = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(payload?.message ?? "Could not resend verification email.");
  }

  return payload?.message ?? "Verification email sent.";
}

export function VerifiedContent() {
  const [email, setEmail] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [resendState, setResendState] = useState<ResendState>({
    status: "idle",
    message: "",
  });

  async function handleResend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = resendSchema.safeParse({ email });
    if (!parsed.success) {
      setResendState({
        status: "error",
        message: parsed.error.issues[0]?.message ?? "Enter a valid email.",
      });
      return;
    }

    setIsPending(true);
    setResendState({ status: "idle", message: "" });

    try {
      const message = await resendVerification(parsed.data.email);
      setResendState({ status: "success", message });
    } catch (error) {
      setResendState({
        status: "error",
        message: error instanceof Error ? error.message : "Could not resend verification email.",
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5FAFF] p-5 text-[#111827]">
      <section className="w-full max-w-[460px] rounded-[24px] border border-[#E4EEF9] bg-white p-7 shadow-[0_10px_24px_rgba(12,43,73,0.08)]">
        <div className="flex items-center gap-2">
          <Image
            src="/lexchain/logo-lexchain.svg"
            alt="LexChain"
            width={36}
            height={36}
            className="rounded-[10px]"
          />
          <span className="text-lg font-black text-[#0C2B49]">
            Lex<span className="text-[#0985E7]">Chain</span>
          </span>
        </div>

        <div className="mt-7 rounded-[20px] bg-[#EAF6FF] p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0985E7] text-white">
            <svg
              aria-hidden="true"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
              viewBox="0 0 24 24"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <h1 className="mt-4 text-3xl font-black leading-9 text-[#0C2B49]">
            Email verified
          </h1>
          <p className="mt-3 text-sm font-semibold leading-5 text-[#4B6382]">
            Your LexChain account has been verified. You can now sign in using
            the email and password you registered.
          </p>
        </div>

        <Link
          href="/login"
          className="mt-6 flex min-h-[52px] w-full items-center justify-center rounded-full bg-[#0985E7] px-5 py-3.5 text-[15px] font-black text-white transition hover:bg-[#0770c4]"
        >
          Go to login
        </Link>

        <form className="mt-6 rounded-[18px] border border-[#E4EEF9] p-4" onSubmit={handleResend}>
          <h2 className="text-sm font-black text-[#0C2B49]">
            Need another verification email?
          </h2>
          <p className="mt-1 text-sm font-semibold leading-5 text-[#64748b]">
            Enter your account email and LexChain will send a new verification link.
          </p>
          <label className="mt-4 block">
            <span className="text-[13px] font-black text-[#0C2B49]">Email</span>
            <input
              className="mt-2 min-h-12 w-full rounded-[14px] border border-[#E4EEF9] bg-[#F5FAFF] px-3.5 text-sm font-semibold text-[#0C2B49] outline-none focus:border-[#0985E7]"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.currentTarget.value)}
            />
          </label>
          {resendState.message ? (
            <p
              className={[
                "mt-3 text-sm font-semibold",
                resendState.status === "success" ? "text-[#127A43]" : "text-red-600",
              ].join(" ")}
            >
              {resendState.message}
            </p>
          ) : null}
          <button
            className="mt-4 flex min-h-[48px] w-full items-center justify-center rounded-full border-2 border-[#E4EEF9] px-5 py-3 text-sm font-black text-[#0C2B49] transition hover:bg-[#F5FAFF] disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={isPending}
          >
            {isPending ? "Sending email" : "Resend verification email"}
          </button>
        </form>
      </section>
    </main>
  );
}
