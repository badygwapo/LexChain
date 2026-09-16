import { BrandLogo } from "./brand-logo";

type AuthCardProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--surface-page)] p-5 text-[var(--foreground)]">
      <section className="w-full max-w-[440px] rounded-[24px] border border-[var(--border-default)] bg-white p-7 shadow-[0_10px_24px_rgba(12,43,73,0.08)]">
        <div className="space-y-2">
          <BrandLogo className="mb-1" />
          <h1 className="text-3xl font-black leading-9 text-[var(--brand-navy)]">{title}</h1>
          {description && (
            <p className="text-sm font-semibold leading-5 text-[var(--text-secondary)]">{description}</p>
          )}
        </div>

        {children}

        {footer && <div className="mt-5">{footer}</div>}
      </section>
    </main>
  );
}
