'use client';

import { useEffect, useRef, useState } from 'react';

const popupOpened = 'lexchain:popup-opened';

export function usePopup() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const root = ref.current;
    if (!root) return;
    root.setAttribute('data-popup-open', 'true');
    document.dispatchEvent(new CustomEvent(popupOpened, { detail: root }));

    function dismissOutside(event: Event) {
      if (root && !event.composedPath().includes(root)) setOpen(false);
    }
    function dismissSibling(event: Event) {
      if (!root?.contains((event as CustomEvent<Node>).detail)) setOpen(false);
    }
    function dismissEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      if (!(event.target instanceof Element) || event.target.closest('[data-popup-open="true"]') !== root) return;
      event.preventDefault();
      setOpen(false);
      root?.querySelector<HTMLElement>('[aria-expanded="true"], summary')?.focus();
    }

    document.addEventListener('pointerdown', dismissOutside);
    document.addEventListener('mousedown', dismissOutside);
    document.addEventListener('click', dismissOutside);
    document.addEventListener('focusin', dismissOutside);
    document.addEventListener(popupOpened, dismissSibling);
    document.addEventListener('keydown', dismissEscape);
    return () => {
      root.removeAttribute('data-popup-open');
      document.removeEventListener('pointerdown', dismissOutside);
      document.removeEventListener('mousedown', dismissOutside);
      document.removeEventListener('click', dismissOutside);
      document.removeEventListener('focusin', dismissOutside);
      document.removeEventListener(popupOpened, dismissSibling);
      document.removeEventListener('keydown', dismissEscape);
    };
  }, [open]);

  return { open, setOpen, ref };
}
