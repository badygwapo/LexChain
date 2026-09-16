'use client';

import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AddIcon from '@mui/icons-material/Add';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import RefreshIcon from '@mui/icons-material/Refresh';
import type { ApiSchema } from '@/shared/types/index';
import { toast } from 'sonner';
import { getPortalUiRole, canAccessPortalFeature } from "@/features/access";

type Book = ApiSchema<'BookResponse'>;
type BookCreateRequest = ApiSchema<'BookCreateRequest'>;
type UserProfile = ApiSchema<'UserProfileResponse'>;

const cardClass = 'rounded-[18px] border border-[#E8F0F8] bg-white shadow-[0_4px_12px_rgba(19,59,115,0.05)]';

async function portalGet<T>(path: string): Promise<T> {
  const response = await fetch(`/api/portal/proxy?path=${encodeURIComponent(path)}`, {
    credentials: 'same-origin',
  });
  if (!response.ok) throw new Error('Unable to load books');
  return response.json();
}

async function createBook(payload: BookCreateRequest): Promise<Book> {
  const response = await fetch(`/api/portal/proxy-post?path=${encodeURIComponent('/books/')}`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail ?? error.message ?? 'Unable to register book');
  }
  return response.json();
}

async function deleteBook(bookId: string) {
  const response = await fetch(`/api/portal/proxy-post?path=${encodeURIComponent(`/books/${bookId}`)}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail ?? error.message ?? 'Unable to delete book');
  }
}

export default function BooksPage() {
  const queryClient = useQueryClient();
  const [bookNumber, setBookNumber] = useState('');
  const [seriesYear, setSeriesYear] = useState(String(new Date().getFullYear()));
  const [isRegistering, setIsRegistering] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState<string>();

  const profileQuery = useQuery<UserProfile | null>({
    queryKey: ['portal-profile'],
    queryFn: () => portalGet('/users/'),
  });
  const isIssuer = canAccessPortalFeature(getPortalUiRole(profileQuery.data?.role), 'books');
  const booksQuery = useQuery<Book[]>({
    queryKey: ['portal-books'],
    queryFn: () => portalGet('/books/?limit=50&offset=0'),
    enabled: isIssuer,
  });
  const createBookMutation = useMutation({
    mutationFn: createBook,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['portal-books'] });
      setBookNumber('');
      setIsRegistering(false);
      toast.success('Register book created');
    },
  });
  const bookDetailQuery = useQuery<Book>({
    queryKey: ['portal-book', selectedBookId],
    queryFn: () => portalGet(`/books/${selectedBookId}`),
    enabled: Boolean(selectedBookId),
  });
  const deleteBookMutation = useMutation({
    mutationFn: deleteBook,
    onSuccess: async () => {
      setSelectedBookId(undefined);
      await queryClient.invalidateQueries({ queryKey: ['portal-books'] });
      toast.success('Book deleted');
    },
  });

  const parsedBookNumber = Number(bookNumber);
  const parsedSeriesYear = Number(seriesYear);
  const canSubmit = Number.isInteger(parsedBookNumber)
    && parsedBookNumber >= 1
    && parsedBookNumber <= 1000
    && Number.isInteger(parsedSeriesYear)
    && parsedSeriesYear >= 2000;

  function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isIssuer || !canSubmit) return;
    createBookMutation.mutate({ book_number: parsedBookNumber, series_year: parsedSeriesYear });
  }

  function handleDelete(book: Book) {
    if (window.confirm(`Delete Book ${book.book_number}? This permanently deletes the book and all its documents.`)) {
      deleteBookMutation.mutate(book.id);
    }
  }

  if (profileQuery.isPending) {
    return <p className="text-sm font-semibold text-[#64748b]">Loading your books…</p>;
  }

  if (!isIssuer) {
    return (
      <section className={`${cardClass} max-w-xl p-6`}>
        <h1 className="text-xl font-black text-[#0C2B49]">Books unavailable</h1>
        <p className="mt-2 text-sm text-[#64748b]">Register books are available to Lawyers only.</p>
      </section>
    );
  }

  const books = booksQuery.data ?? [];
  const error = createBookMutation.error instanceof Error ? createBookMutation.error.message : null;
  const deleteError = deleteBookMutation.error instanceof Error ? deleteBookMutation.error.message : null;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black tracking-[0.16em] text-[#0985E7]">REGISTER BOOKS</p>
          <h1 className="mt-1 text-[28px] font-black text-[#0C2B49]">Books</h1>
          <p className="mt-1 text-sm font-medium text-[#64748b]">Manage legal register volumes and their documents.</p>
        </div>
        <button type="button" onClick={() => setIsRegistering(true)} className="flex items-center gap-2 rounded-full bg-[#0985E7] px-5 py-2.5 text-sm font-black text-white transition hover:bg-[#0770c4]">
          <AddIcon sx={{ fontSize: 18 }} />
          Register book
        </button>
      </div>

      {isRegistering && (
        <form onSubmit={handleRegister} className={`${cardClass} p-5`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-[#0C2B49]">Register a book</h2>
              <p className="mt-1 text-sm text-[#64748b]">Add a physical register volume before uploading documents.</p>
            </div>
            <button type="button" onClick={() => setIsRegistering(false)} className="text-sm font-bold text-[#64748b] hover:text-[#0C2B49]">Cancel</button>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm font-bold text-[#0C2B49]">Book number
              <input required min="1" max="1000" inputMode="numeric" type="number" value={bookNumber} onChange={(event) => setBookNumber(event.target.value)} className="rounded-xl border border-[#D7E4F2] px-3 py-2.5 text-sm font-medium outline-none focus:border-[#0985E7]" placeholder="1" />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-bold text-[#0C2B49]">Series year
              <input required min="2000" inputMode="numeric" type="number" value={seriesYear} onChange={(event) => setSeriesYear(event.target.value)} className="rounded-xl border border-[#D7E4F2] px-3 py-2.5 text-sm font-medium outline-none focus:border-[#0985E7]" />
            </label>
          </div>
          {error && <p className="mt-3 text-sm font-bold text-red-600">{error}</p>}
          <button disabled={!canSubmit || createBookMutation.isPending} className="mt-5 rounded-full bg-[#0985E7] px-5 py-2.5 text-sm font-black text-white transition hover:bg-[#0770c4] disabled:opacity-40">
            {createBookMutation.isPending ? 'Registering…' : 'Register book'}
          </button>
        </form>
      )}

      {selectedBookId && (
        <section className={`${cardClass} p-5`}>
          {bookDetailQuery.isLoading ? <p className="text-sm text-[#64748b]">Loading book details…</p> : bookDetailQuery.isError ? <p role="alert" className="text-sm font-bold text-red-600">Unable to load book details.</p> : bookDetailQuery.data && <><h2 className="text-base font-black text-[#0C2B49]">Book details</h2><p className="mt-1 text-sm text-[#64748b]">Created {new Date(bookDetailQuery.data.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}</p>{bookDetailQuery.data.updated_at && <p className="mt-1 text-sm text-[#64748b]">Last updated {new Date(bookDetailQuery.data.updated_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}</p>}</>}
        </section>
      )}

      {booksQuery.isLoading ? (
        <div className={`${cardClass} p-8 text-center text-sm font-semibold text-[#64748b]`}>Loading books…</div>
      ) : booksQuery.isError ? (
        <div className={`${cardClass} p-8 text-center`}>
          <p className="text-sm font-bold text-[#0C2B49]">Unable to load books</p>
          <p className="mt-1 text-sm text-[#64748b]">Please try again.</p>
          <button type="button" onClick={() => void booksQuery.refetch()} className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#D7E4F2] px-4 py-2 text-sm font-black text-[#0985E7] hover:bg-[#EEF6FF]"><RefreshIcon sx={{ fontSize: 17 }} />Retry</button>
        </div>
      ) : books.length === 0 ? (
        <div className={`${cardClass} p-10 text-center`}>
          <MenuBookIcon sx={{ fontSize: 42, color: '#0985E7' }} />
          <h2 className="mt-3 text-lg font-black text-[#0C2B49]">No register books yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[#64748b]">Register a book before uploading a document, so it can be recorded in the correct physical volume.</p>
          <button type="button" onClick={() => setIsRegistering(true)} className="mt-5 rounded-full bg-[#0985E7] px-5 py-2.5 text-sm font-black text-white transition hover:bg-[#0770c4]">Register book</button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((book) => (
            <article key={book.id} className={`${cardClass} p-5`}>
              <div className="flex items-start justify-between gap-3">
                <div><h2 className="text-lg font-black text-[#0C2B49]">Book {book.book_number}</h2><p className="mt-1 text-sm text-[#64748b]">Series {book.series_year}</p></div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${book.is_full ? 'bg-[#FFF4DD] text-[#B77900]' : 'bg-[#EAF8F0] text-[#12A150]'}`}>{book.is_full ? 'Full' : 'Active'}</span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[#E8F0F8] pt-4">
                <div><p className="text-xl font-black text-[#0C2B49]">{book.document_count}</p><p className="text-xs font-medium text-[#64748b]">Documents</p></div>
                <div><p className="text-xl font-black text-[#0C2B49]">{book.page_count}</p><p className="text-xs font-medium text-[#64748b]">Pages</p></div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={() => setSelectedBookId(book.id)} className="rounded-full border border-[#D7E4F2] px-3 py-1.5 text-sm font-bold text-[#0C2B49]" aria-label={`View details for Book ${book.book_number}`}>Details</button>
                <button type="button" onClick={() => handleDelete(book)} disabled={deleteBookMutation.isPending} className="rounded-full border border-red-200 px-3 py-1.5 text-sm font-bold text-red-600 disabled:opacity-40" aria-label={`Delete Book ${book.book_number}`}>{deleteBookMutation.isPending ? 'Deleting…' : 'Delete'}</button>
              </div>
              <p className="mt-4 truncate text-[11px] font-semibold text-[#A0AAB8]" title={book.id}>ID: {book.id}</p>
            </article>
          ))}
        </div>
      )}
      {deleteError && <p role="alert" className="text-sm font-bold text-red-600">{deleteError}</p>}
    </div>
  );
}
