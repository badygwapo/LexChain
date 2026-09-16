'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ApiSchema } from '@/shared/types/index';
import { GeneratedReportsManagementView } from "@/features/admin/generated-reports";
import { PortalDropdown } from "@/features/portal/components";
import {
  createDemoReport,
  downloadDemoReport,
  type DemoReport,
  type DemoReportType,
  type PortalReportDocument,
} from '@/features/office/office-insight';
import { portalFetch } from '@/shared/api/client';
import { getPortalUiRole } from "@/features/access";

type UserProfile = ApiSchema<'UserProfileResponse'>;
type ReportScope = 'document' | 'system';

const reportOptions = [
  {
    type: 'office-document-activity',
    label: 'Document Activity',
    description: 'Documents in your office workspace during the selected dates.',
  },
  {
    type: 'office-integrity',
    label: 'Integrity',
    description: 'Seeded verification outcomes recorded during the selected dates.',
  },
] satisfies Array<{ type: DemoReportType; label: string; description: string }>;

const reportLabels: Record<DemoReportType, string> = {
  'office-document-activity': 'Document Activity',
  'office-integrity': 'Integrity',
  'system-users': 'System Users',
  'system-audit': 'System Audit',
};

const reportScopeOptions = [
  { label: 'Document reports', value: 'document' },
  { label: 'System reports', value: 'system' },
];

export default function OfficeReportsPage() {
  const [scope, setScope] = useState<ReportScope>('document');
  const profileQuery = useQuery({
    queryKey: ['portal-profile'],
    queryFn: () => portalFetch<UserProfile | null>('/users/'),
  });
  const isIssuer = getPortalUiRole(profileQuery.data?.role) === 'lawyer';
  const documentsQuery = useQuery<PortalReportDocument[]>({
    queryKey: ['portal-documents'],
    queryFn: () => portalFetch('/documents/'),
    enabled: isIssuer && scope === 'document',
  });
  const [reportType, setReportType] = useState<DemoReportType>('office-document-activity');
  const [from, setFrom] = useState('2026-07-01');
  const [to, setTo] = useState('2026-07-31');
  const [report, setReport] = useState<DemoReport | null>(null);
  const [error, setError] = useState('');

  if (profileQuery.isLoading) return <div className="h-36 animate-pulse rounded-[18px] border border-[#E8F0F8] bg-white" />;

  if (!isIssuer) {
    return <p className="text-sm font-semibold text-[#64748b]">Reports are available to Lawyers only.</p>;
  }

  if (scope === 'document' && documentsQuery.isLoading) {
    return <div role="status" className="h-36 animate-pulse rounded-[18px] border border-[#E8F0F8] bg-white"><span className="sr-only">Loading office report data…</span></div>;
  }

  function generateReport() {
    try {
      setReport(createDemoReport(reportType, from, to, documentsQuery.data ?? []));
      setError('');
    } catch (caught) {
      setReport(null);
      setError(caught instanceof Error ? caught.message : 'Could not generate this demo report.');
    }
  }

  const reportLabel = report ? reportLabels[report.reportType] : '';
  const scopeSelector = (
    <label className="block text-sm font-black text-[#0C2B49]">
      Report scope
      <PortalDropdown
        ariaLabel="Report scope"
        value={scope}
        onChange={(value) => setScope(value as ReportScope)}
        options={reportScopeOptions}
      />
    </label>
  );

  return (
    <div className="flex w-full flex-col gap-5 xl:min-h-[calc(100dvh-113px)]">
      <header className="shrink-0">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#0879D8]">LexChain Operations</p>
        <h1 className="mt-1 text-3xl font-black leading-tight text-[#071B33]">Reports</h1>
        <p className="mt-1 text-sm font-semibold text-[#4B6382]">Choose document or system reports, then generate a local CSV preview.</p>
      </header>

      {scope === 'system' ? (
        <section aria-label="Report controls" className="rounded-2xl border border-[#E4EEF9] bg-white p-5 shadow-sm shadow-[#DDEAF7]/35">
          {scopeSelector}
          <GeneratedReportsManagementView embedded />
        </section>
      ) : <>
      {documentsQuery.isError ? (
        <p role="alert" className="rounded-[18px] border border-[#F5C6C6] bg-[#FFF7F7] p-5 text-sm font-semibold text-[#9B2C2C]">
          We could not load office report data.
        </p>
      ) : null}

      <section aria-label="Report controls" className="rounded-2xl border border-[#E4EEF9] bg-white p-5 shadow-sm shadow-[#DDEAF7]/35">
        <div className="grid gap-3 sm:grid-cols-2">
          {scopeSelector}
          <label className="block text-sm font-black text-[#0C2B49]">
            Report type
            <PortalDropdown
              ariaLabel="Report type"
              value={reportType}
              onChange={(value) => setReportType(value as DemoReportType)}
              options={reportOptions.map((option) => ({ label: option.label, value: option.type }))}
            />
          </label>
        </div>
        <div aria-label="Report dates" className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="text-sm font-black text-[#0C2B49]">
          From
          <input required type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="mt-2 block w-full rounded-xl border border-[#D9E5F0] px-3 py-2.5 font-semibold" />
        </label>
        <label className="text-sm font-black text-[#0C2B49]">
          To
          <input required type="date" value={to} onChange={(event) => setTo(event.target.value)} className="mt-2 block w-full rounded-xl border border-[#D9E5F0] px-3 py-2.5 font-semibold" />
        </label>
        <button type="button" onClick={generateReport} className="rounded-xl bg-[#0985E7] px-5 py-3 text-sm font-black text-white hover:bg-[#0770C4]">Generate</button>
        </div>
      </section>

      {error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</p> : null}

      {report ? (
        <section aria-label={`${reportLabel} report`} className="overflow-hidden rounded-2xl border border-[#E4EEF9] bg-white shadow-sm shadow-[#DDEAF7]/35">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.1em] text-[#0985E7]">{report.from} to {report.to}</p>
              <h2 className="mt-1 text-xl font-black text-[#0C2B49]">{reportLabel}</h2>
            </div>
            <button type="button" onClick={() => downloadDemoReport(report)} className="rounded-xl border border-[#D9E5F0] px-4 py-2.5 text-sm font-black text-[#0C2B49] hover:border-[#0985E7]">Download CSV</button>
          </div>

          <p className="mt-4 rounded-xl bg-[#F8FBFF] px-3 py-2 text-xs font-bold text-[#64748b]">Demo report — generated locally from seeded data and not stored.</p>

          {report.rows.length ? (
            <div className="mt-4 overflow-x-auto">
              <table aria-label={`${reportLabel} preview`} className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#D9E5F0] bg-[#F8FBFF]">
                    {report.columns.map((column) => <th key={column} className="px-3 py-2.5 font-black text-[#0C2B49]">{column}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {report.rows.slice(0, 5).map((row, index) => (
                    <tr key={index} className="border-b border-[#EEF4F8]">
                      {report.columns.map((column) => <td key={column} className="px-3 py-2.5 font-semibold text-[#64748b]">{String(row[column] ?? '')}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="mt-4 text-sm font-semibold text-[#64748b]">No seeded rows fall within this date range.</p>}
        </section>
      ) : null}
      </>}
    </div>
  );
}
