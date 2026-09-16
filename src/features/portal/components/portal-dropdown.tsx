'use client';

import { useId, useRef, useState } from 'react';
import { usePopup } from '@/shared/components/ui/use-popup';
import CheckIcon from '@mui/icons-material/Check';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

export type PortalDropdownOption = {
  label: string;
  value: string;
};

type PortalDropdownProps = {
  ariaLabel: string;
  options: ReadonlyArray<PortalDropdownOption>;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  emptyLabel?: string;
};

export function PortalDropdown({ ariaLabel, options, value, onChange, placeholder = 'Select an option', disabled = false, emptyLabel = 'No options available' }: PortalDropdownProps) {
  const { open, setOpen, ref: rootRef } = usePopup();
  const selectedIndex = Math.max(options.findIndex((option) => option.value === value), 0);
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxId = useId();

  function close(returnFocus = false) {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }

  function select(index: number) {
    const option = options[index];
    if (!option) return;
    onChange(option.value);
    setActiveIndex(index);
    close(true);
  }

  function moveActive(direction: 1 | -1) {
    if (options.length === 0) return;
    setOpen(true);
    setActiveIndex((current) => (current + direction + options.length) % options.length);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveActive(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveActive(-1);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      close(true);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (open) select(activeIndex);
      else {
        setActiveIndex(selectedIndex);
        setOpen(true);
      }
    }
  }

  const selected = options[selectedIndex];

  return (
    <div ref={rootRef} className="relative mt-2">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-controls={listboxId}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => {
          setActiveIndex(selectedIndex);
          setOpen((current) => !current);
        }}
        onKeyDown={handleKeyDown}
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#D9E5F0] bg-white px-3 py-2.5 text-left text-sm font-semibold text-[#0C2B49] outline-none transition hover:border-[#0985E7] focus:border-[#0985E7] focus:ring-2 focus:ring-[#0985E7]/20 disabled:cursor-not-allowed disabled:bg-[#F8FBFF] disabled:text-[#94A3B8]"
      >
        <span>{selected?.label ?? placeholder}</span>
        <KeyboardArrowDownIcon fontSize="small" className={`shrink-0 text-[#64748b] transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open ? (
        <div
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel}
          aria-activedescendant={options.length > 0 ? `${listboxId}-option-${activeIndex}` : undefined}
          className="absolute left-0 top-full z-50 mt-2 w-full overflow-hidden rounded-xl border border-[#D9E5F0] bg-white p-1 shadow-[0_16px_40px_rgba(12,43,73,0.14)]"
        >
          {options.length === 0 ? (
            <p className="px-3 py-2.5 text-sm font-semibold text-[#94A3B8]">{emptyLabel}</p>
          ) : (
            options.map((option, index) => (
              <button
                key={option.value}
                id={`${listboxId}-option-${index}`}
                type="button"
                role="option"
                aria-selected={index === selectedIndex}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => select(index)}
                className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${
                  index === activeIndex ? 'bg-[#EEF6FF] text-[#0985E7]' : 'text-[#0C2B49] hover:bg-[#F8FBFF]'
                }`}
              >
                <span>{option.label}</span>
                {index === selectedIndex ? <CheckIcon fontSize="small" aria-hidden /> : null}
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
