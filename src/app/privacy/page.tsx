import Link from "next/link";

const sections = [
  {
    title: "Document privacy",
    copy: "LexChain is designed so document content stays off-chain. Verification relies on document hashes and metadata needed for integrity checks.",
  },
  {
    title: "Account data",
    copy: "Account information is used for authentication, authorization, auditability, and controlled access to document workflows.",
  },
  {
    title: "Management access",
    copy: "System Management actions should remain protected by backend authorization. The frontend never stores backend secrets or service credentials.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-dvh bg-white px-5 py-12 text-[#0C2B49]">
      <section className="mx-auto max-w-3xl">
        <Link className="text-sm font-black text-[#0985E7]" href="/">
          ← Back to LexChain
        </Link>
        <p className="mt-10 text-xs font-black uppercase tracking-[0.18em] text-[#0985E7]">
          Privacy
        </p>
        <h1 className="mt-4 text-4xl font-black leading-tight">Privacy overview</h1>
        <p className="mt-4 text-base font-semibold leading-7 text-[#64748b]">
          This page is a frontend placeholder for the LexChain MVP. Final legal
          policy text should be reviewed before production launch.
        </p>

        <div className="mt-8 space-y-4">
          {sections.map((section) => (
            <article className="rounded-[18px] bg-[#F5FAFF] p-6" key={section.title}>
              <h2 className="text-lg font-black">{section.title}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#64748b]">
                {section.copy}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
