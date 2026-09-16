'use client';

import { useState } from 'react';
import { FilterDetails } from '@/shared/components/ui/filter-details';
import Link from 'next/link';
import dayjs from 'dayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import SearchIcon from '@mui/icons-material/Search';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FilterListIcon from '@mui/icons-material/FilterList';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import DownloadIcon from '@mui/icons-material/Download';
import RateReviewIcon from '@mui/icons-material/RateReview';
import VerifiedIcon from '@mui/icons-material/Verified';
import { Dropdown } from "@/features/admin/components";
import { MetricCard } from "@/features/portal/components";
import { getDocumentStatusLabel } from '@/features/documents/document-ui';
import { getPortalUiRole } from "@/features/access";
import {
  getDocumentListActions,
  getDocumentStatuses,
  getVisibleDocuments,
  type DocumentListItem,
  type DocumentListFilters,
} from '@/features/documents/document-library';
import type { ApiSchema } from '@/shared/types/index';

type Document = DocumentListItem & {
  id: string;
  file_name: string;
};

const datePickerSlotProps = {
  textField: { size: 'small' as const, fullWidth: true, sx: { '& .MuiPickersOutlinedInput-root': { borderRadius: 3, backgroundColor: '#F8FBFF', color: '#0C2B49' } } },
  field: { clearable: true },
  popper: { disablePortal: true },
  desktopPaper: { sx: { borderRadius: 3, border: '1px solid #E4EEF9' } },
};

type UserProfile = ApiSchema<'UserProfileResponse'>;

async function fetchDocuments(): Promise<Document[]> {
  const res = await fetch('/api/portal/proxy?path=%2Fdocuments%2F', { credentials: 'same-origin' });
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}

