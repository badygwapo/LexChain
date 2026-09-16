'use client';

import { use, useRef, useState } from 'react';
import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import type { ApiSchema } from '@/shared/types/index';
import { PortalChatbot as PortalChatbot } from "@/features/portal/components";
import { DocumentWorkspace } from '@/features/documents/components/document-workspace';
import { getDocumentActions, getDocumentStatusLabel } from '@/features/documents/document-ui';
import { renameDocument, finalizeDocument, createDocumentVersion } from '@/features/documents/document-lifecycle-api';
import { canFinalizeDocument, type DemoDocumentLifecycle } from '@/features/documents/document-lifecycle-ui';
import { getPortalUiRole } from "@/features/access";

type DocumentResponse = ApiSchema<'DocumentResponse'>;
type LifecycleDocumentResponse = DocumentResponse & Partial<DemoDocumentLifecycle>;
type UserProfile = ApiSchema<'UserProfileResponse'>;

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`/api/portal/proxy?path=${encodeURIComponent(path)}`, { credentials: 'same-origin' });
  if (!response.ok) throw new Error(`Failed to fetch ${path}`);
  return response.json();
}

function statusStyle(status: string) {
  const value = status.toLowerCase();
  if (value === 'anchored' || value === 'completed' || value === 'processed') return 'bg-[#EAF8F0] text-[#12A150]';
  if (value === 'processing' || value === 'pending' || value === 'accepted') return 'bg-[#FFF4DD] text-[#B77900]';
  return 'bg-[#EAF4FF] text-[#1689F5]';
}

export default function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [renamePending, setRenamePending] = useState(false);
  const [confirmingFinalize, setConfirmingFinalize] = useState(false);
  const [finalizationResult, setFinalizationResult] = useState<ApiSchema<'RecordResponse'>>();
  const [success, setSuccess] = useState<string>();
  const versionInputRef = useRef<HTMLInputElement>(null);
  const [docQ, profileQ] = useQueries({
    queries: [
      { queryKey: ['portal-doc', id], queryFn: () => getJson<LifecycleDocumentResponse>(`/documents/${id}`) },
      { queryKey: ['portal-profile'], queryFn: () => getJson<UserProfile | null>('/users/') },
    ],
  });

  async function refreshLifecycleQueries() {
    await Promise.all([
      ['portal-doc', id],
      ['portal-doc-chain', id],
      ['portal-document-audit', id],
    ].map((queryKey) => queryClient.invalidateQueries({ queryKey })));
  }

  const finalizeMutation = useMutation({
    mutationFn: () => finalizeDocument(id),
    onSuccess: async (result) => {
      setFinalizationResult(result);
      setConfirmingFinalize(false);
      setSuccess('Document finalized and anchored on-chain.');
      await refreshLifecycleQueries();
    },
  });

  const versionMutation = useMutation({
    mutationFn: (file: File) => createDocumentVersion(id, file),
    onSuccess: refreshLifecycleQueries,
  });

  function openFinalizeConfirmation() {
    finalizeMutation.reset();
    setSuccess(undefined);
    setFinalizationResult(undefined);
    setConfirmingFinalize(true);
  }

  if (docQ.isLoading) return <div className="h-40 animate-pulse rounded-[18px] border border-[#E8F0F8] bg-white" />;
  if (docQ.isError || !docQ.data) return <p className="text-sm text-[#64748b]">Document not found.</p>;

  const document = docQ.data;
  const actions = getDocumentActions(getPortalUiRole(profileQ.data?.role), document);
  const role = getPortalUiRole(profileQ.data?.role);
  const canFinalize = role !== 'unsupported' && document.lifecycle !== undefined
    && canFinalizeDocument(role, document.status, document.lifecycle);

  async function requestRename() {
    const fileName = window.prompt('Document name', document.file_name ?? '');
    if (!fileName?.trim()) return;
    setRenamePending(true);
    try {
      await renameDocument(id, fileName);
      await docQ.refetch();
    } finally {
      setRenamePending(false);
    }
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-5 overflow-x-hidden">
      <header className="flex flex-col gap-3">
        <Link href="/portal/documents" className="flex w-fit items-center gap-1.5 text-sm font-bold text-[#0985E7]">
          <ArrowBackIcon sx={{ fontSize: 16 }} /> Back to documents
        </Link>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.5px] text-[#0985E7]">Document review</span>
            <h1 className="mt-1 text-2xl font-extrabold leading-[30px] text-[#0C2B49]">{document.file_name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px] font-medium text-[#64748b]">
              <span className={`${statusStyle(document.status)} rounded-full px-2.5 py-0.5 text-[11px] font-bold`}>{getDocumentStatusLabel(document.status)}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {role === 'lawyer' && <button type="button" onClick={requestRename} disabled={renamePending} className="rounded-full border border-[#D7E4F2] px-4 py-2.5 text-sm font-extrabold text-[#0C2B49]">Rename document</button>}
            {document.storage_url && <a href={document.storage_url} download className="rounded-full bg-[#0985E7] px-4 py-2.5 text-sm font-extrabold text-white">Download</a>}
            {role === 'lawyer' && canFinalize && !finalizationResult && <button type="button" onClick={openFinalizeConfirmation} className="rounded-full bg-[#0985E7] px-4 py-2.5 text-sm font-extrabold text-white">Finalize</button>}
            {role === 'lawyer' && document.lifecycle?.toUpperCase() !== 'FINALIZED' && <>
              <input ref={versionInputRef} type="file" accept="application/pdf" className="hidden" onChange={(event) => { const input = event.currentTarget; const file = input.files?.[0]; if (file) versionMutation.mutate(file); input.value = ''; }} />
              <button type="button" onClick={() => versionInputRef.current?.click()} disabled={versionMutation.isPending} className="rounded-full border border-[#0985E7] px-4 py-2.5 text-sm font-bold text-[#0985E7]">{versionMutation.isPending ? 'Uploading version…' : 'Upload new version'}</button>
            </>}
            {actions.includes('Review extracted text') && <Link href={`/portal/documents/${id}/review`} className="rounded-full bg-[#0985E7] px-4 py-2.5 text-sm font-extrabold text-white">Review extracted text</Link>}
            {actions.includes('Verify Integrity') && <Link href={`/portal/documents/${id}/verify`} className="rounded-full border border-[#E8F0F8] bg-white px-4 py-2.5 text-sm font-extrabold text-[#0C2B49]">Verify Integrity</Link>}
          </div>
        </div>
      </header>

      <DocumentWorkspace
        document={document}
        role={getPortalUiRole(profileQ.data?.role)}
        finalizationResult={finalizationResult}
        confirmingFinalize={confirmingFinalize}
        isFinalizing={finalizeMutation.isPending}
        finalizeError={finalizeMutation.error instanceof Error ? finalizeMutation.error.message : null}
        onCancelFinalize={() => setConfirmingFinalize(false)}
        onConfirmFinalize={() => finalizeMutation.mutate()}
        success={success}
        versionError={versionMutation.error instanceof Error ? versionMutation.error.message : null}
      />
      <PortalChatbot documentId={id} />
    </div>
  );
}
