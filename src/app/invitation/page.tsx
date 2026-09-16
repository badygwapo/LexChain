import Link from "next/link";
import { permanentRedirect } from "next/navigation";

type InvitationQueryPageProps = {
  searchParams: Promise<{
    email?: string | string[];
    token?: string | string[];
  }>;
};

function firstValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function InvitationQueryPage({
  searchParams,
}: InvitationQueryPageProps) {
  const params = await searchParams;
  const token = firstValue(params.token)?.trim();
  const email = firstValue(params.email)?.trim();

  if (token) {
    const emailQuery = email ? `?email=${encodeURIComponent(email)}` : '';
    permanentRedirect(`/invite/${encodeURIComponent(token)}${emailQuery}`);
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#F5FAFF] px-5 py-14 text-[#102033]">
      <section className="w-full max-w-[520px] rounded-[24px] border border-[#E4EEF9] bg-white p-7 shadow-[0_10px_24px_rgba(12,43,73,0.08)]">
        <p className="text-sm font-black uppercase text-[#0985E7]">LexChain</p>
        <h1 className="mt-3 text-3xl font-black leading-9 text-[#0C2B49]">
          Invite link missing
        </h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-[#64748b]">
          Use the complete invitation link sent to your email.
        </p>
        <Link
          className="mt-6 inline-flex rounded-full bg-[#0985E7] px-5 py-3 text-sm font-black text-white"
          href="/"
        >
          Back to LexChain
        </Link>
      </section>
    </main>
  );
}
