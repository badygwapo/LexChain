import { type InputHTMLAttributes, forwardRef } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    const inputClasses = `mt-2 min-h-12 w-full rounded-[14px] border px-3.5 text-sm font-semibold text-[var(--text-primary)] outline-none transition
      ${error ? "border-red-400 focus:border-red-500" : "border-[var(--border-default)] bg-[var(--surface-page)] focus:border-[var(--border-focus)]"}
      ${props.readOnly || props["aria-disabled"] ? "cursor-not-allowed bg-[var(--surface-muted)] text-[var(--text-muted)]" : ""}
      ${className}`;

    if (label) {
      return (
        <label className="block">
          <span className="text-[13px] font-black text-[var(--text-primary)]">{label}</span>
          <input ref={ref} className={inputClasses} {...props} />
          {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </label>
      );
    }

    return <input ref={ref} className={inputClasses} {...props} />;
  },
);

Input.displayName = "Input";
