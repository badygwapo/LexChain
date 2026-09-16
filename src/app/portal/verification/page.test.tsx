// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import VerificationPage from '@/features/verification/pages/verification-page';

const { verifyRepositoryDocumentMock } = vi.hoisted(() => ({
  verifyRepositoryDocumentMock: vi.fn(),
}));

vi.mock('@/features/verification/integrity-api', () => ({
  verifyRepositoryDocument: verifyRepositoryDocumentMock,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('VerificationPage', () => {
  it('renders the unavailable integrity status when the verification request is rejected', async () => {
    verifyRepositoryDocumentMock.mockRejectedValue(new Error('Network unavailable'));
    render(<VerificationPage />);

    fireEvent.change(screen.getByLabelText('Repository document ID'), { target: { value: 'document-123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Check integrity' }));

    expect(await screen.findByText('Integrity status unavailable')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toContain('could not be retrieved');
  });
});
