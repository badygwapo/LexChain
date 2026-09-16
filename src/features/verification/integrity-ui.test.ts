// @vitest-environment jsdom
import { createElement } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { IntegrityResult } from '@/features/verification/components/integrity-result';
import {
  INTEGRITY_SAFETY_MESSAGE,
  getDemoIntegrityState,
  getIntegrityUiCopy,
  getIntegrityUiState,
  getIntegrityResult,
} from '@/features/verification/integrity-ui';

const matchingRecord = {
  document_id: 'document-123',
  status: 'AUTHENTIC',
  is_authentic: true,
  baseline_trusted: true,
  onchain_hash: 'data-hash',
  snapshot_hash: 'data-hash',
  current_hash: 'data-hash',
  tx_hash: 'transaction-hash',
  onchain_timestamp: 1_700_000_000,
  issued_by: 'issuer-address',
  verified_at: '2026-07-19T00:00:00Z',
  message: 'Document is authentic.',
};

afterEach(cleanup);

describe('getIntegrityUiState', () => {
  it('reports a returned hash as recorded', () => {
    expect(getIntegrityUiState({ record: { onchain_hash: '0xabc' }, requestFailed: false })).toBe('recorded');
  });

  it('reports a failed request as unavailable instead of a positive state', () => {
    expect(getIntegrityUiState({ record: undefined, requestFailed: true })).toBe('unavailable');
    expect(getIntegrityUiState({ record: { onchain_hash: '0xabc' }, requestFailed: true })).toBe('unavailable');
  });

  it('reports an explicit verification failure as mismatch', () => {
    expect(getIntegrityUiState({ record: { onchain_hash: '0xabc', is_authentic: false }, requestFailed: false })).toBe('mismatch');
  });

  it('reports a missing record as not recorded', () => {
    expect(getIntegrityUiState({ record: undefined, requestFailed: false })).toBe('not_recorded');
  });
});

describe('getIntegrityUiCopy', () => {
  it('uses clear copy for an unavailable integrity status', () => {
    expect(getIntegrityUiCopy('unavailable').label).toBe('Integrity status unavailable');
  });
});

describe('getDemoIntegrityState', () => {
  it('normalizes presentation-only integrity states for lifecycle eligibility', () => {
    expect(getDemoIntegrityState('recorded')).toBe('match');
    expect(getDemoIntegrityState('not_recorded')).toBe('not-recorded');
    expect(getDemoIntegrityState('mismatch')).toBe('mismatch');
  });
});

describe('getIntegrityResult', () => {
  it('labels a verified repository response as Match', () => {
    expect(getIntegrityResult({ onchain_hash: '0xabc', is_authentic: true })).toMatchObject({ label: 'Match' });
  });

  it('labels an unverified repository response as Mismatch', () => {
    expect(getIntegrityResult({ onchain_hash: '0xabc', is_authentic: false })).toMatchObject({ label: 'Mismatch' });
  });

  it('labels a missing repository response as No Record', () => {
    expect(getIntegrityResult(undefined)).toMatchObject({ label: 'No Record' });
  });
});

it('uses the required file-integrity-only safety wording', () => {
  expect(INTEGRITY_SAFETY_MESSAGE).toBe(
    'This checks file integrity only. It does not determine legal validity, notarization, or enforceability.',
  );
});

describe('IntegrityResult', () => {
  it('renders No Record when the repository response is missing', () => {
    render(createElement(IntegrityResult));

    expect(screen.getByText('No Record')).toBeTruthy();
    expect(screen.getByText(/no repository integrity record was returned/i)).toBeTruthy();
  });

  it('renders a Match result for a matching repository record', () => {
    render(createElement(IntegrityResult, { record: matchingRecord }));

    expect(screen.getByText('Match')).toBeTruthy();
    expect(screen.getByText(/reports a hash match/i)).toBeTruthy();
    expect(screen.getByText('document-123')).toBeTruthy();
  });

  it('renders a Mismatch result for a non-matching repository record', () => {
    render(createElement(IntegrityResult, { record: { ...matchingRecord, status: 'TAMPERED', is_authentic: false } }));

    expect(screen.getByText('Mismatch')).toBeTruthy();
    expect(screen.getByText(/reports a hash mismatch/i)).toBeTruthy();
  });

  it('does not render legal, fraud, anchoring, or finalization controls', () => {
    render(createElement(IntegrityResult, { record: matchingRecord }));

    expect(screen.getByText(/does not determine legal validity/i)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /legal|fraud|anchor|finali[sz]/i })).toBeNull();
    expect(screen.queryByRole('link', { name: /legal|fraud|anchor|finali[sz]/i })).toBeNull();
  });

  it('announces unavailable and mismatch states as alerts, and only shows retry when supplied', () => {
    const { rerender } = render(createElement(IntegrityResult, { requestFailed: true }));

    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText('Integrity status unavailable')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /retry/i })).toBeNull();

    rerender(createElement(IntegrityResult, { record: { ...matchingRecord, status: 'TAMPERED', is_authentic: false }, onRetry: () => undefined }));

    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByRole('button', { name: /retry integrity check/i })).toBeTruthy();
  });

  it('announces informational states as status', () => {
    render(createElement(IntegrityResult));

    expect(screen.getByRole('status')).toBeTruthy();
  });
});
