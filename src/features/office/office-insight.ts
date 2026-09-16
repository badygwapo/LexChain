import {
  adminAuditLogs,
  adminUsers,
} from '@/features/admin/admin-demo-data';
import type { ApiSchema } from '@/shared/types/index';

export type OfficeDateRange = {
  id: '7-days' | '30-days' | '90-days';
  label: string;
};

export type OfficeInsightMetric = {
  label: string;
  value: number;
};

export type PortalDocument = Pick<
  ApiSchema<'DocumentResponse'>,
  'created_at' | 'on_chain'
> & {
  integrity_state?: 'match' | 'mismatch' | 'not-recorded' | 'unavailable' | null;
};

export type PortalReportDocument = Pick<
  ApiSchema<'DocumentResponse'>,
  'document_id' | 'file_name' | 'status' | 'created_at' | 'on_chain'
> & Partial<Pick<
  ApiSchema<'DocumentResponse'>,
  'updated_at' | 'labels'
>> & {
  integrity_state?: PortalDocument['integrity_state'];
  document_hash?: string | null;
  finalized_at?: string | null;
  finalized_by?: string | null;
};

export type DemoReportType =
  | 'office-document-activity'
  | 'office-integrity'
  | 'system-users'
  | 'system-audit';

export type DemoReport = {
  reportType: DemoReportType;
  from: string;
  to: string;
  columns: string[];
  rows: Record<string, unknown>[];
};

const officeDateRanges: readonly OfficeDateRange[] = [
  { id: '7-days', label: 'Last 7 days' },
  { id: '30-days', label: 'Last 30 days' },
  { id: '90-days', label: 'Last 90 days' },
];

export function getOfficeDateRanges(): readonly OfficeDateRange[] {
  return officeDateRanges;
}

export function getOfficeInsightMetrics(
  documents: PortalDocument[],
  selectedRange: OfficeDateRange['id'],
  now: Date,
): OfficeInsightMetric[] {
  const rangeDays = selectedRange === '7-days' ? 7 : selectedRange === '30-days' ? 30 : 90;
  const from = now.getTime() - rangeDays * 24 * 60 * 60 * 1000;
  const to = now.getTime();
  const included = documents.filter((document) => {
    const createdAt = new Date(document.created_at).getTime();
    return createdAt >= from && createdAt <= to;
  });

  return [
    { label: 'Documents created', value: included.length },
    { label: 'Integrity matches', value: included.filter((document) => document.integrity_state === 'match').length },
    { label: 'On-chain records', value: included.filter((document) => document.on_chain).length },
  ];
}

function datePart(value: string | null): string | undefined {
  return value?.slice(0, 10);
}

function isWithin(value: string | null, from: string, to: string): boolean {
  const date = datePart(value);
  return date !== undefined && date >= from && date <= to;
}

export function createDemoReport(
  type: DemoReportType,
  from: string,
  to: string,
  portalDocuments: PortalReportDocument[] = [],
): DemoReport {
  if (!from || !to) throw new Error('Select both a start and end date.');
  if (from > to) throw new Error('Start date must be on or before end date.');

  switch (type) {
    case 'office-document-activity':
      return {
        reportType: type,
        from,
        to,
        columns: ['Document', 'Owner', 'Category', 'Status', 'Created'],
        rows: portalDocuments
          .filter((document) => isWithin(document.created_at, from, to))
          .map((document) => ({
            Document: document.file_name,
            Owner: 'Current office',
            Category: document.labels?.[0] ?? 'Uncategorized',
            Status: document.status,
            Created: datePart(document.created_at),
          })),
      };
    case 'office-integrity':
      return {
        reportType: type,
        from,
        to,
        columns: ['Document', 'Integrity status', 'Verifier', 'Blockchain hash', 'Verified'],
        rows: portalDocuments
          .filter((document) => (
            document.integrity_state === 'match' || document.integrity_state === 'mismatch'
          ) && isWithin(document.finalized_at ?? document.updated_at ?? document.created_at, from, to))
          .map((document) => ({
            Document: document.file_name,
            'Integrity status': document.integrity_state,
            Verifier: document.finalized_by ?? 'Current office',
            'Blockchain hash': document.document_hash ?? 'Not recorded',
            Verified: datePart(document.finalized_at ?? document.updated_at ?? document.created_at),
          })),
      };
    case 'system-users':
      return {
        reportType: type,
        from,
        to,
        columns: ['Name', 'Email', 'Role', 'Status', 'Created'],
        rows: adminUsers
          .filter((user) => isWithin(user.created_at, from, to))
          .map((user) => ({
            Name: user.name,
            Email: user.email,
            Role: user.role,
            Status: user.status,
            Created: datePart(user.created_at),
          })),
      };
    case 'system-audit':
      return {
        reportType: type,
        from,
        to,
        columns: ['Actor', 'Action', 'Target', 'Severity', 'Created'],
        rows: adminAuditLogs
          .filter((entry) => isWithin(entry.created_at, from, to))
          .map((entry) => ({
            Actor: entry.actor,
            Action: entry.action,
            Target: entry.target,
            Severity: entry.severity,
            Created: datePart(entry.created_at),
          })),
      };
    default:
      throw new Error('Unknown report type.');
  }
}

function csvValue(value: unknown): string {
  const text = value == null ? '' : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function toCsv(report: DemoReport): string {
  return [
    report.columns.map(csvValue).join(','),
    ...report.rows.map((row) => report.columns.map((column) => csvValue(row[column])).join(',')),
  ].join('\r\n');
}

export function downloadDemoReport(report: DemoReport): void {
  const url = URL.createObjectURL(new Blob([toCsv(report)], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${report.reportType}-${report.from}-to-${report.to}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
