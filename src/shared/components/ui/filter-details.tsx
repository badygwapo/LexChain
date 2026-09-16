'use client';

import type { ReactNode } from 'react';
import { usePopup } from './use-popup';

export function FilterDetails({ summary, children }: { summary: ReactNode; children: ReactNode }) {
  const { open, setOpen, ref } = usePopup();
  return (
    <div ref={ref} className="relative">
      <details open={open}>
        <summary
          aria-expanded={open}
          onClick={(event) => { event.preventDefault(); setOpen((value) => !value); }}
          className="flex cursor-pointer list-none items-center gap-2 rounded-xl border border-[#E4EEF9] bg-white px-4 py-2.5 text-sm font-black text-[#0C2B49] outline-none hover:border-[#0985E7] focus-visible:ring-2 focus-visible:ring-[#0985E7]/30"
        >
          {summary}
        </summary>
        {open ? children : null}
      </details>
    </div>
  );
}
