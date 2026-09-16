import Link from 'next/link';
import Image from 'next/image';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#F5FAFF] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Image src="/lexchain/logo-lexchain.svg" alt="LexChain" width={44} height={44} className="rounded-[14px]" />
          <span className="text-2xl font-black text-[#0C2B49]">Lex<span className="text-[#0985E7]">Chain</span></span>
        </div>

        <h1 className="text-[96px] font-black leading-none text-[#0985E7]">404</h1>
        <h2 className="text-2xl font-black text-[#0C2B49] mt-2">Page not found</h2>
        <p className="text-sm text-[#64748b] mt-3 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="flex items-center justify-center gap-3 mt-8">
          <Link
            href="/portal/dashboard"
            className="rounded-full bg-[#0985E7] px-6 py-3 text-sm font-black text-white transition hover:bg-[#0770c4]"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="rounded-full border border-[#E8F0F8] bg-white px-6 py-3 text-sm font-black text-[#0C2B49] transition hover:bg-[#F5FAFF]"
          >
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
