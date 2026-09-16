"use client";

import { usePopup } from "@/shared/components/ui/use-popup";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

type Option = { label: string; value: string };

type DropdownProps = {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  openUp?: boolean;
};

export function Dropdown({ options, value, onChange, icon, openUp = false }: DropdownProps) {
  const { open, setOpen, ref } = usePopup();

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#E4EEF9] bg-[#F8FBFF] px-3 py-2 text-sm font-semibold text-[#0C2B49] outline-none transition hover:border-[#0985E7] focus-visible:ring-2 focus-visible:ring-[#0985E7]/30"
      >
        {icon}
        <span>{selected?.label ?? "Select"}</span>
        <KeyboardArrowDownIcon fontSize="small" className={`text-[#64748b] transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className={`absolute left-0 z-50 min-w-full overflow-hidden rounded-xl border border-[#E4EEF9] bg-white shadow-lg ${openUp ? "bottom-full mb-1" : "top-full mt-1"}`}>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => { onChange(option.value); setOpen(false); ref.current?.querySelector("button")?.focus(); }}
              className={`flex w-full cursor-pointer px-4 py-2.5 text-left text-sm font-semibold transition hover:bg-[#EEF4FB] ${
                option.value === value ? "bg-[#EEF4FB] text-[#0985E7]" : "text-[#0C2B49]"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
