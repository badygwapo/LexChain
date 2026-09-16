type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

type BadgeProps = {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
};

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-[var(--surface-tint)] text-[var(--brand-blue)]",
  success: "bg-[var(--status-success-bg)] text-[var(--status-success)]",
  warning: "bg-[var(--status-warning-bg)] text-[var(--status-warning)]",
  danger: "bg-red-100 text-red-700",
  info: "bg-[var(--status-info-bg)] text-[var(--status-info-text)]",
};

export function Badge({ variant = "default", children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
