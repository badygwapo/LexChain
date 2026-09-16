// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DocumentVerifyPage from '@/features/documents/pages/documents-id-verify-page';

vi.mock('next/navigation', () => ({ useParams: () => ({ id: 'doc-1' }) }));

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
});

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <DocumentVerifyPage />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('DocumentVerifyPage', () => {
  it('auto-starts verification on mount', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({
      status: 'AUTHENTIC', is_authentic: true, message: 'Document matches the anchored hash.',
    }));
    vi.stubGlobal('fetch', fetchMock);

    renderPage();
    expect(await screen.findByText('Document is authentic')).toBeTruthy();
    expect(fetchMock.mock.calls[0]?.[0]).toContain(encodeURIComponent('/documents/doc-1/verify'));
  });

  it('shows a skeleton while verification is pending', () => {
    vi.stubGlobal('fetch', () => new Promise(() => undefined));
    renderPage();
    expect(screen.getByRole('status', { name: 'Verifying document integrity' })).toBeTruthy();
  });

  it('renders the server tamper report instead of a generic warning', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ status: 'TAMPERED', is_authentic: false, message: 'Hash mismatch.', storage_url: 'https://example.test/deed.pdf', page_count: 1, blocks: [], tamper_report: { total_changes: 1, critical_changes: 1, similarity: 0.98, localized: false, segments: [{ type: 'replace', severity: 'critical', reason: 'Amount changed', original_text: 'PHP 500', current_text: 'PHP 50', original_line_start: 1, original_line_end: 1, current_line_start: 1, current_line_end: 1, block_index: null, page_idx: null, word_diff: [] }] } })));
    renderPage();
    expect(await screen.findByText('Document was tampered with')).toBeTruthy();
    expect(screen.getByText(/Amount changed/)).toBeTruthy();
    expect(screen.getByText(/text only/i)).toBeTruthy();
  });

  it('offers Restore only when the document is tampered', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ status: 'TAMPERED', is_authentic: false, message: 'Hash mismatch.', tamper_report: { total_changes: 1, critical_changes: 0, similarity: 0.9, localized: false, segments: [] } })));
    renderPage();
    expect(await screen.findByRole('button', { name: 'Restore' })).toBeTruthy();
  });

  it('restores the document and re-verifies it', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json({ status: 'TAMPERED', is_authentic: false, message: 'Hash mismatch.', tamper_report: { total_changes: 1, critical_changes: 0, similarity: 0.9, localized: false, segments: [] } }))
      .mockResolvedValueOnce(Response.json({ message: 'restored' }))
      .mockResolvedValueOnce(Response.json({ status: 'AUTHENTIC', is_authentic: true, message: 'Document matches the anchored hash.' }));
    vi.stubGlobal('fetch', fetchMock);

    renderPage();
    const restoreButton = await screen.findByRole('button', { name: 'Restore' });
    fireEvent.click(restoreButton);

    expect(await screen.findByText('Document restored and re-verified')).toBeTruthy();
    expect(fetchMock.mock.calls.some((call) => String(call[0]).includes(encodeURIComponent('/documents/doc-1/restore')))).toBe(true);
  });
});
