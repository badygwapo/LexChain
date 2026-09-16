'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import type { ApiSchema } from '@/shared/types/index';
import { listDocumentVersions } from '@/features/documents/document-lifecycle-api';
import type { DemoDocumentLifecycle } from '@/features/documents/document-lifecycle-ui';
import { shortenIntegrityHash } from "@/features/verification";
import type { PortalUiRole } from "@/features/access";

type WorkspaceDocument = Partial<DemoDocumentLifecycle> & {
  document_id: string;
  file_name?: string | null;
  on_chain?: boolean;
  content_type?: string | null;
  status?: string | null;
  storage_url?: string | null;
  summary?: string | null;
  labels?: unknown[] | null;
  entities?: unknown[] | null;
  risk_flags?: unknown[] | null;
};

const tabs = ['Overview', 'Original PDF', 'Blockchain', 'Versions', 'Access', 'Activity'] as const;
type Tab = typeof tabs[number];

function readable(value: unknown): string {
  if (value == null) return 'Not supplied';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'object' && !Array.isArray(value)) {
    const entries = Object.entries(value);
    if (entries.length === 1) {
      const [key, entryValue] = entries[0];
      return `${key} — ${readable(entryValue)}`;
    }
    if (entries.length === 2 && 'type' in value && 'value' in value) {
      return `${readable(value.value)} (${String(value.type).replace(/_/g, ' ').toLowerCase()})`;
    }
    if ('clause' in value && 'severity' in value) {
      return `${value.clause} — ${value.severity}`;
    }
  }
  return JSON.stringify(value);
}

function lifecycleLabel(value: DemoDocumentLifecycle['lifecycle'] | undefined) {
  if (!value) return 'Not available';
  return `${value[0].toUpperCase()}${value.slice(1)}`;
}

function anchorLabel(lifecycleStatus: string | undefined, onChain: boolean | undefined) {
  if (onChain) return 'Anchored';
  if (lifecycleStatus?.toUpperCase() === 'FINALIZED') return 'Anchoring';
  return 'Not available';
}

function formatDate(value: string | null | undefined) {
  return value
    ? new Date(value).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
    : 'Not available';
}

function InsightGroup({ title, items }: { title: string; items?: unknown[] | null }) {
  if (!items?.length) return null;

  return (
    <section>
      <h3 className="text-xs font-black uppercase tracking-[0.08em] text-[#64748b]">{title}</h3>
      <ul className="mt-2 space-y-2">
        {items.map((item, index) => <li key={index} className="rounded-xl bg-[#F8FBFF] px-3 py-2 text-sm text-[#0C2B49]">{readable(item)}</li>)}
      </ul>
    </section>
  );
}

type DocumentWorkspaceProps = {
  document: WorkspaceDocument;
  role: PortalUiRole;
  finalizationResult?: ApiSchema<'RecordResponse'>;
  confirmingFinalize?: boolean;
  isFinalizing?: boolean;
  finalizeError?: string | null;
  onCancelFinalize?: () => void;
  onConfirmFinalize?: () => void;
  success?: string;
  versionError?: string | null;
};

const finalizationConfirmation = 'This will anchor the approved document hash on-chain and finalize the document. This action cannot be undone.';

