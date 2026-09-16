'use client';

import { useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import {
  getRequiredUploadMetadataError,
  getUploadFileError,
  getUploadOutcome,
  type UploadOutcome,
  uploadDocument,
} from '@/features/documents/portal-upload';
import { canAccessPortalFeature, getPortalUiRole } from "@/features/access";
import { PortalDropdown } from "@/features/portal/components";
import { defaultOfficeSettings } from "@/features/office";
import type { ApiSchema } from '@/shared/types/index';

type Book = ApiSchema<'BookResponse'>;
type UserProfile = ApiSchema<'UserProfileResponse'>;

async function fetchBooks(): Promise<Book[]> {
  const res = await fetch(`/api/portal/proxy?path=${encodeURIComponent('/books/?limit=50&offset=0')}`, {
    credentials: 'same-origin',
  });
  if (!res.ok) throw new Error('Unable to load books');
  return res.json();
}

function formatFileSize(size: number) {
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [bookId, setBookId] = useState('');
  const [drag, setDrag] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<UploadOutcome | null>(null);
  const profileQuery = useQuery<UserProfile | null>({
    queryKey: ['portal-profile'],
    queryFn: async () => {
      const response = await fetch(`/api/portal/proxy?path=${encodeURIComponent('/users/')}`, { credentials: 'same-origin' });
      if (!response.ok) throw new Error('Unable to load profile');
      return response.json();
    },
  });
  const isIssuer = canAccessPortalFeature(getPortalUiRole(profileQuery.data?.role), 'upload');
  const booksQuery = useQuery({ queryKey: ['portal-books'], queryFn: fetchBooks, enabled: isIssuer });
  const availableBooks = (booksQuery.data ?? []).filter((book) => !book.is_full);

  const mutation = useMutation({
    mutationFn: () => {
      if (!file) throw new Error('Choose a PDF first.');
      const metadataError = getRequiredUploadMetadataError({ title, bookId });
      if (metadataError) throw new Error(metadataError);
      return uploadDocument({ file, title: title.trim(), bookId });
    },
    onSuccess: (data) => {
      setOutcome(getUploadOutcome(data));
      toast.success('Upload accepted. Your document has been submitted for processing.');
    },
  });

  function pick(candidate: File | null) {
    if (!candidate) return;
    const fileError = getUploadFileError(candidate);
    if (fileError) {
      setValidationError(fileError);
      return;
    }
    setFile(candidate);
    setValidationError(null);
    setTitle((current) => current || candidate.name.replace(/\.pdf$/i, ''));
  }

  function submit() {
    if (mutation.isPending) return;
    setValidationError(null);
    mutation.reset();
    if (!file) {
      setValidationError('Choose a PDF first.');
      return;
    }
    const metadataError = getRequiredUploadMetadataError({ title, bookId });
    if (metadataError) {
      setValidationError(metadataError);
      return;
    }
    mutation.mutate();
  }

  const error = validationError ?? (mutation.isError
    ? `${mutation.error instanceof Error ? mutation.error.message : 'Upload failed.'} Your selected PDF and information have been kept. Review the error and check your connection if needed, then select Confirm and process to retry.`
    : null);
  if (profileQuery.isPending) return <p className="text-sm font-semibold text-[#64748b]">Loading your upload access…</p>;
  if (!isIssuer) {
    return <section className="max-w-xl rounded-[18px] border border-[#E8F0F8] bg-white p-6"><h1 className="text-xl font-black text-[#0C2B49]">Upload unavailable</h1><p className="mt-2 text-sm text-[#64748b]">Only Document Issuers can upload documents.</p></section>;
  }

  if (outcome) {
    return (
      <section className="max-w-xl rounded-[18px] border border-[#D7EDE0] bg-white p-6">
        <div className="flex items-start gap-3">
          <CheckCircleIcon sx={{ fontSize: 32, color: '#12A150' }} />
          <div>
            <p role="status" className="text-lg font-black text-[#0C2B49]">Upload accepted</p>
            <p className="mt-1 text-sm text-[#64748b]">{outcome.message || 'No additional processing detail was returned.'}</p>
            <p className="mt-1 text-sm text-[#64748b]">You can leave this page. Processing continues in the background.</p>
          </div>
        </div>
        <dl className="mt-5 grid gap-3 rounded-xl bg-[#F8FBFF] p-4 text-sm">
          <div><dt className="font-bold text-[#64748b]">Document ID</dt><dd className="mt-1 break-all font-black text-[#0C2B49]">{outcome.documentId}</dd></div>
          <div><dt className="font-bold text-[#64748b]">Current status</dt><dd className="mt-1 font-black text-[#0C2B49]">{outcome.status}</dd></div>
        </dl>
        <button type="button" onClick={() => router.push(`/portal/upload/processing?id=${outcome.documentId}`)} className="mt-5 rounded-full bg-[#0985E7] px-6 py-3 text-sm font-black text-white">
          View processing status
        </button>
      </section>
    );
  }

  return (
    <div className="flex w-full max-w-none flex-1 flex-col gap-5">
      <div>
        <Link href="/portal/documents" className="text-sm font-bold text-[#0985E7]">← Back to documents</Link>
        <h1 className="mt-3 text-[28px] font-black text-[#0C2B49]">Upload Document</h1>
        <p className="mt-1 text-sm text-[#64748b]">A guided upload using the fields LexChain currently accepts.</p>
      </div>

      <div className="flex flex-1 flex-col gap-5">
        <section aria-labelledby="document-information-heading" className="flex flex-col rounded-[18px] border border-[#E8F0F8] bg-white p-5">
          <h2 id="document-information-heading" className="font-black text-[#0C2B49]">Document information</h2>
          <p className="mt-1 text-sm text-[#64748b]">Provide the title and active book required by the upload service.</p>
          <div className="mt-4 grid gap-4">
            <label className="flex flex-col gap-1.5 text-sm font-bold text-[#0C2B49]">Document title<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Deed of Sale" className="rounded-xl border border-[#D7E4F2] px-3 py-2.5 text-sm font-medium outline-none focus:border-[#0985E7]" /></label>
            <label className="flex flex-col gap-1.5 text-sm font-bold text-[#0C2B49]">Register book
              <PortalDropdown
                ariaLabel="Register book"
                placeholder="Choose a register book"
                emptyLabel={booksQuery.isLoading ? 'Loading register books...' : 'No active register books available'}
                options={availableBooks.map((book) => ({ label: `Register book ${book.book_number} — Series ${book.series_year}`, value: book.id }))}
                value={bookId}
                onChange={setBookId}
                disabled={booksQuery.isLoading || availableBooks.length === 0}
              />
            </label>
            {booksQuery.isError && <p role="alert" className="text-sm font-bold text-red-600">Unable to load books. Please try again.</p>}
            {!booksQuery.isLoading && availableBooks.length === 0 && <p className="text-sm text-[#64748b]">Register an active book before uploading a document.</p>}
          </div>
        </section>

        <section aria-labelledby="select-pdf-heading" className="flex flex-col rounded-[18px] border border-[#E8F0F8] bg-white p-5">
          <h2 id="select-pdf-heading" className="font-black text-[#0C2B49]">Select PDF</h2>
          <p className="mt-1 text-sm text-[#64748b]">PDF only · maximum {defaultOfficeSettings.uploadLimitMegabytes} MB</p>
          <div
            onDragOver={(event) => { event.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(event) => { event.preventDefault(); setDrag(false); pick(event.dataTransfer.files[0] ?? null); }}
            className={`mt-4 flex flex-1 flex-col items-center justify-center rounded-[18px] border-2 border-dashed p-6 text-center transition sm:p-8 ${drag ? 'border-[#0985E7] bg-[#EEF6FF]' : 'border-[#E8F0F8] bg-[#F8FBFF] hover:border-[#0985E7]'}`}
          >
            <UploadFileIcon sx={{ fontSize: 44, color: '#0985E7' }} />
            <p className="mt-2 text-sm font-bold text-[#0C2B49]">Drop your PDF here</p>
            <button type="button" onClick={() => inputRef.current?.click()} className="mt-3 rounded-full border border-[#0985E7] px-4 py-2 text-sm font-bold text-[#0985E7] focus:outline-none focus:ring-2 focus:ring-[#0985E7] focus:ring-offset-2">Choose a PDF</button>
            <input ref={inputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(event) => pick(event.target.files?.[0] ?? null)} />
          </div>
          {file && <div className="mt-4 flex items-center gap-3 rounded-[14px] border border-[#E8F0F8] p-4"><InsertDriveFileIcon sx={{ color: '#0985E7' }} /><span className="flex-1 truncate text-sm font-bold text-[#0C2B49]">{file.name} · {formatFileSize(file.size)}</span><button aria-label="Remove uploaded file" onClick={() => { setFile(null); setValidationError(null); }} type="button"><CloseIcon sx={{ fontSize: 18, color: '#64748b' }} /></button></div>}
        </section>
      </div>

      <section aria-labelledby="confirm-process-heading" className="mt-auto rounded-[18px] border border-[#E8F0F8] bg-white p-5 sm:flex sm:items-center sm:justify-between sm:gap-5">
        <div>
          <h2 id="confirm-process-heading" className="font-black text-[#0C2B49]">Confirm and process</h2>
          <p className="mt-1 text-sm text-[#64748b]">Review the selected PDF, title, and book, then send them for processing.</p>
          <p role="status" aria-atomic="true" className="mt-1 text-sm font-bold text-[#0985E7]">{mutation.isPending ? 'Uploading… Please wait while your PDF is submitted.' : ''}</p>
          {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
        </div>
        <button disabled={!file || !title.trim() || !bookId || mutation.isPending} onClick={submit} className="mt-4 shrink-0 rounded-full bg-[#0985E7] px-8 py-3 text-sm font-black text-white transition hover:bg-[#0770c4] disabled:opacity-40 sm:mt-0">{mutation.isPending ? 'Uploading…' : 'Confirm and process'}</button>
      </section>
    </div>
  );
}
