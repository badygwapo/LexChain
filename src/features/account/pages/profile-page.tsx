'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import PolicyIcon from '@mui/icons-material/Policy';
import HelpOutlineIcon from '@mui/icons-material/HelpOutlineOutlined';
import RequestPageIcon from '@mui/icons-material/RequestPage';
import type { ApiSchema } from '@/shared/types/index';
import { getPortalProfileRequestShortcut, getPortalRoleLabel, getPortalUiRole } from "@/features/access";

type UserProfile = ApiSchema<'UserProfileResponse'>;

const sharedSettingsItems = [
  { label: 'Account details', description: 'Update your profile and legal contact info', href: '/portal/profile/account', icon: PersonIcon },
  { label: 'Security', description: 'Password and login settings', href: '/portal/profile/security', icon: LockIcon },
  { label: 'Notifications', description: 'Manage notification preferences', href: '/portal/notifications', icon: NotificationsNoneIcon },
  { label: 'Privacy policy', description: 'Review how document and account data is handled', href: '/privacy', icon: PolicyIcon },
  { label: 'Help and support', description: 'Get help with access or verification issues', href: 'mailto:support@lexchain.app', icon: HelpOutlineIcon },
];

async function fetchProfile(): Promise<UserProfile> {
  const res = await fetch('/api/portal/proxy?path=%2Fusers%2F', { credentials: 'same-origin' });
  if (!res.ok) throw new Error('Failed to load profile');
  return res.json();
}

function initialsFor(user?: UserProfile) {
  const first = user?.f_name?.[0] ?? '';
  const last = user?.l_name?.[0] ?? '';
  return `${first}${last}`.toUpperCase() || '?';
}

export default function ProfilePage() {
  const { data: user, isLoading } = useQuery({ queryKey: ['portal-profile'], queryFn: fetchProfile });

  const handleLogout = async () => {
    await fetch('/api/portal/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  const fullName = user ? `${user.f_name} ${user.l_name}` : 'Loading...';
  const uiRole = getPortalUiRole(user?.role);
  const roleLabel = getPortalRoleLabel(user?.role);
  const requestShortcut = getPortalProfileRequestShortcut(uiRole);
  const requestItem = requestShortcut
    ? {
      ...requestShortcut,
      description: uiRole === 'lawyer' ? 'Review participant e-copy requests' : 'Track requests sent to your Lawyer',
      icon: RequestPageIcon,
    }
    : undefined;
  const settingsItems = [
    sharedSettingsItems[0],
    sharedSettingsItems[2],
    ...(requestItem ? [requestItem] : []),
    sharedSettingsItems[1],
    sharedSettingsItems[3],
    sharedSettingsItems[4],
  ];

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-[28px] font-black text-[#0C2B49]">Profile</h1>

      <div className="flex items-center gap-5 rounded-[18px] border border-[#E8F0F8] bg-white p-6 shadow-[0_4px_12px_rgba(19,59,115,0.05)]">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#0985E7] text-xl font-black text-white">
          {isLoading ? '?' : initialsFor(user)}
        </div>
        <div className="min-w-0 flex-1">
          {isLoading ? (
            <div className="flex flex-col gap-2">
              <div className="h-5 w-36 animate-pulse rounded bg-[#F5FAFF]" />
              <div className="h-4 w-52 animate-pulse rounded bg-[#F5FAFF]" />
            </div>
          ) : (
            <>
              <h2 className="truncate text-lg font-black text-[#0C2B49]">{fullName}</h2>
              <p className="truncate text-sm text-[#64748b]">{user?.email}</p>
            </>
          )}
        </div>
        <span className="shrink-0 rounded-full bg-[#EEF4FB] px-3.5 py-1.5 text-xs font-bold text-[#0985E7]">
          {isLoading ? '...' : roleLabel}
        </span>
      </div>

      <div className="divide-y divide-[#E8F0F8] rounded-[18px] border border-[#E8F0F8] bg-white shadow-[0_4px_12px_rgba(19,59,115,0.05)]">
        {settingsItems.map((item) => (
          <Link key={item.label} href={item.href} className="flex items-center gap-4 px-5 py-4 transition hover:bg-[#F8FBFF]">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EEF6FF]">
              <item.icon sx={{ fontSize: 18, color: '#0985E7' }} />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-[#0C2B49]">{item.label}</span>
              <span className="text-[11px] text-[#64748b]">{item.description}</span>
            </div>
            <ChevronRightIcon sx={{ fontSize: 18, color: '#A0AAB8' }} />
          </Link>
        ))}
      </div>

      <button
        onClick={handleLogout}
        className="flex w-full items-center justify-center gap-2 rounded-[18px] border border-red-200 bg-white px-4 py-3.5 text-sm font-bold text-red-500 transition hover:bg-red-50"
      >
        <LogoutIcon sx={{ fontSize: 18 }} />
        Sign out
      </button>
    </div>
  );
}
