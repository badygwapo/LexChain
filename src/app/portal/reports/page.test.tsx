// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import OfficeReportsPage from '@/features/office/pages/reports-page';

const queryState = vi.hoisted(() => ({
  role: 'document_issuer',
  documents: [{
    document_id: 'mock-document-1',
    file_name: 'Lease Agreement.pdf',
    status: 'anchored',
    labels: ['lease'],
    created_at: '2026-07-10T09:00:00.000Z',
    updated_at: '2026-07-10T09:05:00.000Z',
    on_chain: true,
    integrity_state: 'match',
    document_hash: 'abc123',
    finalized_at: '2026-07-10T09:05:00.000Z',
    finalized_by: 'mock-document-issuer',
  }],
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: (options: { queryKey: string[] }) => options.queryKey[0] === 'portal-profile'
    ? { data: { role: queryState.role }, isLoading: false }
    : { data: queryState.documents, isLoading: false, isError: false },
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: undefined });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: undefined });
});
beforeEach(() => { queryState.role = 'document_issuer'; });

describe('ReportsPage', () => {
  it('lets an issuer choose document or system reports from a dropdown', () => {
    render(<OfficeReportsPage />);

    const scopePicker = screen.getByRole('button', { name: 'Report scope' });
    expect(scopePicker.textContent).toContain('Document reports');
    const documentReportPicker = screen.getByRole('button', { name: 'Report type' });
    expect(documentReportPicker.textContent).toContain('Document Activity');
    fireEvent.click(documentReportPicker);
    fireEvent.click(screen.getByRole('option', { name: 'Integrity' }));
    expect(documentReportPicker.textContent).toContain('Integrity');
    fireEvent.click(scopePicker);
    fireEvent.click(screen.getByRole('option', { name: 'System reports' }));
    const reportPicker = screen.getByRole('button', { name: 'Report type' });
    expect(reportPicker.textContent).toContain('System Users');
    fireEvent.click(reportPicker);
    fireEvent.click(screen.getByRole('option', { name: 'System Audit' }));
    expect(screen.getByRole('status').textContent).toContain('System Audit');
    expect((screen.getByLabelText('From') as HTMLInputElement).type).toBe('date');
    expect((screen.getByLabelText('To') as HTMLInputElement).type).toBe('date');
  });

  it('keeps system report dates in the same three-column range layout', () => {
    render(<OfficeReportsPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Report scope' }));
    fireEvent.click(screen.getByRole('option', { name: 'System reports' }));

    expect(screen.getByRole('region', { name: 'Report dates' }).className).toContain('sm:grid-cols-[1fr_1fr_auto]');
  });

  it('groups scope, type, and dates in one report controls card for both scopes', () => {
    render(<OfficeReportsPage />);

    const scopePicker = screen.getByRole('button', { name: 'Report scope' });
    let controls = screen.getByRole('region', { name: 'Report controls' });
    expect(controls.contains(scopePicker)).toBe(true);
    expect(controls.contains(screen.getByRole('button', { name: 'Report type' }))).toBe(true);
    expect(controls.contains(screen.getByLabelText('From'))).toBe(true);
    expect(controls.contains(screen.getByLabelText('To'))).toBe(true);
    expect(controls.contains(screen.getByRole('button', { name: 'Generate' }))).toBe(true);

    fireEvent.click(scopePicker);
    fireEvent.click(screen.getByRole('option', { name: 'System reports' }));
    controls = screen.getByRole('region', { name: 'Report controls' });
    expect(controls.contains(screen.getByRole('button', { name: 'Report scope' }))).toBe(true);
    expect(controls.contains(screen.getByRole('button', { name: 'Report type' }))).toBe(true);
    expect(controls.contains(screen.getByLabelText('From'))).toBe(true);
    expect(controls.contains(screen.getByLabelText('To'))).toBe(true);
    expect(controls.contains(screen.getByRole('button', { name: 'Generate' }))).toBe(true);
  });

  it('uses the portal report shell and elevated cards', () => {
    render(<OfficeReportsPage />);

    const heading = screen.getByRole('heading', { name: 'Reports', level: 1 });
    const view = heading.closest('header')?.parentElement;
    const controls = screen.getByRole('region', { name: 'Report controls' });

    expect(view?.className).toContain('xl:min-h-[calc(100dvh-113px)]');
    expect(controls.className).toContain('rounded-2xl');
    expect(controls.className).toContain('shadow-sm');
  });

  it('generates a compact preview and shows the disclaimer for every result', () => {
    render(<OfficeReportsPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Generate' }));
    expect(screen.getByRole('region', { name: 'Document Activity report' })).toBeTruthy();
    expect(screen.getByRole('table', { name: 'Document Activity preview' })).toBeTruthy();
    expect(screen.getByText('Lease Agreement.pdf')).toBeTruthy();
    expect(screen.queryByText('Deed of Sale - Lot 18.pdf')).toBeNull();
    expect(screen.getByText('Demo report — generated locally from seeded data and not stored.')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Report type' }));
    fireEvent.click(screen.getByRole('option', { name: 'Integrity' }));
    fireEvent.click(screen.getByRole('button', { name: 'Generate' }));
    expect(screen.getByRole('region', { name: 'Integrity report' })).toBeTruthy();
    expect(screen.getByText('Demo report — generated locally from seeded data and not stored.')).toBeTruthy();
  });

  it('requires both report dates before generating', () => {
    render(<OfficeReportsPage />);

    fireEvent.change(screen.getByLabelText('From'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate' }));

    expect(screen.getByRole('alert').textContent).toContain('Select both a start and end date.');
    expect(screen.queryByRole('region', { name: 'Document Activity report' })).toBeNull();
  });

  it('downloads CSV with the report type and dates in the filename', () => {
    let downloadedFilename = '';
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:demo-report') });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function captureFilename(this: HTMLAnchorElement) {
      downloadedFilename = this.download;
    });
    render(<OfficeReportsPage />);

    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-07-01' } });
    fireEvent.change(screen.getByLabelText('To'), { target: { value: '2026-07-31' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate' }));
    fireEvent.click(screen.getByRole('button', { name: 'Download CSV' }));

    expect(downloadedFilename).toBe('office-document-activity-2026-07-01-to-2026-07-31.csv');
  });

  it('removes generic report controls', () => {
    render(<OfficeReportsPage />);

    expect(screen.queryByText(/Schedule|Regenerate|Archive/i)).toBeNull();
    expect(screen.queryByLabelText('Format')).toBeNull();
  });

  it('denies participants before rendering local report data', () => {
    queryState.role = 'document_participant';
    render(<OfficeReportsPage />);

    expect(screen.getByText('Reports are available to Lawyers only.')).toBeTruthy();
    expect(screen.queryByRole('radio', { name: 'Document Activity' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Generate' })).toBeNull();
  });
});
