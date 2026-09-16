import type { DemoIntegrityState } from "@/features/documents";

type IntegrityRecord = { onchain_hash?: string | null; is_authentic?: boolean } | null | undefined;

export type IntegrityUiState = 'recorded' | 'not_recorded' | 'unavailable' | 'match' | 'mismatch';

export type IntegrityUiInput = {
  record: IntegrityRecord;
  requestFailed: boolean;
};

export function getIntegrityUiState({ record, requestFailed }: IntegrityUiInput): IntegrityUiState {
  if (requestFailed) return 'unavailable';
  if (!record) return 'not_recorded';
  if (record.is_authentic === false) return 'mismatch';
  return record.onchain_hash ? 'recorded' : 'not_recorded';
}

export function getDemoIntegrityState(state: IntegrityUiState): DemoIntegrityState {
  if (state === 'recorded' || state === 'match') return 'match';
  if (state === 'not_recorded') return 'not-recorded';
  return state;
}

export function shortenIntegrityHash(hash: string): string {
  return hash.length > 20 ? `${hash.slice(0, 10)}…${hash.slice(-8)}` : hash;
}

export type IntegrityResult = {
  label: 'Match' | 'Mismatch' | 'No Record';
  description: string;
  tone: 'success' | 'warning' | 'neutral';
};

export type IntegrityUiCopy = {
  label: string;
  description: string;
  tone: IntegrityResult['tone'];
};

const integrityUiCopy: Record<IntegrityUiState, IntegrityUiCopy> = {
  recorded: {
    label: 'Match',
    description: 'The returned repository record reports a hash match.',
    tone: 'success',
  },
  not_recorded: {
    label: 'No Record',
    description: 'No repository integrity record was returned for this identifier.',
    tone: 'neutral',
  },
  unavailable: {
    label: 'Integrity status unavailable',
    description: 'The repository integrity record could not be retrieved. Please retry.',
    tone: 'warning',
  },
  match: {
    label: 'Match',
    description: 'The returned repository record reports a hash match.',
    tone: 'success',
  },
  mismatch: {
    label: 'Mismatch',
    description: 'The returned repository record reports a hash mismatch.',
    tone: 'warning',
  },
};

export function getIntegrityUiCopy(state: IntegrityUiState): IntegrityUiCopy {
  return integrityUiCopy[state];
}

export const INTEGRITY_SAFETY_MESSAGE =
  'This checks file integrity only. It does not determine legal validity, notarization, or enforceability.';

export function getIntegrityResult(record: IntegrityRecord): IntegrityResult {
  if (!record) {
    return {
      label: 'No Record',
      description: 'No repository integrity record was returned for this identifier.',
      tone: 'neutral',
    };
  }

  if (record.onchain_hash && record.is_authentic !== false) {
    return {
      label: 'Match',
      description: 'The returned repository record reports a hash match.',
      tone: 'success',
    };
  }

  return {
    label: 'Mismatch',
    description: 'The returned repository record reports a hash mismatch.',
    tone: 'warning',
  };
}
