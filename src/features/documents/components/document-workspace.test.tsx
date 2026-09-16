// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DocumentWorkspace } from '@/features/documents/components/document-workspace';

const { finalizeDocumentMock, listDocumentVersionsMock } = vi.hoisted(() => ({
  finalizeDocumentMock: vi.fn(),
  listDocumentVersionsMock: vi.fn(),
}));

vi.mock('@/features/documents/document-lifecycle-api', () => ({
  finalizeDocument: finalizeDocumentMock,
  listDocumentVersions: listDocumentVersionsMock,
}));

const document = {
  document_id: 'doc-101',
  file_name: 'service-agreement.pdf',
  status: 'COMPLETED',
  content_type: 'application/pdf',
  storage_url: 'https://files.example/service-agreement.pdf',
  summary: 'A summary generated from the document.',
  labels: ['Service agreement'],
  entities: [{ name: 'Acme Legal' }],
  risk_flags: [{ severity: 'review', detail: 'Payment term' }],
  lifecycle: 'draft' as const,
  document_hash: null,
  finalized_at: null,
  finalized_by: null,
  anchor_status: null,
};

const finalizationRecord = {
  document_id: 'doc-101',
  tx_hash: '0xtxhash101',
  onchain_document_id: 'onchain-doc-101',
  data_hash: 'datahash101',
};

function renderWorkspace(props: Partial<React.ComponentProps<typeof DocumentWorkspace>> = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries').mockResolvedValue();
  const result = render(
    <QueryClientProvider client={queryClient}>
      <DocumentWorkspace
        document={document}
        role="lawyer"
        {...props}
      />
    </QueryClientProvider>,
  );
  return { ...result, invalidateQueries };
}

