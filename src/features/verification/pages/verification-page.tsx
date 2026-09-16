'use client';

import { useState } from 'react';
import type { ApiSchema } from '@/shared/types/index';
import { IntegrityResult } from '@/features/verification/components/integrity-result';
import { verifyRepositoryDocument } from '@/features/verification/integrity-api';

type OnChainVerification = ApiSchema<'DocumentVerificationResponse'>;

export default function VerificationPage() {
  const [documentId, setDocumentId] = useState('');
  const [record, setRecord] = useState<OnChainVerification | undefined>();
  const [hasChecked, setHasChecked] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [requestFailed, setRequestFailed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function checkIntegrity() {
    const identifier = documentId.trim();
    if (!identifier) {
      setError('Enter a repository document ID to check its integrity record.');
      return;
    }

    setIsChecking(true);
    setError(null);
    setHasChecked(false);
    setRecord(undefined);
    setRequestFailed(false);

    try {
      setRecord(await verifyRepositoryDocument(identifier));
      setHasChecked(true);
    } catch (caught) {
      if (caught instanceof Error && caught.message === 'API error: 404') {
        setHasChecked(true);
      } else {
        setRequestFailed(true);
        setHasChecked(true);
      }
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.5px] text-[#0985E7]">Repository check</p>
        <h1 className="mt-1 text-[28px] font-black text-[#0C2B49]">Verification Center</h1>
        <p className="mt-2 text-sm leading-6 text-[#64748b]">Check an existing repository document against its returned integrity record. This page does not accept or retain public files.</p>
      </header>

      <section className="rounded-[18px] border border-[#E8F0F8] bg-white p-5">
        <label className="flex flex-col gap-1.5 text-sm font-bold text-[#0C2B49]">
          Repository document ID
          <input
            value={documentId}
            onChange={(event) => setDocumentId(event.target.value)}
            placeholder="Enter a repository document ID"
            className="rounded-xl border border-[#D7E4F2] px-3 py-2.5 text-sm font-medium outline-none focus:border-[#0985E7]"
          />
        </label>
        {error && <p role="alert" className="mt-3 text-sm font-bold text-red-700">{error}</p>}
        <button type="button" onClick={checkIntegrity} disabled={isChecking} className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#0985E7] px-6 py-3 text-sm font-black text-white disabled:opacity-40">
          {isChecking ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Checking integrity… can take up to a minute
            </>
          ) : 'Check integrity'}
        </button>
      </section>

      {hasChecked && <IntegrityResult record={record} requestFailed={requestFailed} onRetry={checkIntegrity} />}
    </div>
  );
}