export function DocumentWorkspace({
  document,
  role,
  finalizationResult,
  confirmingFinalize = false,
  isFinalizing = false,
  finalizeError = null,
  onCancelFinalize,
  onConfirmFinalize,
  success,
  versionError = null,
}: DocumentWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const versionsQuery = useQuery({ queryKey: ['portal-doc-versions', document.document_id], queryFn: () => listDocumentVersions(document.document_id) });
  const hasInsights = Boolean(document.summary || document.labels?.length || document.entities?.length || document.risk_flags?.length);
  const lifecycle = document;

  return (
    <section className="rounded-[18px] border border-[#E8F0F8] bg-white shadow-[0_4px_12px_rgba(19,59,115,0.05)]">
      <div role="tablist" aria-label="Document workspace" className="flex overflow-x-auto border-b border-[#E8F0F8] px-3">
        {tabs.map((tab) => (
          <button
            key={tab}
            role="tab"
            type="button"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 border-b-2 px-4 py-3 text-sm font-extrabold ${activeTab === tab ? 'border-[#0985E7] text-[#0985E7]' : 'border-transparent text-[#64748b]'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="p-5">
        {activeTab === 'Overview' && (
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold text-[#0C2B49]">Overview</h2>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="font-bold text-[#64748b]">Filename</dt><dd className="mt-1 text-[#0C2B49]">{document.file_name ?? 'Not supplied'}</dd></div>
              <div><dt className="font-bold text-[#64748b]">Content type</dt><dd className="mt-1 text-[#0C2B49]">{document.content_type ?? 'Not supplied'}</dd></div>
              <div><dt className="font-bold text-[#64748b]">Lifecycle status</dt><dd className="mt-1 text-[#0C2B49]">{document.status ?? 'Not supplied'}</dd></div>
              <div><dt className="font-bold text-[#64748b]">Document lifecycle</dt><dd className="mt-1 text-[#0C2B49]">{lifecycleLabel(lifecycle.lifecycle)}</dd></div>
              <div><dt className="font-bold text-[#64748b]">Document hash</dt><dd title={document.document_hash ?? undefined} className="mt-1 break-all font-mono text-[#0C2B49]">{document.document_hash ? shortenIntegrityHash(document.document_hash) : 'Not available'}</dd></div>
              <div><dt className="font-bold text-[#64748b]">Finalized</dt><dd className="mt-1 text-[#0C2B49]">{formatDate(lifecycle.finalized_at)}</dd></div>
              <div><dt className="font-bold text-[#64748b]">Anchor state</dt><dd className="mt-1 text-[#0C2B49]">{anchorLabel(lifecycle.lifecycle, document.on_chain)}</dd></div>
            </dl>
            {hasInsights && <div className="space-y-5 border-t border-[#E8F0F8] pt-5">
              <p className="text-sm leading-6 text-[#64748b]">AI-generated assistance only. Review it carefully; the original document remains authoritative.</p>
              {document.summary && <section><h3 className="text-xs font-black uppercase tracking-[0.08em] text-[#64748b]">Summary</h3><p className="mt-2 text-sm leading-6 text-[#0C2B49]">{document.summary}</p></section>}
              <InsightGroup title="Labels" items={document.labels} />
              <InsightGroup title="Entities" items={document.entities} />
              <InsightGroup title="Risk flags" items={document.risk_flags} />
            </div>}
            {versionError && <p role="alert" className="text-sm font-bold text-[#B42318]">{versionError}</p>}
            {success && <p role="status" className="rounded-xl border border-[#BCE8CC] bg-[#F1FBF5] px-4 py-3 text-sm font-bold text-[#0C7A3B]">{success}</p>}
            {finalizationResult && <dl className="grid gap-3 rounded-xl bg-[#F8FBFF] p-4 text-sm sm:grid-cols-2"><div><dt className="font-bold text-[#64748b]">Data hash</dt><dd className="mt-1 break-all font-mono text-[#0C2B49]">{finalizationResult.data_hash}</dd></div><div><dt className="font-bold text-[#64748b]">Transaction hash</dt><dd className="mt-1 break-all font-mono text-[#0C2B49]">{finalizationResult.tx_hash}</dd></div></dl>}
            <p className="text-sm leading-6 text-[#64748b]">Use this workspace to review the original file, derived assistance, and available integrity information.</p>
            {confirmingFinalize && (
              <div role="dialog" aria-modal="true" aria-label="Confirm finalization" className="fixed inset-0 z-50 flex items-center justify-center bg-[#0C2B49]/40 p-4">
                <div className="w-full max-w-md rounded-2xl border border-[#CFE7FC] bg-white p-6 shadow-[0_16px_40px_rgba(12,43,73,0.25)]">
                  <p className="text-lg font-black text-[#0C2B49]">Finalize this document?</p>
                  <p className="mt-2 text-sm leading-6 text-[#64748b]">{finalizationConfirmation}</p>
                  {finalizeError && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-bold text-[#B42318]">{finalizeError}</p>}
                  <div className="mt-5 flex flex-wrap justify-end gap-2">
                    <button type="button" onClick={onCancelFinalize} disabled={isFinalizing} className="rounded-full border border-[#D6E3F1] px-4 py-2 text-sm font-bold text-[#0C2B49] disabled:opacity-60">Cancel</button>
                    <button type="button" onClick={onConfirmFinalize} disabled={isFinalizing} className="rounded-full bg-[#0985E7] px-4 py-2 text-sm font-bold text-white disabled:opacity-60">{isFinalizing ? 'Finalizing…' : 'Confirm finalization'}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'Original PDF' && (document.storage_url ? (
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold text-[#0C2B49]">Original PDF</h2>
            <p className="text-sm leading-6 text-[#64748b]">This is the source document and is available for viewing or download only. It cannot be edited in LexChain.</p>
            <div className="flex flex-wrap gap-3">
              <a href={document.storage_url} target="_blank" rel="noreferrer" className="rounded-full bg-[#0985E7] px-4 py-2.5 text-sm font-extrabold text-white">Open original PDF</a>
              <a href={document.storage_url} download className="rounded-full border border-[#E8F0F8] px-4 py-2.5 text-sm font-extrabold text-[#0C2B49]">Download original PDF</a>
            </div>
          </div>
        ) : <p className="text-sm text-[#64748b]">The original PDF is not available in the current document record.</p>)}



        {activeTab === 'Blockchain' && (
          <div className="space-y-4"><p className="text-sm text-[#64748b]">No blockchain record is available in the current document record.</p></div>
        )}

        {activeTab === 'Versions' && (
          <div className="space-y-4">
            <div><h2 className="text-lg font-extrabold text-[#0C2B49]">Versions</h2><p className="mt-1 text-sm text-[#64748b]">Each uploaded version remains in the document history.</p></div>
            {versionsQuery.isLoading && <p className="text-sm text-[#64748b]">Loading versions…</p>}
            {versionsQuery.isError && <p role="alert" className="text-sm font-bold text-[#B42318]">Unable to load document versions.</p>}
            {versionsQuery.data?.versions.map((version) => <article key={version.document_id} className="rounded-xl border border-[#E8F0F8] bg-[#F8FBFF] p-4"><p className="font-bold text-[#0C2B49]">Version {version.version}{version.is_latest ? ' · Latest' : ''}</p><p className="mt-1 text-sm text-[#64748b]">{version.file_name} · {version.status}</p></article>)}
          </div>
        )}

        {activeTab === 'Access' && (
          <div className="space-y-3"><h2 className="text-lg font-extrabold text-[#0C2B49]">Access</h2><p className="text-sm text-[#64748b]">Manage access on the existing document participant surface.</p>          {role === 'lawyer' && <Link href={`/portal/documents/${document.document_id}/participants`} className="inline-flex rounded-full bg-[#0985E7] px-4 py-2.5 text-sm font-extrabold text-white">Manage document participants</Link>}</div>
        )}

        {activeTab === 'Activity' && (
          <div className="space-y-3"><h2 className="text-lg font-extrabold text-[#0C2B49]">Activity</h2><p className="text-sm text-[#64748b]">Review lifecycle and access events on the existing audit surface.</p>          {role === 'lawyer' && <Link href={`/portal/documents/${document.document_id}/activity`} className="inline-flex rounded-full bg-[#0985E7] px-4 py-2.5 text-sm font-extrabold text-white">View document activity</Link>}</div>
        )}
      </div>
    </section>
  );
}
