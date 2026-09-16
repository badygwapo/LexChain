import Link from "next/link";

const terms = [
  "LexChain helps manage, search, and verify legal documents, but it does not replace legal advice.",
  "Users are responsible for uploading documents they are authorized to process.",
  "Blockchain verification confirms hash integrity, not the legal validity of a document.",
  "Backend authorization remains the source of truth for protected records and Lawyer management access.",
];

export default function TermsPage() {
  return (
    <main className="min-h-dvh bg-[#F5FAFF] px-5 py-12 text-[#0C2B49]">
      <section className="mx-auto max-w-3xl rounded-[24px] border border-[#E4EEF9] bg-white p-7 shadow-[0_10px_24px_rgba(12,43,73,0.08)] sm:p-9">
        <Link className="text-sm font-black text-[#0985E7]" href="/">
          ← Back to LexChain
        </Link>
        <p className="mt-10 text-xs font-black uppercase tracking-[0.18em] text-[#0985E7]">
          Terms
        </p>
        <h1 className="mt-4 text-4xl font-black leading-tight">Terms overview</h1>
        <p className="mt-4 text-base font-semibold leading-7 text-[#64748b]">
          This page is an MVP placeholder. Replace it with reviewed production
          terms before public deployment.
        </p>

        <ol className="mt-8 space-y-4">
          {terms.map((term, index) => (
            <li className="rounded-[18px] bg-[#F5FAFF] p-5" key={term}>
              <p className="text-xs font-black text-[#0985E7]">0{index + 1}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#64748b]">
                {term}
              </p>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
