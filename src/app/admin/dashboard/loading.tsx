import { AdminShell } from "@/features/admin";
import { Skeleton } from "@/features/admin/components";

export default function DashboardLoading() {
  return (
    <AdminShell activeHref="/admin/dashboard">
      <div className="flex h-full w-full flex-col gap-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#0985E7]">LexChain Operations</p>
            <h1 className="text-[32px] font-black leading-[38px] text-[#0C2B49]">Dashboard</h1>
            <p className="max-w-3xl text-sm font-semibold leading-5 text-[#64748b]">Live platform health — document processing, blockchain anchoring, and user activity.</p>
          </div>
        </header>

        <section className="grid grid-cols-12 gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className={`flex gap-4 rounded-2xl border border-[#E4EEF9] bg-white p-5 ${i < 4 ? "col-span-3" : "col-span-4"}`}>
              <Skeleton className="h-12 w-12 shrink-0 rounded-[14px]" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-2 gap-5">
          <div className="rounded-2xl border border-[#E4EEF9] bg-white p-6 space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
            <div className="flex gap-4">
              <Skeleton className="h-16 flex-1 rounded-xl" />
              <Skeleton className="h-16 flex-1 rounded-xl" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-2 w-full rounded-full" />
              <Skeleton className="h-2 w-full rounded-full" />
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          </div>
          <div className="rounded-2xl border border-[#E4EEF9] bg-white p-6 space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-52" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-[#E4EEF9] p-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-44" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
