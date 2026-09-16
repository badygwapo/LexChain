type LoadingPulseProps = {
  height?: string;
  className?: string;
};

export function LoadingPulse({ height = "h-36", className = "" }: LoadingPulseProps) {
  return (
    <div
      className={`animate-pulse rounded-[18px] border border-[var(--border-soft)] bg-white ${height} ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}
