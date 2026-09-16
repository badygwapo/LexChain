import { ReactNode } from "react";

export type StatColor = "blue" | "green" | "purple" | "yellow" | "red" | "indigo" | "teal" | "amber";

export type StatCardData = {
  label: string;
  value: string | number;
  detail: string;
  icon: ReactNode;
  color: StatColor;
};

const colorMap: Record<StatColor, { border: string; icon: string }> = {
  blue: { border: "border-r-[#0985E7]", icon: "text-[#0985E7] bg-[#EEF4FB]" },
  green: { border: "border-r-[#16a34a]", icon: "text-[#16a34a] bg-[#f0fdf4]" },
  purple: { border: "border-r-[#7c3aed]", icon: "text-[#7c3aed] bg-[#f5f3ff]" },
  yellow: { border: "border-r-[#ca8a04]", icon: "text-[#ca8a04] bg-[#fefce8]" },
  red: { border: "border-r-[#dc2626]", icon: "text-red-600 bg-red-100" },
  indigo: { border: "border-r-[#4f46e5]", icon: "text-indigo-600 bg-indigo-100" },
  teal: { border: "border-r-[#0d9488]", icon: "text-teal-600 bg-teal-100" },
  amber: { border: "border-r-[#ca8a04]", icon: "text-amber-600 bg-amber-100" },
};

export function StatCard({ label, value, detail, icon, color }: StatCardData) {
  return (
    <article className={`rounded-2xl border border-[#E4EEF9] border-r-[3px] ${colorMap[color].border} bg-white p-5 shadow-[0_1px_3px_rgba(12,43,73,0.03)]`}>
      <div className="flex items-center gap-3">
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${colorMap[color].icon}`}>
          {icon}
        </span>
        <p className="text-xs font-black uppercase tracking-[0.12em] text-[#64748b]">{label}</p>
      </div>
      <p className="mt-3 text-3xl font-black text-[#0C2B49]">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      <p className="mt-1 text-xs font-bold text-[#64748b]">{detail}</p>
    </article>
  );
}
