import { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-1.5">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#0985E7]">
          LexChain Operations
        </p>
        <h1 className="text-[32px] font-black leading-[38px] text-[#0C2B49]">{title}</h1>
        <p className="max-w-3xl text-sm font-semibold leading-5 text-[#64748b]">{description}</p>
      </div>
      {action}
    </header>
  );
}
