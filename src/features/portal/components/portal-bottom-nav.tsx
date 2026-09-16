'use client';

import Link from 'next/link';
import { getPortalNavigation } from '@/features/portal/portal-dashboard';
import type { PortalUiRole } from "@/features/access";
import { getPortalNavigationIcon, isPortalRouteActive } from "@/features/access/components";

export function PortalBottomNav({
  pathname,
  role,
}: {
  pathname: string;
  role: PortalUiRole;
}) {
  const navItems = getPortalNavigation(role).flatMap((group) => group.items);

  return (
    <>
      {/* Mobile: floating pill nav like native app */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(215,235,255,0.9), rgba(243,248,255,0))' }}
      >
        <div className="flex items-center gap-4 px-4 pb-6 pt-9 pointer-events-auto w-full mx-auto">
          <nav
            aria-label="Mobile portal navigation"
            className="flex min-h-[62px] min-w-0 flex-1 items-center gap-1 overflow-x-auto rounded-[30px] bg-white p-[3px] shadow-[0_10px_18px_rgba(22,137,245,0.08)]"
          >
            {navItems.map((item) => {
              const active = isPortalRouteActive(pathname, item);
              const Icon = getPortalNavigationIcon(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={item.label}
                  aria-current={active ? 'page' : undefined}
                  className={`flex min-h-[56px] min-w-20 shrink-0 flex-col items-center justify-center gap-[3px] rounded-[28px] px-1 transition-colors ${active ? 'bg-[var(--portal-surface-soft)]' : ''}`}
                >
                  <span className={active ? 'text-[var(--portal-primary)]' : 'text-[var(--portal-text-muted)]'}>
                    <Icon fontSize="small" />
                  </span>
                  <span className={`max-w-[76px] text-center text-[9px] font-bold leading-[10px] ${active ? 'text-[var(--portal-primary)]' : 'text-[var(--portal-text-muted)]'}`}>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
}
