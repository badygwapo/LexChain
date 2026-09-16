export function MetricCard({ icon, label, value, detail, color }: { icon: React.ReactNode; label: string; value: number; detail: string; color: string }) {
  return (
    <article className="flex min-h-[112px] items-center gap-3 rounded-2xl border border-[#E4EEF9] bg-white p-4 shadow-sm shadow-[#DDEAF7]/40 transition hover:-translate-y-0.5 hover:border-[#C7DBEF]">
      <div className={`flex size-11 shrink-0 items-center justify-center rounded-full ${color}`}>{icon}</div>
      <div className="min-w-0">
        <p className="truncate text-xs font-black text-[#0C2B49]">{label}</p>
        <p className="mt-1 text-2xl font-black leading-none text-[#071B33]">{value.toLocaleString()}</p>
        <p className="mt-2 truncate text-xs font-semibold text-[#5B6F8A]">{detail}</p>
      </div>
    </article>
  );
}
