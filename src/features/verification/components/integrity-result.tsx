import type { ApiSchema } from '@/shared/types/index';
import {
  getIntegrityUiCopy,
  getIntegrityUiState,
  INTEGRITY_SAFETY_MESSAGE,
} from '@/features/verification/integrity-ui';

type OnChainVerification = ApiSchema<'DocumentVerificationResponse'>;

const toneClasses = {
  success: 'border-[#BCE8CC] bg-[#F1FBF5] text-[#0C7A3B]',
  warning: 'border-[#F5D7A1] bg-[#FFF9EC] text-[#9A5D00]',
  neutral: 'border-[#D7E4F2] bg-[#F8FBFF] text-[#45627D]',
};

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="font-bold text-[#64748b]">{label}</dt>
      <dd className="mt-1 break-all text-[#0C2B49]">{value || '—'}</dd>
    </div>
  );
}

export function IntegrityResult({
  record,
  requestFailed = false,
  onRetry,
}: {
  record?: OnChainVerification;
  requestFailed?: boolean;
  onRetry?: () => void;
}) {
  const state = getIntegrityUiState({ record, requestFailed });
  const result = getIntegrityUiCopy(state);
  const role = state === 'unavailable' || state === 'mismatch' ? 'alert' : 'status';

  return (
    <section role={role} className={`rounded-[18px] border p-5 ${toneClasses[result.tone]}`}>
      <p className="text-lg font-black">{result.label}</p>
      <p className="mt-1 text-sm leading-6">{result.description}</p>

      {record && (
        <dl className="mt-5 grid gap-4 rounded-xl bg-white/80 p-4 text-sm sm:grid-cols-2">
          <Detail label="Document ID" value={record.document_id} />
          <Detail label="On-chain hash" value={record.onchain_hash} />
          <Detail label="Snapshot hash" value={record.snapshot_hash} />
          <Detail label="Current hash" value={record.current_hash} />
          <Detail label="Transaction hash" value={record.tx_hash} />
          <Detail label="On-chain timestamp" value={String(record.onchain_timestamp)} />
          <Detail label="Issued by" value={record.issued_by} />
          <Detail label="Verified at" value={record.verified_at} />
        </dl>
      )}

      {onRetry && (
        <button type="button" onClick={onRetry} className="mt-4 rounded-full border border-current/30 px-4 py-2 text-sm font-bold">
          Retry integrity check
        </button>
      )}

      <p className="mt-5 border-t border-current/15 pt-4 text-xs leading-5">{INTEGRITY_SAFETY_MESSAGE}</p>
    </section>
  );
}
