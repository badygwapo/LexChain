type EmptyStateProps = {
  message?: string;
  className?: string;
};

export function EmptyState({ message = "No items found", className = "" }: EmptyStateProps) {
  return (
    <div className={`rounded-[18px] border border-[var(--border-soft)] bg-white p-8 text-center ${className}`}>
      <p className="text-sm font-bold text-[var(--text-primary)]">{message}</p>
    </div>
  );
}
