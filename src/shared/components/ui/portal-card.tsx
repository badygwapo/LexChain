type PortalCardProps = {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
};

export function PortalCard({ children, className = "", padded = true }: PortalCardProps) {
  return (
    <article
      className={`rounded-[18px] border border-[var(--border-soft)] bg-white shadow-[0_4px_12px_rgba(19,59,115,0.05)] ${padded ? "p-5" : ""} ${className}`}
    >
      {children}
    </article>
  );
}