describe('DocumentWorkspace', () => {
  beforeEach(() => {
    listDocumentVersionsMock.mockResolvedValue({ total_version: 1, versions: [] });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('shows the API version history instead of only demo snapshots', async () => {
    listDocumentVersionsMock.mockResolvedValue({ total_version: 2, versions: [{ document_id: 'doc-101', version: 2, file_name: 'updated.pdf', status: 'AWAITING_REVIEW', lifecycle: 'DRAFT', is_latest: true, created_at: '2026-07-28T00:00:00Z' }] });
    renderWorkspace();
    fireEvent.click(screen.getByRole('tab', { name: 'Versions' }));
    expect(await screen.findByText('Version 2 · Latest')).toBeTruthy();
  });

  it('shows populated document metadata in the Overview tab', () => {
    renderWorkspace();

    const overview = screen.getByRole('tabpanel');
    expect(within(overview).getByRole('heading', { name: 'Overview' })).toBeTruthy();
    expect(within(overview).getByText('Filename').nextElementSibling?.textContent).toBe('service-agreement.pdf');
    expect(within(overview).getByText('Content type').nextElementSibling?.textContent).toBe('application/pdf');
    expect(within(overview).getByText('Lifecycle status').nextElementSibling?.textContent).toBe('COMPLETED');
  });

  it('marks missing Overview metadata as not supplied', () => {
    renderWorkspace({ document: { ...document, content_type: null, storage_url: null } });

    const overview = screen.getByRole('tabpanel');
    expect(within(overview).getByText('Content type').nextElementSibling?.textContent).toBe('Not supplied');
  });

  it('keeps original files and derived insights in separate tabs', () => {
    renderWorkspace();

    expect(screen.getByRole('tab', { name: 'Overview' })).toBeTruthy();
    expect(screen.getByText(/AI-generated assistance/i)).toBeTruthy();
    expect(screen.getByText(/original document remains authoritative/i)).toBeTruthy();

    fireEvent.click(screen.getByRole('tab', { name: 'Original PDF' }));
    expect(screen.getByRole('link', { name: 'Open original PDF' }).getAttribute('href')).toBe(document.storage_url);
    expect(screen.getByRole('link', { name: 'Download original PDF' }).hasAttribute('download')).toBe(true);

    fireEvent.click(screen.getByRole('tab', { name: 'Blockchain' }));
    expect(screen.getByText(/no blockchain record is available/i)).toBeTruthy();
  });

  it('explains unavailable data without inventing controls or restricted workflow actions', () => {
    renderWorkspace({ document: { ...document, status: 'PROCESSING', storage_url: '', summary: null, labels: [], entities: [], risk_flags: [] } });

    fireEvent.click(screen.getByRole('tab', { name: 'Original PDF' }));
    expect(screen.getByText(/original PDF is not available/i)).toBeTruthy();
    expect(screen.queryByRole('link', { name: /original PDF/i })).toBeNull();
    expect(screen.queryByText(/AI-generated assistance/i)).toBeNull();

    fireEvent.click(screen.getByRole('tab', { name: 'Blockchain' }));
    expect(screen.getByText(/no blockchain record is available/i)).toBeTruthy();
    expect(screen.queryByText(/Anchor to Blockchain|Finali[sz]e|Confirm record/i)).toBeNull();
  });

  it('shows the document hash from the document record in Overview', () => {
    renderWorkspace({ document: { ...document, document_hash: 'a'.repeat(64) } });

    const hashRow = screen.getByText('Document hash');
    expect(hashRow.nextElementSibling?.textContent).toContain('…');
    expect(hashRow.nextElementSibling?.getAttribute('title')).toBe('a'.repeat(64));
  });

  it('renders a mismatched integrity record with the warning treatment', () => {
    renderWorkspace({ document: { ...document, document_hash: 'a'.repeat(64) } });

    fireEvent.click(screen.getByRole('tab', { name: 'Blockchain' }));
    const mismatch = screen.getByText('No blockchain record is available in the current document record.');
    expect(mismatch).toBeTruthy();
  });

  it('renders one-key insight objects as readable key-value details', () => {
    renderWorkspace();

    expect(screen.getByText('name — Acme Legal')).toBeTruthy();
  });

  it('keeps a non-demo document response read-only when lifecycle fields are absent', () => {
    renderWorkspace({
      document: {
        ...document,
        lifecycle: undefined as never,
        document_hash: undefined as never,
        finalized_at: undefined as never,
        finalized_by: undefined as never,
        anchor_status: undefined as never,
        snapshots: undefined as never,
      },
    });

    expect(screen.getByText('Document lifecycle').nextElementSibling?.textContent).toBe('Not available');
    expect(screen.queryByRole('button', { name: 'Finalize' })).toBeNull();
  });

  it('renders the confirmation dialog when the parent opens it', () => {
    const onCancelFinalize = vi.fn();
    const onConfirmFinalize = vi.fn();
    renderWorkspace({ confirmingFinalize: true, onCancelFinalize, onConfirmFinalize });

    const dialog = screen.getByRole('dialog', { name: 'Confirm finalization' });
    expect(within(dialog).getByText(/This will anchor the approved document hash on-chain/)).toBeTruthy();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(onCancelFinalize).toHaveBeenCalledOnce();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Confirm finalization' }));
    expect(onConfirmFinalize).toHaveBeenCalledOnce();
    expect(finalizeDocumentMock).not.toHaveBeenCalled();
  });

  it('disables the finalization mutation button while the parent reports it pending', () => {
    renderWorkspace({ confirmingFinalize: true, isFinalizing: true, onCancelFinalize: vi.fn(), onConfirmFinalize: vi.fn() });

    const confirm = screen.getByRole('button', { name: 'Finalizing…' });
    expect(confirm.hasAttribute('disabled')).toBe(true);
    expect(screen.getByRole('button', { name: 'Cancel' }).hasAttribute('disabled')).toBe(true);
  });

  it('shows returned record hashes and success copy from the parent', () => {
    renderWorkspace({ finalizationResult: finalizationRecord, success: 'Document finalized and anchored on-chain.' });

    expect(screen.getByText('Document finalized and anchored on-chain.')).toBeTruthy();
    expect(screen.getByText('datahash101')).toBeTruthy();
    expect(screen.getByText('0xtxhash101')).toBeTruthy();
  });

  it('keeps failed finalization retryable and never claims success', () => {
    renderWorkspace({ confirmingFinalize: true, finalizeError: 'Document cannot be finalized', onCancelFinalize: vi.fn(), onConfirmFinalize: vi.fn() });

    expect(screen.getByRole('alert').textContent).toContain('Document cannot be finalized');
    expect(screen.getByRole('button', { name: 'Confirm finalization' }).hasAttribute('disabled')).toBe(false);
    expect(screen.queryByText('Document finalized and anchored on-chain.')).toBeNull();
    expect(screen.queryByText('datahash101')).toBeNull();
  });

  it.each([
    ['Access', 'Manage document participants', '/portal/documents/doc-101/participants'],
    ['Activity', 'View document activity', '/portal/documents/doc-101/activity'],
  ] as const)('links %s to its existing document surface', (tab, label, href) => {
    renderWorkspace();

    fireEvent.click(screen.getByRole('tab', { name: tab }));
    expect(screen.getByRole('link', { name: label }).getAttribute('href')).toBe(href);
  });

  it.each([
    ['Access', 'Manage document participants'],
    ['Activity', 'View document activity'],
  ] as const)('does not show the issuer-only %s link to participants', (tab, label) => {
    renderWorkspace({ role: 'user' });

    fireEvent.click(screen.getByRole('tab', { name: tab }));
    expect(screen.queryByRole('link', { name: label })).toBeNull();
  });
});
