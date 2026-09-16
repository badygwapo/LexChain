// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ComponentType } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MockToastProvider } from '@/features/admin/components/mock-ui';
import { GeneratedReportsManagementView } from '@/features/admin/generated-reports/generated-reports-management-view';

const View = GeneratedReportsManagementView as ComponentType<Record<string, unknown>>;

function renderReports() {
  return render(
    <MockToastProvider>
      <View reports={[]} />
    </MockToastProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: undefined });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: undefined });
});

describe('GeneratedReportsManagementView', () => {
  it('offers only the two fixed system reports with native date fields', () => {
    renderReports();

    expect(screen.getByRole('radio', { name: 'System Users' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'System Audit' })).toBeTruthy();
    expect((screen.getByLabelText('From') as HTMLInputElement).type).toBe('date');
    expect((screen.getByLabelText('To') as HTMLInputElement).type).toBe('date');
  });

  it('generates a compact seeded preview with an honest demo disclaimer', () => {
    renderReports();

    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-03-01' } });
    fireEvent.change(screen.getByLabelText('To'), { target: { value: '2026-05-31' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate' }));

    expect(screen.getByRole('region', { name: 'System Users report' })).toBeTruthy();
    expect(screen.getByRole('table', { name: 'System Users preview' })).toBeTruthy();
    expect(screen.getByText('Atty. Maria Santos')).toBeTruthy();
    expect(screen.getByText('Demo report — generated locally from seeded data and not stored.')).toBeTruthy();
  });

  it('downloads the generated system report with its type and date range', () => {
    let downloadedFilename = '';
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:system-report') });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function captureFilename(this: HTMLAnchorElement) {
      downloadedFilename = this.download;
    });
    renderReports();

    fireEvent.click(screen.getByRole('button', { name: 'Generate' }));
    fireEvent.click(screen.getByRole('button', { name: 'Download CSV' }));

    expect(downloadedFilename).toBe('system-users-2026-03-01-to-2026-05-31.csv');
  });

  it('renders the invalid date-range error instead of a report', () => {
    renderReports();

    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-05-31' } });
    fireEvent.change(screen.getByLabelText('To'), { target: { value: '2026-05-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate' }));

    expect(screen.getByRole('alert').textContent).toContain('Start date must be on or before end date.');
    expect(screen.queryByRole('region', { name: 'System Users report' })).toBeNull();
  });

  it('removes scheduling, regeneration, archives, history, and format selection', () => {
    renderReports();

    expect(screen.queryByText(/Schedule|Regenerate|Archive|Report Library|Recent Report Activity/i)).toBeNull();
    expect(screen.queryByLabelText('Format')).toBeNull();
  });
});
