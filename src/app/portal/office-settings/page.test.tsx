// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import OfficeSettingsPage from '@/features/office/pages/office-settings-page';

const profile = vi.hoisted(() => ({ role: 'document_participant' }));

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: { role: profile.role }, isLoading: false }),
}));

afterEach(cleanup);

describe('OfficeSettingsPage', () => {
  it('denies participants before rendering local office settings data', () => {
    render(<OfficeSettingsPage />);

    expect(screen.getByText('Office Settings are available to Lawyers only.')).toBeTruthy();
    expect(screen.queryByLabelText('Office settings')).toBeNull();
    expect(screen.queryByText('Demo data — changes reset when this page is refreshed.')).toBeNull();
  });

  it('does not expose session or other technical settings to issuers', () => {
    profile.role = 'document_issuer';
    render(<OfficeSettingsPage />);

    expect(screen.getByLabelText('Office settings')).toBeTruthy();
    expect(screen.queryByLabelText('Session timeout')).toBeNull();
  });

  it('identifies valid local changes before they are saved', () => {
    profile.role = 'document_issuer';
    render(<OfficeSettingsPage />);

    fireEvent.change(screen.getByLabelText('Invitation expiry'), { target: { value: '8' } });

    expect(screen.getByRole('status').textContent).toContain('Unsaved changes');
  });

  it('keeps a cleared numeric field empty while reporting its validation error', () => {
    profile.role = 'document_issuer';
    render(<OfficeSettingsPage />);

    const input = screen.getByLabelText('Invitation expiry') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '' } });

    expect(input.value).toBe('');
    expect(screen.getByText(/Invitation expiry must be a whole number/)).toBeTruthy();
  });
});
