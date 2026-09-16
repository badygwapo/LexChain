import { describe, expect, it } from 'vitest';
import {
  canFinalizeDocument,
  canRestoreDocument,
  type DemoDocumentSnapshot,
} from '@/features/documents/document-lifecycle-ui';

const snapshot: DemoDocumentSnapshot = {
  id: 'snapshot-1',
  document_id: 'document-1',
  text_hash: 'a'.repeat(64),
  created_at: '2026-07-26T00:00:00.000Z',
};

describe('document lifecycle UI', () => {
  it('allows a lawyer to finalize a completed draft', () => {
    expect(canFinalizeDocument('lawyer', 'COMPLETED', 'draft')).toBe(true);
    // @ts-expect-error Exercises normalization of an unchecked backend value.
    expect(canFinalizeDocument('lawyer', 'COMPLETED', 'DRAFT')).toBe(true);
    expect(canFinalizeDocument('user', 'COMPLETED', 'draft')).toBe(false);
    expect(canFinalizeDocument('lawyer', 'PROCESSING', 'draft')).toBe(false);
    expect(canFinalizeDocument('lawyer', 'COMPLETED', 'finalized')).toBe(false);
  });

  it('allows an issuer to restore only a mismatched document with a snapshot', () => {
    expect(canRestoreDocument('lawyer', 'mismatch', [snapshot])).toBe(true);
    expect(canRestoreDocument('user', 'mismatch', [snapshot])).toBe(false);
    expect(canRestoreDocument('lawyer', 'match', [snapshot])).toBe(false);
    expect(canRestoreDocument('lawyer', 'mismatch', [])).toBe(false);
  });
});
