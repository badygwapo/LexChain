import { describe, expect, it } from 'vitest';
import {
  createDemoReport,
  getOfficeDateRanges,
  getOfficeInsightMetrics,
  toCsv,
  type DemoReport,
  type DemoReportType,
  type PortalReportDocument,
} from '@/features/office/office-insight';

describe('office insights', () => {
  it('provides clear date-range labels for the local office views', () => {
    expect(getOfficeDateRanges().map((range) => range.label)).toEqual([
      'Last 7 days',
      'Last 30 days',
      'Last 90 days',
    ]);
  });

  it('derives local demo office insight totals from shared documents', () => {
    expect(getOfficeInsightMetrics([
      {
        created_at: '2026-07-24T00:00:00.000Z',
        integrity_state: 'match',
        on_chain: true,
      },
      {
        created_at: '2026-07-10T00:00:00.000Z',
        integrity_state: 'mismatch',
        on_chain: false,
      },
    ], '30-days', new Date('2026-07-26T00:00:00.000Z'))).toEqual([
      { label: 'Documents created', value: 2 },
      { label: 'Integrity matches', value: 1 },
      { label: 'On-chain records', value: 1 },
    ]);
  });

  it.each([
    ['office-document-activity', ['Document', 'Owner', 'Category', 'Status', 'Created']],
    ['office-integrity', ['Document', 'Integrity status', 'Verifier', 'Blockchain hash', 'Verified']],
    ['system-users', ['Name', 'Email', 'Role', 'Status', 'Created']],
    ['system-audit', ['Actor', 'Action', 'Target', 'Severity', 'Created']],
  ] satisfies Array<[DemoReportType, string[]]>)('uses fixed columns for %s', (reportType, columns) => {
    expect(createDemoReport(reportType, '2026-03-01', '2026-05-31').columns).toEqual(columns);
  });

  it('builds office reports only from issuer-visible portal documents', () => {
    const documents: PortalReportDocument[] = [
      {
        document_id: 'mock-document-1',
        file_name: 'Lease Agreement.pdf',
        status: 'anchored',
        labels: ['lease', 'agreement'],
        created_at: '2026-07-10T09:00:00.000Z',
        updated_at: '2026-07-10T09:05:00.000Z',
        on_chain: true,
        integrity_state: 'match',
        document_hash: 'abc123',
        finalized_at: '2026-07-10T09:05:00.000Z',
        finalized_by: 'mock-document-issuer',
      },
      {
        document_id: 'mock-document-old',
        file_name: 'Older Office Record.pdf',
        status: 'completed',
        labels: ['record'],
        created_at: '2026-06-20T09:00:00.000Z',
        updated_at: '2026-06-20T09:00:00.000Z',
        on_chain: false,
        integrity_state: 'not-recorded',
      },
    ];
    const activity = createDemoReport('office-document-activity', '2026-07-01', '2026-07-31', documents);
    const integrity = createDemoReport('office-integrity', '2026-07-01', '2026-07-31', documents);

    expect(activity.rows).toEqual([
      {
        Document: 'Lease Agreement.pdf',
        Owner: 'Current office',
        Category: 'lease',
        Status: 'anchored',
        Created: '2026-07-10',
      },
    ]);
    expect(integrity.rows).toEqual([
      {
        Document: 'Lease Agreement.pdf',
        'Integrity status': 'match',
        Verifier: 'mock-document-issuer',
        'Blockchain hash': 'abc123',
        Verified: '2026-07-10',
      },
    ]);
    expect(activity.rows.some((row) => row.Document === 'Deed of Sale - Lot 18.pdf')).toBe(false);
  });

  it('builds system reports only from seeded user and audit rows', () => {
    const users = createDemoReport('system-users', '2026-03-01', '2026-05-31');
    const audit = createDemoReport('system-audit', '2026-05-01', '2026-05-31');

    expect(users.rows).toHaveLength(4);
    expect(users.rows[0]).toEqual({
      Name: 'Atty. Maria Santos',
      Email: 'maria.santos@davaolaw.ph',
      Role: 'lawyer',
      Status: 'active',
      Created: '2026-04-12',
    });
    expect(audit.rows).toHaveLength(4);
    expect(audit.rows[0]).toEqual({
      Actor: 'owner@lexchain.local',
      Action: 'Changed category privacy rule',
      Target: 'Contract',
      Severity: 'info',
      Created: '2026-05-13',
    });
    expect(users.rows.every((row) => !('Document' in row))).toBe(true);
    expect(audit.rows.every((row) => !('Email' in row))).toBe(true);
  });

  it('rejects a date range whose start is after its end', () => {
    expect(() => createDemoReport('system-audit', '2026-05-31', '2026-05-01'))
      .toThrow('Start date must be on or before end date.');
  });

  it.each([
    ['', '2026-05-31'],
    ['2026-05-01', ''],
  ])('rejects an incomplete date range (%j to %j)', (from, to) => {
    expect(() => createDemoReport('system-audit', from, to))
      .toThrow('Select both a start and end date.');
  });

  it('escapes quotes, commas, and newlines in CSV values', () => {
    const report: DemoReport = {
      reportType: 'system-audit',
      from: '2026-05-01',
      to: '2026-05-31',
      columns: ['Actor', 'Action'],
      rows: [{ Actor: 'A "quoted", actor', Action: 'First line\nSecond line' }],
    };

    expect(toCsv(report)).toBe('Actor,Action\r\n"A ""quoted"", actor","First line\nSecond line"');
  });

  it.each(['scheduled', 'archived', 'queued', 'custom'])('does not support a %s report type', (reportType) => {
    expect(() => createDemoReport(
      reportType as DemoReportType,
      '2026-05-01',
      '2026-05-31',
    )).toThrow('Unknown report type.');
  });
});
