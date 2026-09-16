'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import type { ApiSchema } from '@/shared/types/index';

type UserProfile = ApiSchema<'UserProfileResponse'>;

async function fetchProfile(): Promise<UserProfile> {
  const res = await fetch('/api/portal/proxy?path=%2Fusers%2F', { credentials: 'same-origin' });
  if (!res.ok) throw new Error('Failed to load profile');
  return res.json();
}

export default function AccountPage() {
  const { data: user, isLoading, isError } = useQuery({ queryKey: ['portal-profile'], queryFn: fetchProfile });

  const rows = [
    ['First Name', user?.f_name ?? '...'],
    ['Last Name', user?.l_name ?? '...'],
    ['Email', user?.email ?? '...'],
    ['Role', user?.role?.replace('_', ' ') ?? '...'],
    ['Avatar', user?.avatar ?? 'Default'],
  ];

  return (
    <div className="flex flex-col gap-5">
      <Link href="/portal/profile" className="flex w-fit items-center gap-1.5 text-sm font-bold text-[#0985E7]">
        <ArrowBackIcon sx={{ fontSize: 16 }} /> Back
      </Link>
      <div>
        <h1 className="text-[28px] font-black text-[#0C2B49]">Account Details</h1>
        <p className="mt-1 text-sm text-[#64748b]">Profile editing is not available in the current backend contract.</p>
      </div>

      <div className="divide-y divide-[#E8F0F8] rounded-[18px] border border-[#E8F0F8] bg-white shadow-[0_4px_12px_rgba(19,59,115,0.05)]">
        {isError ? (
          <div className="px-5 py-4">
            <p className="text-sm font-bold text-red-500">Failed to load account details.</p>
          </div>
        ) : rows.map(([label, value]) => (
          <div key={label} className="px-5 py-4">
            <span className="text-[11px] font-bold uppercase tracking-wide text-[#64748b]">{label}</span>
            {isLoading ? (
              <div className="mt-2 h-4 w-40 animate-pulse rounded bg-[#F5FAFF]" />
            ) : (
              <p className="mt-1 text-sm font-bold capitalize text-[#0C2B49]">{value}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
