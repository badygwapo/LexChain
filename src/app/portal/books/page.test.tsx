// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import BooksPage from '@/features/office/pages/books-page';

const book = {
  id: 'book-1',
  book_number: 1,
  series_year: 2026,
  document_count: 2,
  page_count: 4,
  is_full: false,
  created_at: '2026-07-01T08:00:00Z',
  updated_at: '2026-07-02T08:00:00Z',
};

vi.mock('sonner', () => ({ toast: { success: vi.fn() } }));

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}><BooksPage /></QueryClientProvider>);
}

describe('BooksPage', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows API-backed book details when requested', async () => {
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('%2Fusers%2F')) return Promise.resolve(Response.json({ role: 'document_issuer' }));
      if (url.includes('%2Fbooks%2F%3Flimit')) return Promise.resolve(Response.json([book]));
      if (url.includes('%2Fbooks%2Fbook-1')) return Promise.resolve(Response.json(book));
      return Promise.resolve(new Response(null, { status: 404 }));
    }));

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'View details for Book 1' }));

    expect(await screen.findByText('Book details')).toBeTruthy();
    expect(screen.getByText('Created Jul 1, 2026')).toBeTruthy();
  });

  it('requires confirmation before deleting a book and its documents', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('%2Fusers%2F')) return Promise.resolve(Response.json({ role: 'document_issuer' }));
      if (url.includes('%2Fbooks%2F%3Flimit')) return Promise.resolve(Response.json([book]));
      if (url.includes('%2Fbooks%2Fbook-1') && init?.method === 'DELETE') return Promise.resolve(new Response(null, { status: 204 }));
      return Promise.resolve(new Response(null, { status: 404 }));
    });
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Delete Book 1' }));
    expect(fetchMock).not.toHaveBeenCalledWith(expect.stringContaining('book-1'), expect.objectContaining({ method: 'DELETE' }));

    vi.spyOn(window, 'confirm').mockReturnValue(true);
    fireEvent.click(screen.getByRole('button', { name: 'Delete Book 1' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      '/api/portal/proxy-post?path=%2Fbooks%2Fbook-1',
      expect.objectContaining({ method: 'DELETE' }),
    ));
  });
});
