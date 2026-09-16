import { AdminShell } from "@/features/admin";
import { Skeleton } from "@/features/admin/components";

export default function UsersLoading() {
  return (
    <AdminShell activeHref="/admin/users">
      <div className="flex h-full w-full flex-col gap-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#0985E7]">LexChain Operations</p>
            <h1 className="text-[32px] font-black leading-[38px] text-[#0C2B49]">Users</h1>
            <p className="max-w-3xl text-sm font-semibold leading-5 text-[#64748b]">Manage registered accounts, roles, and access permissions.</p>
          </div>
          <Skeleton className="h-10 w-36 rounded-xl" />
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-[#E4EEF9] bg-white p-5 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-8 w-12" />
              <Skeleton className="h-3 w-28" />
            </div>
          ))}
        </section>

        <article className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-[#E4EEF9] bg-white">
          <div className="flex items-center gap-3 border-b border-[#E4EEF9] px-6 py-4">
            <Skeleton className="h-6 w-24" />
            <div className="ml-auto flex gap-3">
              <Skeleton className="h-9 w-52 rounded-xl" />
              <Skeleton className="h-9 w-28 rounded-xl" />
              <Skeleton className="h-9 w-28 rounded-xl" />
              <Skeleton className="h-9 w-20 rounded-xl" />
            </div>
          </div>
          <div className="flex-1 p-6 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[65px] w-full rounded-lg" />
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-[#E4EEF9] px-6 py-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
        </article>
      </div>
    </AdminShell>
  );
}
