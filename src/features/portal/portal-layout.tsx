"use client";

import '@/features/portal/portal.css';
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import { Toaster } from 'sonner';
import type { ApiSchema } from "@/shared/types/index";
import { getPortalLoginRedirect, getPortalRoleLabel, getPortalUiRole, isSupportedPortalUiRole } from "@/features/access";
import { getPortalNavigation } from "@/features/portal/portal-dashboard";
import { getPortalNavigationIcon, isPortalRouteActive } from "@/features/access/components";
import { PortalBottomNav } from "@/features/portal/components/portal-bottom-nav";
import { PortalTopBar } from "@/features/portal/components/portal-topbar";

type UserProfile = ApiSchema<'UserProfileResponse'>;
type PortalDocument = { status?: string | null };
type PortalNotification = { id: string; title: string; body: string; is_read: boolean; created_at: string };

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [collapsed, setCollapsed] = useState(false);
  const { data: profile, isError, isPending } = useQuery<UserProfile | null>({
    queryKey: ['portal-profile'],
    queryFn: async () => {
      const res = await fetch('/api/portal/proxy?path=%2Fusers%2F', { credentials: 'same-origin' });
      return res.ok ? res.json() : null;
    },
  });
  const { data: documents = [] } = useQuery<PortalDocument[]>({
    queryKey: ['portal-shell-documents'],
    queryFn: async () => {
      const res = await fetch('/api/portal/proxy?path=%2Fdocuments%2F', { credentials: 'same-origin' });
      return res.ok ? res.json() : [];
    },
    enabled: Boolean(profile),
  });
  const { data: unreadData } = useQuery<number | { unread: number }>({
    queryKey: ['portal-notif-count'],
    queryFn: async () => {
      const res = await fetch('/api/portal/proxy?path=%2Fnotifications%2Funread-count', { credentials: 'same-origin' });
      if (!res.ok) return 0;
      const body = await res.json();
      return typeof body === 'number' ? body : (body.unread ?? 0);
    },
    enabled: Boolean(profile),
  });
  const unreadCount = typeof unreadData === 'number' ? unreadData : (unreadData?.unread ?? 0);
  const { data: notifications = [] } = useQuery<PortalNotification[]>({
    queryKey: ['portal-shell-notifications'],
    queryFn: async () => {
      const res = await fetch('/api/portal/proxy?path=%2Fnotifications%2F', { credentials: 'same-origin' });
      if (!res.ok) return [];
      const body = await res.json();
      return body.notifications ?? [];
    },
    enabled: Boolean(profile),
  });

  const uiRole = getPortalUiRole(profile?.role);
  const roleLabel = getPortalRoleLabel(profile?.role);
  const portalNavigationGroups = isSupportedPortalUiRole(uiRole)
    ? getPortalNavigation(uiRole)
    : [];
  const initials = `${profile?.f_name?.[0] ?? ''}${profile?.l_name?.[0] ?? ''}`.toUpperCase() || '?';
  const fullName = profile ? `${profile.f_name} ${profile.l_name}` : '...';
  const portalHome = getPortalLoginRedirect(profile?.role) ?? "/portal/dashboard";
  const processingCount = documents.filter((document) => {
    const status = document.status?.trim().toLowerCase();
    return status === "processing" || status === "pending";
  }).length;

  async function handleLogout() {
    await fetch("/api/portal/logout", { method: "POST" });
    window.location.href = "/login";
  }

  async function markAllNotificationsRead() {
    await fetch("/api/portal/proxy-post?path=%2Fnotifications%2Fread-all", {
      method: "PATCH",
      credentials: "same-origin",
    });
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["portal-shell-notifications"] }),
      queryClient.invalidateQueries({ queryKey: ["portal-notif-count"] }),
      queryClient.invalidateQueries({ queryKey: ["portal-notifications"] }),
    ]);
  }

  if (isPending) {
    return (
      <main className="min-h-screen bg-[#F5FAFF] text-[#111827]" role="status" aria-label="Loading portal">
        <div className="flex min-h-screen">
          <aside className="hidden w-[260px] shrink-0 flex-col gap-7 border-r border-[#E8F0F8] bg-white px-[22px] pb-[22px] pt-[26px] md:flex">
            <div className="flex min-h-[52px] items-center gap-2">
              <Image src="/lexchain/logo-lexchain.svg" alt="" width={44} height={44} className="rounded-[14px]" />
              <div className="h-7 w-24 animate-pulse rounded bg-[#E8F0F8]" />
            </div>
            <div className="flex flex-1 flex-col gap-4">
              {[0, 1, 2, 3, 4, 5, 6].map((index) => (
                <div key={index} className="h-11 animate-pulse rounded-xl bg-[#EEF4FB]" />
              ))}
            </div>
          </aside>
          <section className="flex min-w-0 flex-1 flex-col overflow-x-clip px-6 pb-24 pt-0 md:pb-6">
            <header className="sticky top-0 z-40 -mx-6 mb-6 border-b border-[#E8F0F8] bg-white px-4 md:px-6">
              <div className="flex min-h-16 items-center gap-3">
                <div className="h-10 flex-1 animate-pulse rounded-xl bg-[#EEF4FB]" />
                <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-[#EEF4FB]" />
                <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-[#EEF4FB]" />
              </div>
            </header>
            <div className="flex flex-col gap-5">
              <div className="h-8 w-56 animate-pulse rounded bg-[#E8F0F8]" />
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <div key={index} className="h-28 animate-pulse rounded-2xl border border-[#E8F0F8] bg-white" />
                ))}
              </div>
              <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_360px]">
                <div className="h-72 animate-pulse rounded-2xl border border-[#E8F0F8] bg-white" />
                <div className="flex flex-col gap-5">
                  <div className="h-36 animate-pulse rounded-2xl border border-[#E8F0F8] bg-white" />
                  <div className="h-36 animate-pulse rounded-2xl border border-[#E8F0F8] bg-white" />
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (isError || !profile || !isSupportedPortalUiRole(uiRole)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F5FAFF] p-6 text-[#0C2B49]">
        <section className="w-full max-w-md rounded-2xl border border-[#E4EEF9] bg-white p-6 text-center shadow-sm">
          <h1 className="text-xl font-black">Portal access unavailable</h1>
          <p className="mt-2 text-sm font-semibold text-[#64748b]">Your account does not have a supported portal role.</p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-5 rounded-full bg-[#0985E7] px-5 py-2.5 text-sm font-black text-white transition hover:bg-[#0770c4]"
          >
            Sign out
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5FAFF] text-[#111827]">
      <div className="flex min-h-screen">
        <a
          href="#portal-content"
          className="sr-only z-[60] rounded-md bg-[#0C2B49] px-4 py-2 text-sm font-bold text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:outline-none"
        >
          Skip to content
        </a>
        {/* Desktop office navigation */}
        <aside className={`relative sticky top-0 hidden h-screen shrink-0 flex-col gap-7 border-r border-[#E8F0F8] bg-white pb-[22px] pt-[26px] transition-all duration-300 md:flex ${collapsed ? "w-[72px] px-3" : "w-[260px] px-[22px]"}`}>
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="absolute -right-3 top-7 z-10 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-[#E8F0F8] bg-white text-[#64748b] shadow-sm transition hover:bg-[#EEF4FB] hover:text-[#0C2B49]"
          >
            {collapsed ? <MenuIcon style={{ fontSize: 14 }} /> : <ChevronLeftIcon style={{ fontSize: 14 }} />}
          </button>

          {/* Logo */}
          <div className="flex min-h-[52px] items-center">
            <Link className="flex items-center gap-0" href={portalHome}>
              <Image src="/lexchain/logo-lexchain.svg" alt="LexChain" width={44} height={44} className="rounded-[14px]" />
              {!collapsed && (
                <div>
                  <p className="text-[25px] font-black leading-8">Lex<span className="text-[#0985E7]">Chain</span></p>
                </div>
              )}
            </Link>
          </div>

          {/* Nav */}
          <nav className="flex flex-1 flex-col gap-4 overflow-y-auto">
            {portalNavigationGroups.map((group) => (
              <section key={group.label} aria-label={group.label}>
                {!collapsed && <p className="px-3 pb-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#A0AAB8]">{group.label}</p>}
                <div className="flex flex-col gap-0.5">
                  {group.items.map((link) => {
                    const isActive = isPortalRouteActive(pathname, link);
                    const Icon = getPortalNavigationIcon(link);
                    return (
                      <Link
                        className={[
                          "flex min-h-11 items-center gap-3.5 rounded-xl py-2 text-[13px] font-black leading-4",
                          collapsed ? "justify-center px-2" : "pl-[22px] pr-3",
                          isActive
                            ? "bg-[#EEF4FB] text-[#111827]"
                            : "text-[#111827] transition hover:bg-[#F5FAFF]",
                        ].join(" ")}
                        href={link.href}
                        key={link.href}
                        aria-current={isActive ? "page" : undefined}
                        aria-label={link.label}
                        title={collapsed ? link.label : undefined}
                      >
                        <span className={isActive ? "text-[#0985E7]" : "text-[#64748b]"}>
                          <Icon fontSize="small" />
                        </span>
                        {!collapsed && <span className="flex-1">{link.label}</span>}
                        {!collapsed && (
                          <span className={["h-6 w-[5px] rounded-full", isActive ? "bg-[#0985E7]" : "bg-transparent"].join(" ")} />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <section id="portal-content" tabIndex={-1} className="flex min-w-0 flex-1 flex-col overflow-x-clip px-6 pb-24 pt-0 md:pb-6">
          <PortalTopBar
            fullName={fullName}
            initials={initials}
            roleLabel={roleLabel}
            role={uiRole}
            processingCount={processingCount}
            unreadCount={unreadCount}
            notifications={notifications}
            onMarkAllRead={markAllNotificationsRead}
            onSignOut={handleLogout}
          />
          {children}
        </section>
      </div>
      {isSupportedPortalUiRole(uiRole) ? (
        <PortalBottomNav pathname={pathname} role={uiRole} />
      ) : null}
      <Toaster position="top-center" richColors />
    </main>
  );
}
