export default function DocumentsLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-36 bg-[var(--portal-border-soft)] rounded-lg" />
      <div className="h-[50px] bg-[var(--portal-border-soft)] rounded-full" />
      <div className="space-y-3">
        {[1,2,3,4,5].map(i => <div key={i} className="h-[72px] bg-[var(--portal-border-soft)] rounded-[18px]" />)}
      </div>
    </div>
  );
}
