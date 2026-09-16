"use client";

import Image from 'next/image';
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { getEmailFromInviteToken } from "@/shared/utils/invite-token";

const registerSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required."),
  lastName: z.string().trim().min(1, "Last name is required."),
  email: z.string().trim().min(1, "Email is required.").email("Enter a valid email."),
  password: z.string().min(1, "Password is required.").refine(
    (v) => v.length >= 8 && /\d/.test(v) && /[A-Z]/.test(v) && /[a-z]/.test(v) && /[^A-Za-z0-9]/.test(v),
    "8+ chars, uppercase, lowercase, number, and special character.",
  ),
  confirmPassword: z.string().min(1, "Confirm your password."),
}).refine((v) => v.password === v.confirmPassword, { message: "Passwords do not match.", path: ["confirmPassword"] });

type RegisterForm = z.infer<typeof registerSchema>;

type SignUpResponse = {
  requires_email_confirmation?: boolean;
  message?: string;
};

type CreatedAccount = {
  email: string;
  requiresEmailConfirmation: boolean;
};

async function signUp(data: RegisterForm & { token?: string }) {
  const res = await fetch("/api/portal/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: data.email,
      password: data.password,
      f_name: data.firstName,
      l_name: data.lastName,
      phone_number: null,
      ...(data.token ? { token: data.token } : null),
    }),
  });
  const payload = await res.json().catch(() => null);
  if (!res.ok) throw new Error(payload?.message ?? "Sign up failed.");
  return payload as SignUpResponse;
}

function RegisterPageContent() {
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("token")?.trim() ?? "";
  const inviteEmail = searchParams.get("email")?.trim() || getEmailFromInviteToken(inviteToken);
  const hasInviteEmail = inviteEmail.length > 0;
  const [createdAccount, setCreatedAccount] = useState<CreatedAccount | null>(null);
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: inviteEmail,
    },
  });

  const mutation = useMutation({
    mutationFn: signUp,
    onSuccess: (response, values) => {
      const requiresEmailConfirmation = response.requires_email_confirmation !== false;
      setCreatedAccount({
        email: values.email,
        requiresEmailConfirmation,
      });
      toast.success(
        requiresEmailConfirmation
          ? "Account created. Check your email to verify it."
          : "Account created. You can now sign in.",
      );
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const onSubmit = handleSubmit((values) => mutation.mutate({ ...values, token: inviteToken || undefined }));
  const inputClass = "mt-2 min-h-12 w-full rounded-[14px] border border-[#E4EEF9] bg-[#F5FAFF] px-3.5 text-sm font-semibold text-[#0C2B49] outline-none focus:border-[#0985E7]";
  const emailInputClass = hasInviteEmail
    ? `${inputClass} cursor-not-allowed bg-[#EEF4FB] text-[#4B6382]`
    : inputClass;

  useEffect(() => {
    if (inviteEmail) {
      setValue("email", inviteEmail, { shouldValidate: true });
    }
  }, [inviteEmail, setValue]);

  if (createdAccount) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F5FAFF] p-5 text-[#111827]">
        <section className="w-full max-w-[440px] rounded-[24px] border border-[#E4EEF9] bg-white p-7 shadow-[0_10px_24px_rgba(12,43,73,0.08)]">
          <div className="flex items-center gap-2">
            <Image src="/lexchain/logo-lexchain.svg" alt="LexChain" width={36} height={36} className="rounded-[10px]" />
            <span className="text-lg font-black text-[#0C2B49]">Lex<span className="text-[#0985E7]">Chain</span></span>
          </div>
          <div className="mt-7 rounded-[20px] bg-[#EAF6FF] p-5">
            <h1 className="text-3xl font-black leading-9 text-[#0C2B49]">
              {createdAccount.requiresEmailConfirmation ? "Check your email" : "Account created"}
            </h1>
            <p className="mt-3 text-sm font-semibold leading-5 text-[#4B6382]">
              {createdAccount.requiresEmailConfirmation
                ? `We sent a verification link to ${createdAccount.email}. Verify your email before signing in.`
                : `Your account for ${createdAccount.email} is ready. You can now sign in.`}
            </p>
          </div>
          <Link
            href="/login"
            className="mt-6 flex min-h-[52px] w-full items-center justify-center rounded-full bg-[#0985E7] px-5 py-3.5 text-[15px] font-black text-white transition hover:bg-[#0770c4]"
          >
            Go to login
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5FAFF] p-5 text-[#111827]">
      <section className="w-full max-w-[440px] rounded-[24px] border border-[#E4EEF9] bg-white p-7 shadow-[0_10px_24px_rgba(12,43,73,0.08)]">
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <Image src="/lexchain/logo-lexchain.svg" alt="LexChain" width={36} height={36} className="rounded-[10px]" />
            <span className="text-lg font-black text-[#0C2B49]">Lex<span className="text-[#0985E7]">Chain</span></span>
          </div>
          <h1 className="text-3xl font-black leading-9 text-[#0C2B49]">Create account</h1>
          <p className="text-sm font-semibold leading-5 text-[#64748b]">
            {inviteToken
              ? "Complete your LexChain Lawyer invitation."
              : "Register to access your documents."}
          </p>
        </div>

        <form className="mt-6 space-y-3.5" onSubmit={onSubmit}>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[13px] font-black text-[#0C2B49]">First Name</span>
              <input {...register("firstName")} placeholder="John" className={inputClass} />
              {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName.message}</p>}
            </label>
            <label className="block">
              <span className="text-[13px] font-black text-[#0C2B49]">Last Name</span>
              <input {...register("lastName")} placeholder="Doe" className={inputClass} />
              {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName.message}</p>}
            </label>
          </div>

          <label className="block">
            <span className="text-[13px] font-black text-[#0C2B49]">Email</span>
            <input
              {...register("email")}
              type="email"
              autoComplete="email"
              className={emailInputClass}
              readOnly={hasInviteEmail}
              aria-disabled={hasInviteEmail}
              tabIndex={hasInviteEmail ? -1 : undefined}
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
          </label>

          <label className="block">
            <span className="text-[13px] font-black text-[#0C2B49]">Password</span>
            <input {...register("password")} type="password" className={inputClass} />
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
          </label>

          <label className="block">
            <span className="text-[13px] font-black text-[#0C2B49]">Confirm Password</span>
            <input {...register("confirmPassword")} type="password" className={inputClass} />
            {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>}
          </label>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="mt-2 flex min-h-[52px] w-full items-center justify-center rounded-full bg-[#0985E7] px-5 py-3.5 text-[15px] font-black text-white transition hover:bg-[#0770c4] disabled:opacity-60"
          >
            {mutation.isPending ? "Creating account…" : "Create account"}
          </button>

          <Link
            href="/login"
            className="flex min-h-[52px] w-full items-center justify-center rounded-full border-2 border-[#E4EEF9] px-5 py-3.5 text-[15px] font-black text-[#0C2B49] transition hover:bg-[#F5FAFF]"
          >
            I already have an account
          </Link>
        </form>
      </section>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#F5FAFF] p-5 text-[#111827]">
          <section className="w-full max-w-[440px] rounded-[24px] border border-[#E4EEF9] bg-white p-7 shadow-[0_10px_24px_rgba(12,43,73,0.08)]">
            <p className="text-sm font-black text-[#0C2B49]">Loading sign-up</p>
          </section>
        </main>
      }
    >
      <RegisterPageContent />
    </Suspense>
  );
}
