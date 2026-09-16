'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import PeopleIcon from '@mui/icons-material/People';
import GavelIcon from '@mui/icons-material/Gavel';
import DescriptionIcon from '@mui/icons-material/Description';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ErrorIcon from '@mui/icons-material/Error';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import type { ApiSchema } from '@/shared/types/index';
import { MetricCard } from '@/features/portal/components/portal-metric-card';
import { getDocumentStatusLabel } from "@/features/documents";
import { type DashboardMetric, getDashboardMetrics } from '@/features/portal/portal-dashboard';
import { getPortalUiRole } from "@/features/access";

interface Document {
  id: string;
  file_name: string;
  status: string;
  on_chain?: boolean | null;
  created_at: string;
}

type UserProfile = ApiSchema<'UserProfileResponse'>;

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`/api/portal/proxy?path=${encodeURIComponent(path)}`, { credentials: 'same-origin' });
  if (!response.ok) throw new Error('Unable to load documents');
  return response.json();
}

const cardClass = 'rounded-[18px] border border-[#E8F0F8] bg-white shadow-[0_4px_12px_rgba(19,59,115,0.05)]';

function getStatusTone(status: string) {
  const value = status?.trim().toUpperCase();
  if (value === 'COMPLETED' || value === 'ANCHORED') return 'bg-[#EAF8F0] text-[#12A150]';
  if (value === 'PROCESSING' || value === 'PENDING') return 'bg-[#FFF4DD] text-[#B77900]';
  if (value === 'FAILED') return 'bg-[#FFF0F0] text-[#C24141]';
  return 'bg-[#EAF4FF] text-[#1689F5]';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isProcessing(document: Document) {
  const status = document.status?.trim().toUpperCase();
  return status === 'PROCESSING' || status === 'PENDING';
}

function isAttentionDocument(document: Document) {
  return document.status?.trim().toUpperCase() === 'FAILED';
}

type AdminDashboardData = {
  total_users: number;
  total_documents: number;
  total_processed: number;
  total_failed: number;
  total_on_chain: number;
  pending_invitations: number;
};

function getMetricIcon(label: string) {
  if (label === 'Total Users') return PeopleIcon;
  if (label === 'Total Lawyers') return GavelIcon;
  if (label === 'Total Documents') return DescriptionIcon;
  if (label === 'Processing') return ScheduleIcon;
  if (label === 'Failed') return ErrorIcon;
  if (label === 'On-Chain Records') return VerifiedUserIcon;
  if (label === 'Pending Invitations') return EmailOutlinedIcon;
  return DescriptionIcon;
}

function getMetricColor(label: string) {
  if (label === 'Total Users') return 'bg-[#EAF3FF] text-[#0879D8]';
  if (label === 'Total Documents') return 'bg-[#EAF3FF] text-[#0879D8]';
  if (label === 'Processing') return 'bg-[#FFF4DF] text-[#F59E0B]';
  if (label === 'Failed' || label === 'Failed Documents') return 'bg-[#FEECEC] text-[#EF4444]';
  if (label === 'On-Chain Records') return 'bg-[#EAFBF1] text-[#16A34A]';
  if (label === 'Pending Invitations') return 'bg-[#EAF3FF] text-[#0879D8]';
  return 'bg-[#EAF3FF] text-[#0879D8]';
}

function getMetricDetail(label: string) {
  if (label === 'Total Users') return 'Registered accounts';
  if (label === 'Total Documents') return 'Uploaded documents';
  if (label === 'Processing') return 'status processing';
  if (label === 'Failed' || label === 'Failed Documents') return 'status failed';
  if (label === 'On-Chain Records') return 'anchored records';
  if (label === 'Pending Invitations') return 'awaiting acceptance';
  return '—';
}

export default function DashboardPage() {
  const profileQuery = useQuery({
    queryKey: ['portal-profile'],
    queryFn: () => fetchJson<UserProfile | null>('/users/'),
  });
  const isIssuer = getPortalUiRole(profileQuery.data?.role) === 'lawyer';
  const documentsQuery = useQuery<Document[]>({
    queryKey: ['portal-documents'],
    queryFn: () => fetchJson('/documents/'),
    enabled: isIssuer,
  });
  const adminDashboardQuery = useQuery<AdminDashboardData>({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/admin/dashboard');
      if (!res.ok) throw new Error('Admin dashboard unavailable');
      return res.json();
    },
    enabled: isIssuer,
  });
  if (profileQuery.isLoading) return <div className="h-36 animate-pulse rounded-[18px] border border-[#E8F0F8] bg-white" />;

  if (!isIssuer) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-5">
        <div>
          <h1 className="text-[28px] font-black leading-[34px] text-[#0C2B49]">Document Portal</h1>
          <p className="mt-1 text-sm font-medium text-[#64748b]">Your shared documents at a glance.</p>
        </div>
        <div className={`${cardClass} p-6 text-center`}>
          <p className="text-sm font-bold text-[#0C2B49]">Welcome to the Document Portal</p>
          <p className="mt-1 text-sm text-[#64748b]">Browse shared documents, manage invitations, and request e-copies from the navigation menu.</p>
        </div>
      </div>
    );
  }

  const documents = documentsQuery.data ?? [];
  const recentDocuments = [...documents]
    .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
    .slice(0, 5);
  const attentionDocuments = documents.filter(isAttentionDocument);
  const processingDocuments = documents.filter(isProcessing);
  const adminMetrics = adminDashboardQuery.data;
  const metrics: DashboardMetric[] = adminMetrics
    ? [
        ['Total Users', adminMetrics.total_users],
        ['Total Documents', adminMetrics.total_documents],
        ['Processing', adminMetrics.total_processed],
        ['Failed', adminMetrics.total_failed],
        ['On-Chain Records', adminMetrics.total_on_chain],
        ['Pending Invitations', adminMetrics.pending_invitations],
      ]
    : getDashboardMetrics(documents);

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <div className="shrink-0 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-black leading-[34px] text-[#0C2B49]">Lawyer Portal</h1>
          <p className="mt-1 text-sm font-medium text-[#64748b]">Your document workspace at a glance.</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/portal/upload" className="flex items-center gap-2 rounded-full bg-[#0985E7] px-4 py-2 text-xs font-black text-white transition hover:bg-[#0770c4] sm:px-5 sm:py-2.5 sm:text-sm">
            <FileUploadIcon sx={{ fontSize: 16 }} />
            <span className="hidden sm:inline">Upload Document</span>
          </Link>
        </div>
      </div>

      {documentsQuery.isError && (
        <div role="alert" className={`${cardClass} flex flex-wrap items-center justify-between gap-3 p-5`}>
          <div><p className="text-sm font-bold text-[#0C2B49]">We could not load your document repository.</p><p className="mt-1 text-xs text-[#64748b]">Retry loading it, or open Documents to continue your work.</p></div>
          <div className="flex items-center gap-2"><button type="button" onClick={() => void documentsQuery.refetch()} className="rounded-full border border-[#D7E4F2] px-4 py-2 text-sm font-black text-[#0985E7]">Retry</button><Link href="/portal/documents" className="rounded-full bg-[#0985E7] px-4 py-2 text-sm font-black text-white">View Documents</Link></div>
        </div>
      )}

      {!adminMetrics && adminDashboardQuery.isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <div key={i} className={`${cardClass} h-24 animate-pulse sm:h-28`} />)}</div>
      ) : (
        <div className="shrink-0 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
          {metrics.map(([label, value]) => {
            const Icon = getMetricIcon(label);
            return <MetricCard key={label} icon={<Icon fontSize="small" />} label={label} value={value} detail={getMetricDetail(label)} color={getMetricColor(label)} />;
          })}
        </div>
      )}

      <div className="grid min-h-0 flex-1 gap-5 overflow-hidden md:grid-cols-[minmax(0,1fr)_360px]">
        <section className={`${cardClass} flex min-h-0 flex-col p-5`}>
          <div className="mb-4 flex shrink-0 items-center justify-between"><h2 className="text-base font-black text-[#0C2B49]">Recent documents</h2><Link href="/portal/documents" className="text-xs font-black text-[#0985E7]">View Documents</Link></div>
          {documentsQuery.isLoading ? <p className="py-4 text-center text-sm text-[#64748b]">Loading recent documents…</p> : documentsQuery.isError ? <p className="py-4 text-center text-sm text-[#64748b]">Recent documents will be available once the repository loads.</p> : recentDocuments.length === 0 ? <div className="py-4 text-center"><p className="text-sm font-bold text-[#0C2B49]">No documents yet</p><p className="mt-1 text-xs text-[#64748b]">Upload a document to start your repository.</p><Link href="/portal/upload" className="mt-4 inline-flex rounded-full bg-[#0985E7] px-4 py-2 text-sm font-black text-white">Upload Document</Link></div> : <div className="admin-table-scroll min-h-0 flex-1 overflow-y-auto"><div className="flex flex-col divide-y divide-[#E8F0F8]">{recentDocuments.map((document) => <DocumentLink key={document.id} document={document} />)}</div></div>}
        </section>

        <div className="flex min-h-0 flex-col gap-5">
          <section className={`${cardClass} flex min-h-0 flex-1 flex-col p-5`}>
            <h2 className="mb-3 shrink-0 text-base font-black text-[#0C2B49]">Documents needing attention</h2>
            {documentsQuery.isLoading ? <p className="text-sm text-[#64748b]">Checking document statuses…</p> : documentsQuery.isError ? <p className="text-sm text-[#64748b]">Attention status is unavailable.</p> : attentionDocuments.length === 0 ? <p className="text-sm text-[#64748b]">No action required. All documents are progressing normally.</p> : <div className="table-scroll-thin min-h-0 flex-1 overflow-y-auto"><div className="flex flex-col divide-y divide-[#E8F0F8]">{attentionDocuments.slice(0, 3).map((document) => <DocumentLink document={document} key={document.id} />)}</div></div>}
          </section>

          <section className={`${cardClass} flex min-h-0 flex-1 flex-col p-5`}>
            <h2 className="mb-3 shrink-0 text-base font-black text-[#0C2B49]">Processing</h2>
            {documentsQuery.isLoading ? <p className="text-sm text-[#64748b]">Checking processing documents…</p> : documentsQuery.isError ? <p className="text-sm text-[#64748b]">Processing status is unavailable.</p> : processingDocuments.length === 0 ? <p className="text-sm text-[#64748b]">No documents are processing right now.</p> : <div className="admin-table-scroll min-h-0 flex-1 overflow-y-auto"><div className="flex flex-col divide-y divide-[#E8F0F8]">{processingDocuments.slice(0, 3).map((document) => <DocumentLink document={document} key={document.id} />)}</div></div>}
          </section>
        </div>
      </div>
    </div>
  );
}

function DocumentLink({ document }: { document: Document }) {
  return <Link href={`/portal/documents/${document.id}`} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0 transition hover:bg-[#F8FBFF]">
    <div className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-xl bg-[#EEF6FF]"><DescriptionIcon sx={{ fontSize: 20, color: '#0985E7' }} /></div>
    <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="truncate text-sm font-bold text-[#0C2B49]">{document.file_name}</span><span className={`${getStatusTone(document.status)} shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold`}>{getDocumentStatusLabel(document.status)}</span></div><p className="mt-1 text-[11px] font-bold text-[#A0AAB8]">{formatDate(document.created_at)}</p></div>
    <ChevronRightIcon sx={{ fontSize: 20, color: '#A0AAB8' }} />
  </Link>;
}
