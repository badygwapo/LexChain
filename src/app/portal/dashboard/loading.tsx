export default function DashboardLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-8 w-48 bg-[var(--portal-border-soft)] rounded-lg" />
      <div className="h-4 w-64 bg-[var(--portal-border-soft)] rounded" />
      <div className="grid grid-cols-2 gap-3">
        {[1,2,3,4].map(i => <div key={i} className="h-24 bg-[var(--portal-border-soft)] rounded-[18px]" />)}
      </div>
      <div className="space-y-3">
        {[1,2,3].map(i => <div key={i} className="h-[72px] bg-[var(--portal-border-soft)] rounded-[18px]" />)}
      </div>
    </div>
  );
}
