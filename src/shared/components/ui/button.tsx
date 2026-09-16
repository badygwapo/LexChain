import { type ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  loading?: boolean;
};

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--brand-blue)] text-white hover:bg-[var(--brand-blue-hover)] shadow-[0_4px_12px_rgba(9,133,231,0.22)]",
  secondary:
    "border-2 border-[var(--border-default)] bg-white text-[var(--brand-navy)] hover:bg-[var(--surface-page)]",
  ghost:
    "border border-[var(--border-soft)] bg-white text-[var(--brand-navy)] hover:bg-[var(--surface-soft)]",
  danger:
    "bg-red-600 text-white hover:bg-red-700",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", loading, disabled, className = "", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`flex min-h-[52px] w-full items-center justify-center rounded-full px-5 py-3.5 text-[15px] font-black transition disabled:opacity-60 ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {loading ? "Loading…" : children}
      </button>
    );
  },
);

Button.displayName = "Button";

type InlineButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  loading?: boolean;
};

const inlineVariantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--brand-blue)] text-white hover:bg-[var(--brand-blue-hover)]",
  secondary:
    "border border-[var(--border-default)] bg-white text-[var(--brand-navy)] hover:bg-[var(--surface-page)]",
  ghost:
    "text-[var(--brand-blue)] hover:underline",
  danger:
    "border border-red-200 text-red-700 hover:bg-red-50",
};

export const InlineButton = forwardRef<HTMLButtonElement, InlineButtonProps>(
  ({ variant = "ghost", loading, disabled, className = "", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black transition disabled:opacity-60 ${inlineVariantStyles[variant]} ${className}`}
        {...props}
      >
        {loading ? "Working…" : children}
      </button>
    );
  },
);

InlineButton.displayName = "InlineButton";