function cn(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatDate(iso?: string | null) {
  if (!iso) return 'Not available';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function statusStyle(status?: string | null) {
  const value = status?.toLowerCase();
  if (value === 'anchored' || value === 'completed') return 'bg-[#EAF8F0] text-[#12A150]';
  if (value === 'processing' || value === 'pending') return 'bg-[#FFF4DD] text-[#B77900]';
  return 'bg-[#EAF4FF] text-[#1689F5]';
}

function DocumentBadges({ document }: { document: Document }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {document.status && <span className={`${statusStyle(document.status)} rounded-full px-2.5 py-0.5 text-[11px] font-bold`}>{getDocumentStatusLabel(document.status)}</span>}
      {typeof document.on_chain === 'boolean' && (
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${document.on_chain ? 'bg-[#EAF8F0] text-[#12A150]' : 'bg-[#F1F5F9] text-[#64748b]'}`}>
          {document.on_chain ? 'Repository marked recorded' : 'Repository marked not recorded'}
        </span>
      )}
    </div>
  );
}

const actionIcons: Record<string, React.ReactNode> = {
  'Open': <OpenInNewIcon sx={{ fontSize: 18 }} />,
  'View / Download': <DownloadIcon sx={{ fontSize: 18 }} />,
  'Review': <RateReviewIcon sx={{ fontSize: 18 }} />,
  'Verify integrity': <VerifiedIcon sx={{ fontSize: 18 }} />,
};

const actionHrefs: Record<string, (id: string) => string> = {
  'Open': (id) => `/portal/documents/${id}`,
  'View / Download': (id) => `/portal/documents/${id}/viewer`,
  'Review': (id) => `/portal/documents/${id}/review`,
  'Verify integrity': (id) => `/portal/documents/${id}/verify`,
};

function DocumentActions({ document, role }: { document: Document; role: ReturnType<typeof getPortalUiRole> }) {
  const actions = getDocumentListActions(role, document);

  return (
    <div className="flex items-center gap-1">
      {actions.map((action) => (
        <Link
          key={action}
          href={actionHrefs[action]?.(document.id) ?? `/portal/documents/${document.id}`}
          aria-label={action}
          className="flex size-8 items-center justify-center rounded-lg text-[#5B6F8A] transition hover:bg-[#EAF3FF] hover:text-[#0985E7]"
        >
          {actionIcons[action]}
        </Link>
      ))}
    </div>
  );
}

function StatusDistribution({ docs }: { docs: Document[] }) {
  const colors = ["#0879D8", "#59C878", "#9B6AF3", "#F6B52E", "#22C7D8", "#EF4444"];
  const groups = [...new Set(docs.map((d) => getDocumentStatusLabel(d.status)))].map((label, i) => ({
    label, color: colors[i % colors.length],
    count: docs.filter((d) => getDocumentStatusLabel(d.status) === label).length,
  }));
  const total = Math.max(1, docs.length);
  let cursor = 0;
  const gradient = groups.map((g) => {
    const start = cursor;
    cursor += (g.count / total) * 100;
    return `${g.color} ${start}% ${cursor}%`;
  }).join(", ");

  return (
    <article className="flex h-fit self-start flex-col rounded-2xl border border-[#E4EEF9] bg-white p-5 shadow-sm shadow-[#DDEAF7]/35">
      <h2 className="mb-4 text-lg font-black text-[#071B33]">Status Distribution</h2>
      <div className="grid items-center gap-5 sm:grid-cols-[160px_1fr] xl:grid-cols-1 2xl:grid-cols-[160px_1fr]">
        <div className="relative mx-auto size-36 rounded-full" style={{ background: `conic-gradient(${gradient})` }}>
          <div className="absolute inset-6 flex flex-col items-center justify-center rounded-full bg-white text-center">
            <strong className="text-2xl font-black text-[#071B33]">{total}</strong>
            <span className="text-xs font-semibold text-[#6B7E95]">Total Documents</span>
          </div>
        </div>
        <div className="space-y-3">
          {groups.map((g) => (
            <div key={g.label} className="flex items-center gap-3 text-sm">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: g.color }} />
              <span className="min-w-0 flex-1 font-semibold text-[#5B6F8A]">{g.label}</span>
              <strong className="font-black text-[#071B33]">{g.count}</strong>
              <span className="text-xs font-semibold text-[#5B6F8A]">({Math.round((g.count / total) * 100)}%)</span>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

function RecentlyUpdated({ docs }: { docs: Document[] }) {
  const recent = [...docs].sort((a, b) => new Date(b.updated_at ?? b.created_at ?? 0).getTime() - new Date(a.updated_at ?? a.created_at ?? 0).getTime());

  return (
    <article className="flex h-fit self-start flex-col rounded-2xl border border-[#E4EEF9] bg-white p-5 shadow-sm shadow-[#DDEAF7]/35">
      <div className="mb-4 flex shrink-0 items-center justify-between">
        <h2 className="text-lg font-black text-[#071B33]">Recently Updated</h2>
        <span className="text-xs font-black text-[#5B6F8A]">3 latest</span>
      </div>
      <div className="space-y-3 pr-1">
        {recent.slice(0, 3).map((doc) => (
          <div key={doc.id} className="grid grid-cols-[40px_1fr] items-center gap-3 rounded-xl p-1.5 transition hover:bg-[#F8FBFF]">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#EAF3FF] text-xs font-black text-[#0879D8]">
              <DescriptionIcon sx={{ fontSize: 18 }} />
            </div>
            <div className="min-w-0">
              <Link href={`/portal/documents/${doc.id}`} className="truncate text-sm font-black text-[#071B33] hover:underline">{doc.file_name.length > 25 ? `${doc.file_name.slice(0, 25)}…` : doc.file_name}</Link>
              <p className="mt-0.5 text-xs font-semibold text-[#5B6F8A]">{formatDate(doc.updated_at ?? doc.created_at)}</p>
              {doc.status && <span className={`mt-1 inline-block rounded-md px-2 py-0.5 text-[10px] font-black ${statusStyle(doc.status)}`}>{getDocumentStatusLabel(doc.status)}</span>}
            </div>
          </div>
        ))}
        {recent.length === 0 ? <p className="text-sm font-semibold text-[#5B6F8A]">No documents available.</p> : null}
      </div>
    </article>
  );
}

export default function DocumentsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState<DocumentListFilters['sort']>('newest');
  const [updatedFrom, setUpdatedFrom] = useState('');
  const [updatedThrough, setUpdatedThrough] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState("5");
  const documentsQuery = useQuery<Document[]>({ queryKey: ['portal-documents'], queryFn: fetchDocuments });
  const profileQuery = useQuery<UserProfile | null>({
    queryKey: ['portal-profile'],
    queryFn: async () => {
      const response = await fetch('/api/portal/proxy?path=%2Fusers%2F', { credentials: 'same-origin' });
      if (!response.ok) throw new Error('Failed to fetch profile');
      return response.json();
    },
  });
  const documents = documentsQuery.data ?? [];
  const statuses = getDocumentStatuses(documents);
  const uiRole = getPortalUiRole(profileQuery.data?.role);
  const isIssuer = uiRole === 'lawyer';
  const visibleDocuments = getVisibleDocuments(documents, {
    query: search,
    status,
    sort,
    updatedFrom,
    updatedThrough,
  });

  const documentStatuses = documents.map((document) => document.status?.toLowerCase());
  const metrics = [
    { label: "Total Documents", value: documents.length, detail: "Uploaded documents", icon: <DescriptionIcon fontSize="small" />, color: "bg-[#EAF3FF] text-[#0879D8]" },
    { label: "Completed", value: documentStatuses.filter((value) => value === "completed").length, detail: "status completed", icon: <CheckCircleIcon fontSize="small" />, color: "bg-[#EAFBF1] text-[#16A34A]" },
    { label: "Ready for Review", value: documentStatuses.filter((value) => value === "ready_for_review").length, detail: "status ready_for_review", icon: <VisibilityIcon fontSize="small" />, color: "bg-[#FFF4DF] text-[#F59E0B]" },
    { label: "Failed", value: documentStatuses.filter((value) => value === "failed").length, detail: "status failed", icon: <ErrorIcon fontSize="small" />, color: "bg-[#FEECEC] text-[#EF4444]" },
  ];

  const perPage = Number(pageSize);
  const totalPages = Math.max(1, Math.ceil(visibleDocuments.length / perPage));
  const safePage = Math.min(page, totalPages - 1);
  const pagedDocs = visibleDocuments.slice(safePage * perPage, (safePage + 1) * perPage);

  return (
    <div className="flex h-full flex-col gap-5">
      <div className="shrink-0 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-black text-[#0C2B49]">Documents</h1>
          <p className="mt-1 text-sm text-[#64748b]">Manage and review documents in the office repository</p>
        </div>
        {isIssuer && <Link href="/portal/upload" className="inline-flex items-center gap-2 rounded-full bg-[#0985E7] px-5 py-2.5 text-sm font-black text-white"><FileUploadIcon sx={{ fontSize: 16 }} />Upload Document</Link>}
      </div>

      {documentsQuery.isLoading ? (
        <div className="flex flex-col gap-3" aria-label="Loading documents">{[1, 2, 3].map((index) => <div key={index} className="h-[80px] animate-pulse rounded-[18px] border border-[#E8F0F8] bg-white" />)}</div>
      ) : documentsQuery.isError ? (
        <div role="alert" className="rounded-[18px] border border-[#E8F0F8] bg-white p-8 text-center"><p className="text-sm font-bold text-[#0C2B49]">Unable to load documents.</p><p className="mt-1 text-xs text-[#64748b]">Check your connection and try again.</p><button type="button" onClick={() => void documentsQuery.refetch()} className="mt-4 rounded-full border border-[#D7E4F2] px-4 py-2 text-sm font-black text-[#0985E7]">Retry</button></div>
      ) : documents.length === 0 ? (
        <div className="rounded-[18px] border border-[#E8F0F8] bg-white p-8 text-center">
          <p className="text-sm font-bold text-[#0C2B49]">{search || status !== 'all' ? 'No documents match your search or filter' : 'No documents yet'}</p>
          <p className="mt-1 text-xs text-[#64748b]">{isIssuer ? 'Upload your first document to get started.' : 'No documents are available yet.'}</p>
          {isIssuer && <Link href="/portal/upload" className="mt-4 inline-flex rounded-full bg-[#0985E7] px-5 py-2.5 text-sm font-black text-white">Upload Document</Link>}
        </div>
      ) : (
        <>
          <section className="shrink-0 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}
          </section>
          <section className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_420px] overflow-hidden">
            <article className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-[#E4EEF9] bg-white shadow-sm shadow-[#DDEAF7]/35">
              <div className="border-b border-[#E4EEF9] p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="mr-auto shrink-0 text-lg font-black text-[#071B33]">Document Directory</h2>
                  <label className="flex w-full items-center gap-2 rounded-xl border border-[#E4EEF9] bg-white px-4 py-2.5 focus-within:border-[#0985E7] sm:w-72">
                    <SearchIcon fontSize="small" className="text-[#4B6382]" />
                    <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search documents..." className="w-full bg-transparent text-sm font-semibold text-[#0C2B49] outline-none placeholder:text-[#9AAAC0]" />
                  </label>
                  <div className="[&>div>button]:py-2.5">
                    <Dropdown value={sort} onChange={(value) => { setSort(value as DocumentListFilters['sort']); setPage(0); }} options={[{ label: "Newest first", value: "newest" }, { label: "Oldest first", value: "oldest" }, { label: "Name A–Z", value: "title" }]} />
                  </div>
                  <FilterDetails summary={<>
                      <FilterListIcon fontSize="small" />
                      More Filters{status !== 'all' || updatedFrom || updatedThrough ? ' •' : ''}
                    </>}>
                    <div className="absolute right-0 top-full z-50 mt-2 grid w-[min(440px,calc(100vw-3rem))] grid-cols-1 gap-4 rounded-xl border border-[#E4EEF9] bg-white p-4 text-sm font-semibold text-[#0C2B49] shadow-lg sm:grid-cols-2">
                      <div className="grid gap-1.5 sm:col-span-2 [&>div>button]:w-full [&>div>button]:justify-between"><span>Status</span>
                        <Dropdown value={status} onChange={(value) => { setStatus(value); setPage(0); }} options={[{ label: "All Statuses", value: "all" }, ...statuses.map((value) => ({ label: getDocumentStatusLabel(value), value }))]} />
                      </div>
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker label="Updated from" format="MM/DD/YYYY" value={updatedFrom ? dayjs(updatedFrom) : null} maxDate={updatedThrough ? dayjs(updatedThrough) : undefined}
                          onChange={(value, context) => { if (context.validationError) return; setUpdatedFrom(value?.format('YYYY-MM-DD') ?? ''); setPage(0); }}
                          slotProps={datePickerSlotProps} />
                        <DatePicker label="Updated through" format="MM/DD/YYYY" value={updatedThrough ? dayjs(updatedThrough) : null} minDate={updatedFrom ? dayjs(updatedFrom) : undefined}
                          onChange={(value, context) => { if (context.validationError) return; setUpdatedThrough(value?.format('YYYY-MM-DD') ?? ''); setPage(0); }}
                          slotProps={datePickerSlotProps} />
                      </LocalizationProvider>
                      <button type="button" onClick={() => { setStatus('all'); setUpdatedFrom(''); setUpdatedThrough(''); setSearch(''); setSort('newest'); setPage(0); }} className="rounded-xl bg-[#EEF4FB] py-2.5 text-[#0879D8] sm:col-span-2">Reset filters</button>
                    </div>
                  </FilterDetails>
                </div>
              </div>
              <div className="admin-table-scroll scrollbar-hide min-h-0 flex-1 overflow-auto">
                <table className="w-full min-w-[920px] text-sm">
                  <thead>
                    <tr className="border-b border-[#D9E5F0] bg-[#F8FBFF] text-left text-xs font-black uppercase tracking-[0.08em] text-[#4B6382]">
                      <th className="px-5 py-3">Document</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Repository record</th>
                      <th className="px-5 py-3">Updated</th>
                      <th className="px-5 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedDocs.map((doc) => (
                      <tr key={doc.id} onClick={() => router.push(`/portal/documents/${doc.id}`)} className="h-[68px] cursor-pointer border-b border-[#F1F5F9] transition hover:bg-[#F8FBFF]">
                        <td className="max-w-[260px] px-5 py-3">
                          <p className="truncate font-bold text-[#071B33]">{doc.file_name}</p>
                          <p className="mt-0.5 text-xs font-semibold text-[#5B6F8A]">{doc.document_number ? `Reference #${doc.document_number}` : 'Reference unavailable'}</p>
                        </td>
                        <td className="px-5 py-3"><DocumentBadges document={doc} /></td>
                        <td className="px-5 py-3 text-xs font-bold text-[#5B6F8A]">{typeof doc.on_chain === 'boolean' ? (doc.on_chain ? 'Repository marked recorded' : 'Repository marked not recorded') : 'Not supplied'}</td>
                        <td className="px-5 py-3 font-semibold text-[#5B6F8A]">{formatDate(doc.updated_at ?? doc.created_at)}</td>
                        <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}><DocumentActions document={doc} role={uiRole} /></td>
                      </tr>
                    ))}
                    {pagedDocs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-5 py-10 text-center text-sm font-semibold text-[#5B6F8A]">
                          <p>{search.trim() ? 'No matching documents' : 'No documents match the current filters.'}</p>
                          {search.trim() && (
                            <button
                              type="button"
                              onClick={() => { setSearch(''); setPage(0); }}
                              className="mt-4 rounded-full border border-[#D7E4F2] px-4 py-2 text-sm font-black text-[#0985E7] hover:bg-[#EEF4FB] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0985E7]"
                            >
                              Clear search
                            </button>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex shrink-0 flex-col gap-3 border-t border-[#E4EEF9] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold text-[#5B6F8A]">Showing {visibleDocuments.length === 0 ? 0 : safePage * perPage + 1}–{Math.min((safePage + 1) * perPage, visibleDocuments.length)} of {visibleDocuments.length} documents</p>
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => setPage((value) => Math.max(0, value - 1))} disabled={safePage === 0} aria-label="Previous page" className="rounded-lg border border-[#E4EEF9] p-2 text-[#4B6382] transition hover:bg-[#EEF4FB] disabled:opacity-35">
                    <ChevronLeftIcon fontSize="small" />
                  </button>
                  {[...Array(Math.min(3, totalPages))].map((_, index) => (
                    <button key={index} type="button" onClick={() => setPage(index)} className={cn("size-9 rounded-lg border text-sm font-black transition", safePage === index ? "border-[#0985E7] bg-[#EAF3FF] text-[#0879D8]" : "border-[#E4EEF9] text-[#0C2B49] hover:bg-[#EEF4FB]")}>{index + 1}</button>
                  ))}
                  {totalPages > 3 && <span className="px-2 text-sm font-black text-[#5B6F8A]">...</span>}
                  <button type="button" onClick={() => setPage((value) => Math.min(totalPages - 1, value + 1))} disabled={safePage >= totalPages - 1} aria-label="Next page" className="rounded-lg border border-[#E4EEF9] p-2 text-[#4B6382] transition hover:bg-[#EEF4FB] disabled:opacity-35">
                    <ChevronRightIcon fontSize="small" />
                  </button>
                  <Dropdown openUp value={pageSize} onChange={setPageSize} options={[{ label: "5 / page", value: "5" }, { label: "10 / page", value: "10" }, { label: "20 / page", value: "20" }]} />
                </div>
              </div>
            </article>
            <aside className="hidden content-start gap-4 md:grid">
              <StatusDistribution docs={documents} />
              <RecentlyUpdated docs={documents} />
            </aside>
          </section>
          <div className="flex flex-col gap-3 md:hidden">{visibleDocuments.map((document) => <article key={document.id} className="rounded-[18px] border border-[#E8F0F8] bg-white p-4"><div className="flex gap-3"><DescriptionIcon sx={{ fontSize: 22, color: '#0985E7' }} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-[#0C2B49]">{document.file_name}</p><p className="mt-1 text-xs text-[#64748b]">{document.document_number ? `Reference #${document.document_number}` : 'Reference unavailable'} · Updated {formatDate(document.updated_at ?? document.created_at)}</p><div className="mt-2"><DocumentBadges document={document} /></div></div></div><div className="mt-4 border-t border-[#E8F0F8] pt-3"><DocumentActions document={document} role={uiRole} /></div></article>)}</div>
        </>
      )}
    </div>
  );
}
