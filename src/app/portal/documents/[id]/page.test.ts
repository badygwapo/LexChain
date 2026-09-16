import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const pageSource = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf8');
const documentPageSource = readFileSync(
  resolve(process.cwd(), 'src/features/documents/pages/documents-id-page.tsx'),
  'utf8',
);
const workspaceSource = readFileSync(
  resolve(process.cwd(), 'src/features/documents/components/document-workspace.tsx'),
  'utf8',
);

it('does not auto-run the on-chain verification on page load', () => {
  expect(pageSource).not.toContain("import { verifyRepositoryDocument } from '@/features/verification/integrity-api';");
  expect(pageSource).not.toContain("queryFn: () => verifyRepositoryDocument(id)");
  expect(pageSource).not.toContain('Integrity record available');
  expect(pageSource).not.toContain('Integrity mismatch');
  expect(pageSource).not.toContain('Integrity status unavailable');
});

it('shows the document hash from the document record only', () => {
  expect(workspaceSource).toContain('document.document_hash');
  expect(pageSource).not.toContain('content_hash');
  expect(workspaceSource).not.toContain('content_hash');
});

it('links issuers with an awaiting-review document to extracted text review', () => {
  expect(documentPageSource).toContain("actions.includes('Review extracted text')");
  expect(documentPageSource).toContain('href={`/portal/documents/${id}/review`}');
});
