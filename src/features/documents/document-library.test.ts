// @vitest-environment jsdom
import { createElement } from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getDocumentListActions, getVisibleDocuments } from '@/features/documents/document-library';
import DocumentsPage from '@/features/documents/pages/documents-page';

vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }: { queryKey: string[] }) => queryKey[0] === 'portal-documents'
    ? { data: documents, ...documentQueryState }
    : { data: { role: 'document_issuer' }, isLoading: false, isError: false },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const documents = [
  {
    id: 'document-1',
    document_number: 102,
    file_name: 'Lease Agreement.pdf',
    status: 'processing',
    on_chain: true,
    updated_at: '2026-07-13T13:30:00.000Z',
    storage_url: '/mock-documents/lease.pdf',
  },
  {
    id: 'document-2',
    document_number: 101,
    file_name: 'Certificate of Employment.pdf',
    status: 'anchored',
    on_chain: true,
    updated_at: '2026-07-10T09:05:00.000Z',
    storage_url: '/mock-documents/certificate.pdf',
  },
];

let documentQueryState = { isLoading: false, isError: false };

afterEach(() => {
  cleanup();
  documentQueryState = { isLoading: false, isError: false };
});

describe('document library list', () => {
  it('finds documents by title or reference and sorts the matching payload locally', () => {
    expect(getVisibleDocuments(documents, { query: '101', status: 'all', sort: 'newest' }).map((document) => document.id))
      .toEqual(['document-2']);
    expect(getVisibleDocuments(documents, { query: '', status: 'all', sort: 'title' }).map((document) => document.id))
      .toEqual(['document-2', 'document-1']);
  });

  it('filters by status only when the payload includes statuses', () => {
    expect(getVisibleDocuments(documents, { query: '', status: 'processing', sort: 'newest' }).map((document) => document.id))
      .toEqual(['document-1']);
  });

  it('includes both date boundaries and excludes missing dates when filtering', () => {
    const rows = [...documents, { id: 'undated', file_name: 'Undated.pdf' }];
    expect(getVisibleDocuments(rows, { query: '', status: 'all', sort: 'newest', updatedFrom: '2026-07-10', updatedThrough: '2026-07-13' }).map((document) => document.id))
      .toEqual(['document-1', 'document-2']);
    expect(getVisibleDocuments(rows, { query: '', status: 'all', sort: 'newest', updatedFrom: '2026-07-11' }).map((document) => document.id))
      .toEqual(['document-1']);
  });

  it('keeps filters available with no matches and resets search and sorting', () => {
    render(createElement(DocumentsPage));
    fireEvent.click(screen.getByRole('button', { name: 'Newest first' }));
    fireEvent.click(screen.getByRole('button', { name: 'Oldest first' }));
    expect(screen.getAllByRole('row')[1].textContent).toContain('Certificate of Employment.pdf');
    fireEvent.change(screen.getByPlaceholderText('Search documents...'), { target: { value: 'missing' } });
    expect(screen.getByText('No matching documents')).toBeTruthy();
    fireEvent.click(screen.getByText('More Filters'));
    fireEvent.click(screen.getByRole('button', { name: 'Reset filters' }));
    expect(screen.getByRole('button', { name: 'Newest first' })).toBeTruthy();
    expect(screen.getByText('Showing 1–2 of 2 documents')).toBeTruthy();
  });

  it('clears an unmatched search and restores documents while preserving status and sorting', () => {
    render(createElement(DocumentsPage));
    fireEvent.click(screen.getByRole('button', { name: 'Newest first' }));
    fireEvent.click(screen.getByRole('button', { name: 'Oldest first' }));
    fireEvent.click(screen.getByText('More Filters'));
    fireEvent.click(screen.getByRole('button', { name: 'All Statuses' }));
    fireEvent.click(screen.getByRole('button', { name: 'Processing' }));
    const search = screen.getByPlaceholderText('Search documents...') as HTMLInputElement;
    fireEvent.change(search, { target: { value: 'missing' } });

    expect(screen.getByText('No matching documents')).toBeTruthy();
    expect(screen.getByText('Showing 0–0 of 0 documents')).toBeTruthy();
    const clear = screen.getByRole('button', { name: 'Clear search' });
    expect(clear.tagName).toBe('BUTTON');
    expect(clear.tabIndex).toBe(0);
    clear.focus();
    expect(document.activeElement).toBe(clear);
    fireEvent.click(clear);

    expect(search.value).toBe('');
    expect(screen.queryByText('No matching documents')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Oldest first' })).toBeTruthy();
    fireEvent.click(screen.getByText(/More Filters/));
    expect(screen.getByRole('button', { name: 'Processing' })).toBeTruthy();
    const table = within(screen.getByRole('table'));
    expect(table.getByRole('row', { name: /Lease Agreement/ })).toBeTruthy();
    expect(table.queryByRole('row', { name: /Certificate of Employment/ })).toBeNull();
    expect(screen.getByText('Showing 1–1 of 1 documents')).toBeTruthy();
  });

  it('does not treat whitespace as an unmatched search', () => {
    render(createElement(DocumentsPage));
    fireEvent.change(screen.getByPlaceholderText('Search documents...'), { target: { value: '   ' } });
    expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull();
    expect(screen.getByText('Showing 1–2 of 2 documents')).toBeTruthy();
  });

  it.each(['loading', 'error'] as const)('keeps an active unmatched search distinct from the request %s state', (state) => {
    const view = render(createElement(DocumentsPage));
    fireEvent.change(screen.getByPlaceholderText('Search documents...'), { target: { value: 'missing' } });
    documentQueryState = { isLoading: state === 'loading', isError: state === 'error' };
    view.rerender(createElement(DocumentsPage));

    expect(screen.queryByText('No matching documents')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull();
    if (state === 'loading') {
      expect(screen.getByLabelText('Loading documents')).toBeTruthy();
      expect(screen.queryByRole('alert')).toBeNull();
    } else {
      expect(screen.getByRole('alert').textContent).toContain('Unable to load documents.');
      expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy();
    }
  });

  it('offers review only for issuer documents awaiting OCR review', () => {
    expect(getDocumentListActions('lawyer', { ...documents[0], status: 'AWAITING_REVIEW' }))
      .toEqual(['Open', 'View / Download', 'Review', 'Verify integrity']);
    expect(getDocumentListActions('lawyer', { ...documents[0], status: 'ready_for_review' }))
      .toContain('Review');
    expect(getDocumentListActions('user', { ...documents[0], status: 'AWAITING_REVIEW' }))
      .not.toContain('Review');
    expect(getDocumentListActions('lawyer', { ...documents[0], status: 'processing' }))
      .not.toContain('Review');
  });

  it('offers only supported list actions', () => {
    const actions = getDocumentListActions('lawyer', documents[1]);

    expect(actions).toEqual(['Open', 'View / Download', 'Verify integrity']);
    expect(actions).not.toContain('Delete');
    expect(actions).not.toContain('Finalize');
    expect(actions).not.toContain('Anchor');
    expect(actions).not.toContain('Versions');
    expect(actions).not.toContain('Participants');
  });

  it('does not offer integrity verification to participants for on-chain documents', () => {
    expect(getDocumentListActions('user', documents[1]))
      .toEqual(['Open', 'View / Download']);
  });

  it('states the result count and gives secondary actions accessible names', () => {
    render(createElement(DocumentsPage));

    expect(screen.getByText('Showing 1–2 of 2 documents')).toBeTruthy();
    const leaseRow = within(screen.getByRole('table')).getByRole('row', { name: /Lease Agreement\.pdf/ });
    expect(within(leaseRow).getByRole('link', { name: 'View / Download' })).toBeTruthy();
  });
});
