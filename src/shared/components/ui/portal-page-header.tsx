type PortalPageHeaderProps = {
  label: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function PortalPageHeader({ label, title, description, action }: PortalPageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-xs font-black tracking-wider text-[var(--brand-blue)]">{label}</p>
        <h1 className="mt-1 text-[28px] font-black text-[var(--brand-navy)]">{title}</h1>
        {description && <p className="mt-1 text-sm font-semibold text-[var(--text-secondary)]">{description}</p>}
      </div>
      {action}
    </div>
  );
}
