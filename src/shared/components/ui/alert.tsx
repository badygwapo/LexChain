type AlertVariant = "error" | "success" | "info" | "warning";

type AlertProps = {
  variant: AlertVariant;
  children: React.ReactNode;
  className?: string;
};

const variantStyles: Record<AlertVariant, string> = {
  error: "bg-red-50 text-red-600 border border-red-200",
  success: "border border-green-200 bg-green-50",
  info: "border border-[var(--status-info-border)] bg-[var(--status-info-bg)] text-[var(--status-info-text)]",
  warning: "border border-[var(--status-warning)] bg-[var(--status-warning-bg)]",
};

export function Alert({ variant, children, className = "" }: AlertProps) {
  return (
    <div
      role={variant === "error" ? "alert" : undefined}
      className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${variantStyles[variant]} ${className}`}
    >
      {children}
    </div>
  );
}
