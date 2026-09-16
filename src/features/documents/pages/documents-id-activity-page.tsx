'use client';

import { use, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HistoryIcon from '@mui/icons-material/History';
import type { ApiSchema } from '@/shared/types/index';
import { listDocumentAuditLogs, type PortalAuditLog, getPortalUiRole } from "@/features/access";
import { formatAuditEvent } from '@/features/documents/activity-log';
import { canLoadDocumentActivity } from '@/features/documents/document-activity-access';

type DocumentResponse = ApiSchema<'DocumentResponse'>;
type UserProfile = ApiSchema<'UserProfileResponse'>;

async function getDocument(documentId: string): Promise<DocumentResponse> {
  const response = await fetch(`/api/portal/proxy?path=${encodeURIComponent(`/documents/${documentId}`)}`, {
    credentials: 'same-origin',
  });
  if (!response.ok) throw new Error('Unable to load document');
  return response.json() as Promise<DocumentResponse>;
}

async function getProfile(): Promise<UserProfile | null> {
  const response = await fetch('/api/portal/proxy?path=%2Fusers%2F', { credentials: 'same-origin' });
  return response.ok ? response.json() as Promise<UserProfile> : null;
}

function formatTime(value: string) {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getResult(details: PortalAuditLog['details']): string {
  if (!details || typeof details !== 'object') return '—';
  const result = details.result ?? details.status;
  return typeof result === 'string' || typeof result === 'number' || typeof result === 'boolean'
    ? String(result)
    : '—';
}

export default function DocumentActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [eventFilter, setEventFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const profileQuery = useQuery({ queryKey: ['portal-profile'], queryFn: getProfile });
  const canLoadActivity = canLoadDocumentActivity(profileQuery.data?.role);
  const documentQuery = useQuery({
    queryKey: ['portal-document', id],
    queryFn: () => getDocument(id),
    enabled: canLoadActivity,
  });
  const auditQuery = useQuery({
    queryKey: ['portal-document-audit', id],
    queryFn: () => listDocumentAuditLogs(id),
    enabled: canLoadActivity,
  });
  const role = getPortalUiRole(profileQuery.data?.role);
  const logs = auditQuery.data ?? [];
  const eventOptions = Array.from(new Set(logs.map((log) => log.action))).sort();
  const filteredLogs = logs.filter((log) =>
    (!eventFilter || log.action === eventFilter) && (!dateFilter || log.created_at.startsWith(dateFilter)),
  );

  if (profileQuery.isPending) return <div className="h-40 animate-pulse rounded-[18px] border border-[#E8F0F8] bg-white" />;
  if (role !== 'lawyer') return <p className="text-sm font-semibold text-[#64748b]">Document activity is available to Lawyers only.</p>;

  return (
    <div className="flex w-full min-w-0 flex-col gap-5 overflow-x-hidden">
      <div>
        <Link href={`/portal/documents/${id}`} className="flex w-fit items-center gap-1.5 text-sm font-bold text-[#0985E7]">
          <ArrowBackIcon sx={{ fontSize: 16 }} /> Back to document
        </Link>
        <div className="mt-3 flex items-center gap-2">
          <HistoryIcon sx={{ fontSize: 22, color: '#0985E7' }} />
          <h1 className="text-2xl font-extrabold text-[#0C2B49]">Document activity</h1>
        </div>
        <p className="mt-1 text-sm font-medium text-[#64748b]">Read-only audit history for {documentQuery.data?.file_name ?? id}.</p>
      </div>

      <section className="rounded-[18px] border border-[#E8F0F8] bg-white p-5 shadow-[0_4px_12px_rgba(19,59,115,0.05)]">
        <div className="mb-5 flex flex-wrap gap-3">
          {eventOptions.length > 0 && <label className="flex flex-col gap-1 text-xs font-bold text-[#64748b]">Event
            <select value={eventFilter} onChange={(event) => setEventFilter(event.target.value)} className="rounded-lg border border-[#D6E3F1] bg-white px-3 py-2 text-sm font-medium text-[#0C2B49]">
              <option value="">All events</option>
              {eventOptions.map((event) => <option key={event} value={event}>{formatAuditEvent(event)}</option>)}
            </select>
          </label>}
          <label className="flex flex-col gap-1 text-xs font-bold text-[#64748b]">Date
            <input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} className="rounded-lg border border-[#D6E3F1] bg-white px-3 py-2 text-sm font-medium text-[#0C2B49]" />
          </label>
        </div>

        {auditQuery.isLoading && <p className="text-sm font-medium text-[#64748b]">Loading activity…</p>}
        {auditQuery.isError && <p className="text-sm font-medium text-[#B42318]">Unable to load document activity.</p>}
        {!auditQuery.isLoading && !auditQuery.isError && filteredLogs.length === 0 && <p className="text-sm font-medium text-[#64748b]">No audit events match the selected filters.</p>}
        {!auditQuery.isLoading && !auditQuery.isError && filteredLogs.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-[#E8F0F8] text-xs uppercase tracking-wide text-[#64748b]">
                <tr><th className="px-3 py-3">Actor</th><th className="px-3 py-3">Event</th><th className="px-3 py-3">Time</th><th className="px-3 py-3">Document</th><th className="px-3 py-3">Result</th></tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => <tr key={log.id} className="border-b border-[#F0F5FA] last:border-0">
                  <td className="px-3 py-3 font-medium text-[#0C2B49]">{log.user_id ?? 'System'}</td>
                  <td className="px-3 py-3 text-[#0C2B49]">{formatAuditEvent(log.action)}</td>
                  <td className="px-3 py-3 text-[#64748b]">{formatTime(log.created_at)}</td>
                  <td className="px-3 py-3 text-[#64748b]">{documentQuery.data?.file_name ?? log.document_id}</td>
                  <td className="px-3 py-3 text-[#64748b]">{getResult(log.details)}</td>
                </tr>)}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
