'use client';

import { use } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiSchema } from '@/shared/types/index';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  analyzeExtraction,
  approveExtraction,
  getExtractionReview,
  saveExtractionEdits,
} from '@/features/documents/extraction-api';
import { getPortalUiRole } from "@/features/access";
import ReviewWorkspace from '@/features/documents/components/review-workspace';

type BlockEdit = ApiSchema<'BlockEdit'>;
type UserProfile = ApiSchema<'UserProfileResponse'>;

async function getProfile(): Promise<UserProfile> {
  const response = await fetch('/api/portal/proxy?path=%2Fusers%2F', { credentials: 'same-origin' });
  if (!response.ok) throw new Error('Unable to load your review access.');
  return response.json() as Promise<UserProfile>;
}

function statusFor(error: unknown) {
  return typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number'
    ? error.status
    : undefined;
}

function messageFor(error: unknown) {
  if (statusFor(error) === 409) return 'Review state changed. Refreshing the latest review.';
  return error instanceof Error ? error.message : 'The review action failed. Please try again.';
}

export default function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const extractionKey = ['portal-extraction', id] as const;
  const profileQuery = useQuery({ queryKey: ['portal-profile'], queryFn: getProfile });
  const role = getPortalUiRole(profileQuery.data?.role);
  const extractionQuery = useQuery({
    queryKey: extractionKey,
    queryFn: () => getExtractionReview(id),
    enabled: role === 'lawyer',
    retry: false,
  });

  async function invalidateDocumentQueries() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['portal-doc', id] }),
      queryClient.invalidateQueries({ queryKey: ['portal-doc-status', id] }),
    ]);
  }

  async function refreshStaleReview(error: unknown) {
    if (statusFor(error) === 409) {
      await queryClient.invalidateQueries({ queryKey: extractionKey });
    }
  }

  const saveMutation = useMutation({
    mutationFn: (edits: BlockEdit[]) => saveExtractionEdits(id, edits),
    onSuccess: async (result) => {
      queryClient.setQueryData(extractionKey, result);
      await invalidateDocumentQueries();
    },
    onError: refreshStaleReview,
  });
  const analyzeMutation = useMutation({
    mutationFn: () => analyzeExtraction(id),
    onSuccess: async (result) => {
      queryClient.setQueryData(extractionKey, result);
      await invalidateDocumentQueries();
    },
    onError: refreshStaleReview,
  });
  const approveMutation = useMutation({
    mutationFn: () => approveExtraction(id),
    onSuccess: async () => {
      await Promise.all([
        invalidateDocumentQueries(),
        queryClient.invalidateQueries({ queryKey: extractionKey }),
      ]);
      router.replace(`/portal/upload/processing?id=${id}`);
    },
    onError: refreshStaleReview,
  });

  if (profileQuery.isPending) return <p className="text-sm font-semibold text-[#64748b]">Loading review access…</p>;
  if (profileQuery.isError) return <p role="alert" className="text-sm font-semibold text-[#B42318]">{messageFor(profileQuery.error)}</p>;
  if (role !== 'lawyer') {
    return (
      <section className="max-w-xl rounded-[18px] border border-[#E8F0F8] bg-white p-6">
        <h1 className="text-xl font-black text-[#0C2B49]">Review unavailable</h1>
        <p className="mt-2 text-sm text-[#64748b]">Users can view shared documents, but only Lawyers can review extracted text.</p>
      </section>
    );
  }
  if (extractionQuery.isPending) return <p className="text-sm font-semibold text-[#64748b]">Loading extracted text…</p>;
  if (extractionQuery.isError || !extractionQuery.data) {
    if (statusFor(extractionQuery.error) === 404) {
      return (
        <section role="alert" className="max-w-xl rounded-[18px] border border-[#F5D7A1] bg-[#FFF9EC] p-6 text-sm text-[#0C2B49]">
          <p className="font-bold">This review is not ready or you no longer have access.</p>
          <p className="mt-2">Check the document or its processing status, then try again when review is available.</p>
          <div className="mt-4 flex gap-4 font-bold text-[#0985E7]">
            <Link href={`/portal/documents/${id}`}>Back to document</Link>
            <Link href={`/portal/upload/processing?id=${id}`}>View processing status</Link>
          </div>
        </section>
      );
    }
    return <p role="alert" className="text-sm font-semibold text-[#B42318]">{messageFor(extractionQuery.error)}</p>;
  }

  const actionError = saveMutation.error ?? analyzeMutation.error ?? approveMutation.error;
  return (
    <div className="flex w-full min-w-0 flex-col gap-5 overflow-x-hidden md:h-[calc(100dvh-7rem)] md:overflow-hidden">
      <header>
        <Link href={`/portal/documents/${id}`} className="text-sm font-bold text-[#0985E7]">← Back to document</Link>
        <h1 className="mt-3 text-[28px] font-black text-[#0C2B49]">Review extracted text</h1>
        <p className="mt-1 text-sm text-[#64748b]">Correct OCR text and resolve flags before approving it for processing.</p>
      </header>
      <ReviewWorkspace
        review={extractionQuery.data}
        actionError={actionError ? messageFor(actionError) : null}
        isSaving={saveMutation.isPending}
        isAnalyzing={analyzeMutation.isPending}
        isApproving={approveMutation.isPending}
        onSave={saveMutation.mutateAsync}
        onAnalyze={analyzeMutation.mutateAsync}
        onApprove={approveMutation.mutateAsync}
      />
    </div>
  );
}
