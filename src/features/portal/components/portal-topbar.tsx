'use client';

import { usePopup } from '@/shared/components/ui/use-popup';
import Link from 'next/link';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import type { PortalUiRole } from "@/features/access";
import { PortalSearchBar } from '@/features/portal/components/portal-search-bar';

type PortalNotification = { id: string; title: string; body: string; is_read: boolean; created_at: string };

type PortalTopBarProps = {
  fullName: string;
  initials: string;
  roleLabel: string;
  role: PortalUiRole;
  processingCount: number;
  unreadCount?: number;
  notifications?: PortalNotification[];
  onMarkAllRead?: () => void;
  onSignOut: () => void;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function PortalTopBar({ fullName, initials, roleLabel, role, processingCount, unreadCount = 0, notifications = [], onMarkAllRead, onSignOut }: PortalTopBarProps) {
  const processingLabel = processingCount === 1 ? '1 document processing' : `${processingCount} documents processing`;
  const { open: profileMenuOpen, setOpen: setProfileMenuOpen, ref: profileMenuRef } = usePopup();
  const { open: notificationMenuOpen, setOpen: setNotificationMenuOpen, ref: notificationMenuRef } = usePopup();
  const unreadNotifications = notifications.filter((n) => !n.is_read);

  return (
    <header className="sticky top-0 z-40 -mx-6 mb-6 border-b border-[var(--portal-border-soft)] bg-[var(--portal-surface)] px-4 md:px-6">
      <div className="flex min-h-16 items-center gap-3">
        <PortalSearchBar />
        {role === 'lawyer' ? (
          <Link
            href="/portal/dashboard"
            aria-label="View processing documents"
            className="hidden rounded-full bg-[#FFF4DD] px-3 py-1.5 text-xs font-bold text-[#9A6700] transition hover:bg-[#FFE9BD] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0985E7] lg:inline-flex"
          >
            {processingLabel}
          </Link>
        ) : null}
        <div className="flex shrink-0 items-center gap-2">
          <div ref={notificationMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setNotificationMenuOpen((open) => !open)}
              aria-label="View notifications"
              aria-expanded={notificationMenuOpen}
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[var(--portal-border-soft)] transition-colors hover:bg-[var(--portal-surface-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0985E7]"
            >
              <NotificationsNoneOutlinedIcon sx={{ fontSize: 20, color: 'var(--portal-navy)' }} />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#0985E7] px-1 text-[10px] font-black leading-none text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {notificationMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 overflow-hidden rounded-2xl border border-[var(--portal-border-soft)] bg-white shadow-[0_16px_40px_rgba(12,43,73,0.14)]">
                <div className="flex items-center justify-between border-b border-[var(--portal-border-soft)] px-4 py-3">
                  <p className="text-sm font-black text-[var(--portal-navy)]">Notifications</p>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-[#EAF4FF] px-2 py-0.5 text-[11px] font-black text-[#0985E7]">{unreadCount} unread</span>
                  )}
                </div>
                <ul className="max-h-96 overflow-y-auto">
                  {unreadNotifications.length === 0 ? (
                    <li className="px-4 py-6 text-center text-sm font-semibold text-[var(--portal-text-muted)]">No unread notifications</li>
                  ) : (
                    unreadNotifications.map((n) => (
                      <li key={n.id} className="border-b border-[var(--portal-border-soft)] last:border-b-0">
                        <button
                          type="button"
                          onClick={onMarkAllRead}
                          className="block w-full px-4 py-3 text-left transition hover:bg-[var(--portal-surface-soft)]"
                        >
                          <p className="truncate text-sm font-black text-[var(--portal-navy)]">{n.title}</p>
                          <p className="mt-0.5 line-clamp-2 text-xs font-medium text-[var(--portal-text-muted)]">{n.body}</p>
                          <p className="mt-1 text-[11px] font-semibold text-[var(--portal-text-muted)]">{formatDate(n.created_at)}</p>
                        </button>
                      </li>
                    ))
                  )}
                </ul>
                <Link
                  href="/portal/notifications"
                  onClick={() => setNotificationMenuOpen(false)}
                  className="block w-full border-t border-[var(--portal-border-soft)] bg-[var(--portal-surface-soft)] px-4 py-3 text-center text-sm font-black text-[#0985E7] transition hover:bg-[#EAF4FF]"
                >
                  See more…
                </Link>
              </div>
            )}
          </div>
          <a
            href="mailto:support@lexchain.app"
            aria-label="Get help"
            className="hidden h-10 w-10 items-center justify-center rounded-full border border-[var(--portal-border-soft)] transition-colors hover:bg-[var(--portal-surface-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0985E7] sm:flex"
          >
            <span aria-hidden="true" className="text-base font-black leading-none text-[var(--portal-navy)]">?</span>
          </a>
          <div ref={profileMenuRef} className="relative">            <button
              type="button"
              onClick={() => setProfileMenuOpen((open) => !open)}
              aria-label="Open profile menu"
              aria-expanded={profileMenuOpen}
              className="flex items-center gap-2 rounded-full p-1 transition hover:bg-[var(--portal-surface-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0985E7]"
            >
              <span className="hidden min-w-0 text-right lg:block">
                <span className="block truncate text-sm font-black text-[var(--portal-navy)]">{fullName}</span>
                <span className="block truncate text-xs font-semibold text-[var(--portal-text-muted)]">{roleLabel}</span>
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--portal-surface-soft)] text-xs font-bold text-[var(--portal-primary)]">
                {initials}
              </span>
            </button>

            {profileMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-2xl border border-[var(--portal-border-soft)] bg-white shadow-[0_16px_40px_rgba(12,43,73,0.14)]">
                <div className="border-b border-[var(--portal-border-soft)] px-4 py-3">
                  <p className="truncate text-sm font-black text-[var(--portal-navy)]">{fullName}</p>
                  <p className="truncate text-xs font-semibold text-[var(--portal-text-muted)]">{roleLabel}</p>
                </div>
                <Link
                  href="/portal/profile"
                  onClick={() => setProfileMenuOpen(false)}
                  className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left text-sm font-bold text-[var(--portal-navy)] transition hover:bg-[var(--portal-surface-soft)]"
                >
                  <SettingsIcon fontSize="small" className="text-[var(--portal-text-muted)]" />
                  Profile
                </Link>
                <button
                  type="button"
                  onClick={onSignOut}
                  className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left text-sm font-bold text-red-600 transition hover:bg-red-50"
                >
                  <LogoutIcon fontSize="small" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
