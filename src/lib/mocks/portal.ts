import type { ApiSchema } from '@/shared/types/index';
export { isMockMode } from "./mode";

const mockParticipantId = 'mock-document-participant';
const mockIssuerId = 'mock-document-issuer';

export type DemoIntegrityState = 'match' | 'mismatch' | 'not-recorded' | 'unavailable';

export type DemoAnchorStatus = 'pending' | 'confirmed' | 'failed';

export type DemoDocumentSnapshot = {
  id: string;
  document_id: string;
  text_hash: string;
  created_at: string;
};

export type DemoDocumentLifecycle = {
  lifecycle: 'draft' | 'finalized' | 'restored';
  document_hash: string | null;
  finalized_at: string | null;
  finalized_by: string | null;
  anchor_status: DemoAnchorStatus | null;
  snapshots: DemoDocumentSnapshot[];
};

type MockDocument = {
  id: string;
  document_id: string;
  document_number: number;
  file_name: string;
  storage_url: string;
  content_type: string;
  status: string;
  on_chain: boolean;
  is_latest: boolean;
  summary: string;
  labels: string[];
  entities: Array<Record<string, string>>;
  risk_flags: Array<Record<string, string>>;
  created_at: string;
  updated_at: string;
  audit_log: Array<Record<string, unknown>>;
} & DemoDocumentLifecycle & {
  integrity_state: DemoIntegrityState;
};

type MockInvitation = {
  id: string;
  document_id: string;
  document_title: string;
  role: string;
  status: string;
  created_at: string;
};

type MockDocumentRequest = {
  id: string;
  requester_id: string;
  requester_email: string;
  requester_name: string;
  document_id: string;
  document_name: string | null;
  description: string;
  status: string;
  lawyer_id: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
};

type MockBook = {
  id: string;
  book_number: number;
  series_year: number;
  document_count: number;
  page_count: number;
  is_full: boolean;
  created_at: string;
  updated_at: string | null;
};

type ExtractionBlock = ApiSchema<'ExtractionBlock'>;
type ExtractionFlag = ApiSchema<'ExtractionFlag'>;
type ExtractionReview = ApiSchema<'ExtractionReviewResponse'>;
type UpdateExtractionRequest = ApiSchema<'UpdateExtractionRequest'>;
type BlockEdit = ApiSchema<'BlockEdit'>;
type ApproveExtractionResponse = ApiSchema<'ApproveExtractionResponse'>;

type MockExtraction = Omit<Pick<ExtractionReview,
  'extraction_id' | 'engine' | 'page_count' | 'confidence_avg' | 'blocks' | 'is_reviewed' | 'reviewed_by' | 'reviewed_at'
>, 'blocks'> & { blocks: ExtractionBlock[] };

function canFinalizeMockDocument(document: MockDocument, extraction: MockExtraction | undefined) {
  return document.lifecycle === 'draft' && document.status.toUpperCase() === 'COMPLETED' && extraction?.is_reviewed;
}

function canRestoreMockDocument(document: MockDocument) {
  return document.integrity_state === 'mismatch' && document.snapshots.length > 0;
}

function mockCreationAudit(documentId: string, createdAt: string) {
  return {
    id: `mock-audit-${documentId}`,
    document_id: documentId,
    user_id: mockIssuerId,
    action: 'document_created',
    details: { source: 'mock portal' },
    created_at: createdAt,
  };
}

const issuerProfile = {
  email: 'issuer@example.com',
  f_name: 'Document',
  l_name: 'Issuer',
  avatar: 'icon1',
  role: 'lawyer',
  mfa_enabled: false,
};

const participantProfile = {
  email: 'participant@example.com',
  f_name: 'Document',
  l_name: 'Participant',
  avatar: 'icon2',
  role: 'user',
  mfa_enabled: false,
};

let documents: MockDocument[] = [
  {
    id: 'mock-document-1',
    document_id: 'mock-document-1',
    document_number: 1001,
    file_name: 'Lease Agreement.pdf',
    storage_url: '/mock-documents/lease-agreement.pdf',
    content_type: 'application/pdf',
    status: 'anchored',
    on_chain: true,
    is_latest: true,
    summary: 'A sample residential lease agreement between the document owner and a tenant.',
    labels: ['lease', 'agreement'],
    entities: [{ party: 'Jane Doe' }, { party: 'Sample Tenant' }],
    risk_flags: [],
    created_at: '2026-07-10T09:00:00.000Z',
    updated_at: '2026-07-10T09:05:00.000Z',
    audit_log: [mockCreationAudit('mock-document-1', '2026-07-10T09:00:00.000Z')],
    lifecycle: 'finalized',
    document_hash: 'a'.repeat(64),
    finalized_at: '2026-07-10T09:05:00.000Z',
    finalized_by: mockIssuerId,
    anchor_status: 'confirmed',
    snapshots: [{
      id: 'mock-snapshot-1',
      document_id: 'mock-document-1',
      text_hash: 'a'.repeat(64),
      created_at: '2026-07-10T09:05:00.000Z',
    }],
    integrity_state: 'match',
  },
  {
    id: 'mock-document-2',
    document_id: 'mock-document-2',
    document_number: 1002,
    file_name: 'Certificate of Employment.pdf',
    storage_url: '/mock-documents/certificate-of-employment.pdf',
    content_type: 'application/pdf',
    status: 'ready_for_review',
    on_chain: false,
    is_latest: true,
    summary: 'A sample certificate of employment issued to Jane Doe.',
    labels: ['certificate', 'employment'],
    entities: [{ employee: 'Jane Doe' }],
    risk_flags: [{ note: 'Awaiting document processing.' }],
    created_at: '2026-07-13T13:30:00.000Z',
    updated_at: '2026-07-13T13:30:00.000Z',
    audit_log: [mockCreationAudit('mock-document-2', '2026-07-13T13:30:00.000Z')],
    lifecycle: 'draft',
    document_hash: null,
    finalized_at: null,
    finalized_by: null,
    anchor_status: null,
    snapshots: [],
    integrity_state: 'not-recorded',
  },
  {
    id: 'mock-document-3',
    document_id: 'mock-document-3',
    document_number: 1003,
    file_name: 'Restoration Review.pdf',
    storage_url: '/mock-documents/restoration-review.pdf',
    content_type: 'application/pdf',
    status: 'anchored',
    on_chain: true,
    is_latest: true,
    summary: 'A seeded document with a deliberately mismatched integrity result for restoration review.',
    labels: ['restoration', 'integrity'],
    entities: [{ party: 'Jane Doe' }],
    risk_flags: [{ note: 'Integrity mismatch detected.' }],
    created_at: '2026-07-15T10:00:00.000Z',
    updated_at: '2026-07-15T10:05:00.000Z',
    audit_log: [mockCreationAudit('mock-document-3', '2026-07-15T10:00:00.000Z')],
    lifecycle: 'finalized',
    document_hash: 'b'.repeat(64),
    finalized_at: '2026-07-15T10:05:00.000Z',
    finalized_by: mockIssuerId,
    anchor_status: 'confirmed',
    snapshots: [{
      id: 'mock-snapshot-3',
      document_id: 'mock-document-3',
      text_hash: 'b'.repeat(64),
      created_at: '2026-07-15T10:05:00.000Z',
    }],
    integrity_state: 'mismatch',
  },
  {
    id: 'mock-document-4',
    document_id: 'mock-document-4',
    document_number: 1004,
    file_name: 'Participant Shared Draft.pdf',
    storage_url: '/mock-documents/participant-shared-draft.pdf',
    content_type: 'application/pdf',
    status: 'completed',
    on_chain: false,
    is_latest: true,
    summary: 'A completed draft shared with the document participant for read-only review.',
    labels: ['shared', 'participant'],
    entities: [{ party: 'Alex User' }],
    risk_flags: [],
    created_at: '2026-07-18T09:00:00.000Z',
    updated_at: '2026-07-18T09:00:00.000Z',
    audit_log: [mockCreationAudit('mock-document-4', '2026-07-18T09:00:00.000Z')],
    lifecycle: 'draft',
    document_hash: null,
    finalized_at: null,
    finalized_by: null,
    anchor_status: null,
    snapshots: [],
    integrity_state: 'not-recorded',
  },
];

let notifications = [
  {
    id: 'mock-notification-1',
    title: 'Document anchored',
    body: 'Lease Agreement.pdf is now recorded on-chain.',
    is_read: false,
    created_at: '2026-07-10T09:05:00.000Z',
  },
  {
    id: 'mock-notification-2',
    title: 'Document processing',
    body: 'Certificate of Employment.pdf is being processed.',
    is_read: false,
    created_at: '2026-07-13T13:30:00.000Z',
  },
];

let invitations: MockInvitation[] = [
  {
    id: 'mock-invitation-1',
    document_id: 'mock-document-1',
    document_title: 'Lease Agreement.pdf',
    role: 'viewer',
    status: 'pending',
    created_at: '2026-07-12T10:00:00.000Z',
  },
];

let documentRequests: MockDocumentRequest[] = [
  {
    id: 'mock-request-1',
    requester_id: mockParticipantId,
    requester_email: participantProfile.email,
    requester_name: `${participantProfile.f_name} ${participantProfile.l_name}`,
    document_id: 'mock-document-1',
    document_name: 'Lease Agreement.pdf',
    description: 'I need an e-copy for my records.',
    status: 'pending',
    lawyer_id: mockIssuerId,
    rejection_reason: null,
    created_at: '2026-07-11T10:00:00.000Z',
    updated_at: '2026-07-11T10:00:00.000Z',
  },
  {
    id: 'mock-request-2',
    requester_id: mockParticipantId,
    requester_email: participantProfile.email,
    requester_name: `${participantProfile.f_name} ${participantProfile.l_name}`,
    document_id: 'mock-document-2',
    document_name: 'Certificate of Employment.pdf',
    description: 'Please send the completed certificate.',
    status: 'approved',
    lawyer_id: mockIssuerId,
    rejection_reason: null,
    created_at: '2026-07-09T10:00:00.000Z',
    updated_at: '2026-07-10T10:00:00.000Z',
  },
];

let books: MockBook[] = [
  {
    id: 'mock-book-1',
    book_number: 1,
    series_year: 2026,
    document_count: 2,
    page_count: 2,
    is_full: false,
    created_at: '2026-07-01T08:00:00.000Z',
    updated_at: null,
  },
];

let extractions: Record<string, MockExtraction> = {
  'mock-document-2': {
    extraction_id: 'mock-extraction-2',
    engine: 'mock-ocr',
    page_count: 1,
    confidence_avg: 0.87,
    blocks: [
      {
        index: 0,
        editable: true,
        type: 'text',
        text: 'Jane Doe is employed by LexChain.',
        original_text: 'Jane Doe is employed by LexChain.',
        bbox: [80, 90, 920, 180],
        page_idx: 0,
        text_level: 1,
        score: null,
        is_html: false,
        edited: false,
      },
      {
        index: 1,
        editable: true,
        type: 'text',
        text: 'Employrnent certificate',
        original_text: 'Employrnent certificate',
        bbox: [80, 200, 920, 290],
        page_idx: 0,
        text_level: null,
        score: 0.78,
        is_html: false,
        edited: false,
      },
      {
        index: 2,
        editable: false,
        type: 'image',
        text: '',
        original_text: '',
        bbox: [650, 700, 900, 900],
        page_idx: 0,
        text_level: null,
        score: null,
        is_html: false,
        edited: false,
      },
    ],
    is_reviewed: false,
    reviewed_by: null,
    reviewed_at: null,
  },
};

let extractionFlags: Record<string, ExtractionFlag[]> = {
  'mock-document-2': [{
    block_index: 1,
    kind: 'low_confidence',
    severity: 'medium',
    message: 'OCR confidence is below the review threshold.',
    excerpt: 'Employrnent certificate',
  }],
};

const sharedDocumentIds = new Set(['mock-document-4']);

function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

function error(message: string, status: number) {
  return json({ message }, status);
}

function documentFor(id: string) {
  return documents.find((document) => document.id === id);
}

function extractionReview(documentId: string): ExtractionReview | null {
  const extraction = extractions[documentId];
  const document = documentFor(documentId);
  if (!extraction || !document) return null;
  const flags = extractionFlags[documentId] ?? [];
  return {
    document_id: documentId,
    file_name: document.file_name,
    storage_url: document.storage_url,
    ...extraction,
    status: extraction.is_reviewed ? 'COMPLETED' : 'AWAITING_REVIEW',
    flags,
    flag_count: flags.length,
    high_severity_count: flags.filter((flag) => flag.severity === 'high').length,
    edited_block_count: extraction.blocks.filter((block) => block.edited).length,
  };
}

function deterministicHash(value: string) {
  return value.split('').map((character) => character.charCodeAt(0).toString(16)).join('').padEnd(64, '0').slice(0, 64);
}

function canAccessDocument(token: string | undefined, document: MockDocument) {
  return !isMockParticipant(token) || sharedDocumentIds.has(document.id);
}

function canMutateDocumentLifecycle(document: MockDocument) {
  return !sharedDocumentIds.has(document.id);
}

function documentPaths(path: string) {
  return path.match(/^\/documents\/([^/]+)(?:\/(parties|versions|audit-logs|verify))?\/?$/);
}

function mockPdfFileName(fileName: string) {
  return fileName.toLowerCase().endsWith('.pdf') ? fileName : `${fileName}.pdf`;
}

function validFileName(value: string | null) {
  const fileName = value?.trim();
  return fileName
    && mockPdfFileName(fileName).length <= 255
    && !/[\/\\\u0000-\u001F\u007F]/.test(fileName)
    ? fileName
    : null;
}

function mockStorageUrl(fileName: string) {
  return `/mock-documents/${encodeURIComponent(mockPdfFileName(fileName))}`;
}

function pathname(path: string) {
  try {
    return new URL(path, 'https://mock.lexchain.local').pathname;
  } catch {
    return path;
  }
}

export function isMockPortalToken(token: string) {
  return token === 'mock-token:mock-document-participant'
    || token === 'mock-token:mock-document-issuer';
}

function profileForToken(token: string) {
  if (token === 'mock-token:mock-document-issuer') return issuerProfile;
  return participantProfile;
}

function isMockParticipant(token?: string) {
  return token === 'mock-token:mock-document-participant';
}

export function isMockDocumentIssuerToken(token?: string) {
  return token === 'mock-token:mock-document-issuer';
}

function hasMockIssuerAccess(token?: string) {
  return isMockDocumentIssuerToken(token);
}

function requestList(requests: MockDocumentRequest[]) {
  return { requests, total: requests.length };
}

export function mockPortalGet(path: string, token?: string): Response {
  if (!token || !isMockPortalToken(token)) return error('Not authenticated', 401);
  const requestPathname = pathname(path);
  const searchParams = new URL(path, 'https://mock.lexchain.local').searchParams;
  if (path === '/users/' || path === '/users') return json(profileForToken(token));
  if (requestPathname === '/documents' || requestPathname === '/documents/') {
    return json(isMockParticipant(token) ? documents.filter((document) => sharedDocumentIds.has(document.id)) : documents);
  }
  if (requestPathname === '/books' || requestPathname === '/books/') {
    if (!hasMockIssuerAccess(token)) return error('Lawyer access required', 403);
    return json(books);
  }
  const bookMatch = requestPathname.match(/^\/books\/([^/]+)\/?$/);
  if (bookMatch) {
    if (!hasMockIssuerAccess(token)) return error('Lawyer access required', 403);
    const book = books.find((candidate) => candidate.id === bookMatch[1]);
    return book ? json(book) : error('Book not found', 404);
  }
  if (path === '/notifications/' || path === '/notifications') {
    return json({ notifications, total: notifications.length });
  }
  if (path === '/notifications/unread-count') {
    return json({ unread: notifications.filter((notification) => !notification.is_read).length });
  }
  if (requestPathname === '/documents/invitations/mine') {
    if (!isMockParticipant(token)) return error('User access required', 403);
    const pending = invitations.filter((invitation) => invitation.status === 'pending');
    return json({
      invitations: pending.map((invitation) => ({
        invitation_id: invitation.id,
        document_id: invitation.document_id,
        file_name: invitation.document_title,
        role: invitation.role,
        status: invitation.status,
        invited_at: invitation.created_at,
      })),
      total: pending.length,
    });
  }
  if (requestPathname === '/documents/invitations') {
    if (!isMockParticipant(token)) return error('User access required', 403);
    return json(invitations.filter((invitation) => invitation.status === 'pending'));
  }
  if (requestPathname === '/requests/my') {
    if (!isMockParticipant(token)) return error('User access required', 403);
    return json(requestList(documentRequests.filter((request) => request.requester_id === mockParticipantId)));
  }
  if (requestPathname === '/requests') {
    if (!isMockDocumentIssuerToken(token)) return error('Lawyer access required', 403);
    const status = searchParams.get('status');
    const filtered = status ? documentRequests.filter((request) => request.status === status) : documentRequests;
    return json(requestList(filtered));
  }

  const extractionMatch = requestPathname.match(/^\/documents\/([^/]+)\/extraction\/?$/);
  if (extractionMatch) {
    if (!hasMockIssuerAccess(token)) return error('Lawyer access required', 403);
    const review = extractionReview(extractionMatch[1]);
    return review ? json(review) : error('Extraction not found', 404);
  }

  const snapshotsMatch = requestPathname.match(/^\/documents\/([^/]+)\/snapshots\/?$/);
  if (snapshotsMatch) {
    const document = documentFor(snapshotsMatch[1]);
    if (!document) return error('Document not found', 404);
    if (!canAccessDocument(token, document)) return error('Document access required', 403);
    return json(document.snapshots);
  }


  const documentMatch = documentPaths(path);
  if (documentMatch) {
    const [, id, detail] = documentMatch;
    const document = documentFor(id);
    if (!document) return error('Document not found', 404);
    if (detail === 'verify' && !canAccessDocument(token, document)) return error('On-chain record not found', 404);
    if (!canAccessDocument(token, document)) return error('Document access required', 403);
    if (!detail) return json(document);
    if (detail === 'parties') {
      return json({
        document_id: document.id,
        issuer: { id: mockIssuerId, f_name: issuerProfile.f_name, l_name: issuerProfile.l_name, email: issuerProfile.email, role: 'lawyer' },
        parties: [{ id: 'mock-party-1', f_name: 'Sample', l_name: 'Tenant', email: 'tenant@example.test', role: 'tenant' }],
      });
    }
    if (detail === 'versions') {
      const versions = documents
        .filter((candidate) => candidate.document_number === document.document_number)
        .sort((left, right) => Number(right.is_latest) - Number(left.is_latest) || right.updated_at.localeCompare(left.updated_at))
        .map((candidate, index, all) => ({ ...candidate, version: all.length - index }));
      return json({ current_document_id: versions[0]?.document_id ?? document.id, versions, total_version: versions.length });
    }
    if (detail === 'verify') {
      if (!document.on_chain) return error('On-chain record not found', 404);
      const isAuthentic = document.integrity_state !== 'mismatch';
      return json({
        document_id: document.id,
        status: isAuthentic ? 'AUTHENTIC' : 'TAMPERED',
        is_authentic: isAuthentic,
        baseline_trusted: true,
        onchain_hash: '0xmockdatahash',
        snapshot_hash: '0xmockdatahash',
        current_hash: isAuthentic ? '0xmockdatahash' : '0xtamperedhash',
        tx_hash: '0xmocktransactionhash',
        onchain_timestamp: Math.floor(new Date(document.updated_at).getTime() / 1000),
        issued_by: '0xMockIssuer',
        finalized_at: document.updated_at,
        verified_at: new Date().toISOString(),
        tamper_report: isAuthentic ? null : { total_changes: 1, critical_changes: 0, segments: [] },
        message: isAuthentic ? 'Document matches the anchored hash.' : 'Document content differs from the anchored hash.',
      });
    }
    return json(document.audit_log);
  }

  return error('Mock endpoint not found', 404);
}

async function jsonBody(request: Request) {
  return request.json().catch(() => null) as Promise<Record<string, unknown> | null>;
}

async function uploadDocument(request: Request, path: string) {
  const form = await request.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File) || !file.name.toLowerCase().endsWith('.pdf')) {
    return error('A PDF file is required', 400);
  }

  const now = new Date().toISOString();
  const requestUrl = new URL(path, 'https://mock.lexchain.local');
  const fileName = validFileName(requestUrl.searchParams.get('file_name'));
  if (!fileName) return error('A valid file name is required', 400);
  const bookId = requestUrl.searchParams.get('book_id');
  const book = books.find((candidate) => candidate.id === bookId && !candidate.is_full);
  if (!book) return error('An active book is required', 400);
  const id = `mock-document-${Date.now()}`;
  const document: MockDocument = {
    id,
    document_id: id,
    document_number: 1000 + documents.length + 1,
    file_name: fileName,
    storage_url: mockStorageUrl(fileName),
    content_type: file.type || 'application/pdf',
    status: 'ready_for_review',
    on_chain: false,
    is_latest: true,
    summary: 'A locally uploaded mock document.',
    labels: ['uploaded'],
    entities: [],
    risk_flags: [],
    created_at: now,
    updated_at: now,
    audit_log: [mockCreationAudit(id, now)],
    lifecycle: 'draft',
    document_hash: null,
    finalized_at: null,
    finalized_by: null,
    anchor_status: null,
    snapshots: [],
    integrity_state: 'not-recorded',
  };
  documents = [document, ...documents];
  extractions = {
    ...extractions,
    [id]: {
      extraction_id: `mock-extraction-${id}`,
      engine: 'mock-ocr',
      page_count: 1,
      confidence_avg: 1,
      blocks: [{
        index: 0,
        editable: true,
        type: 'text',
        text: fileName,
        original_text: fileName,
        bbox: [80, 90, 920, 180],
        page_idx: 0,
        text_level: null,
        score: 1,
        is_html: false,
        edited: false,
      }],
      is_reviewed: false,
      reviewed_by: null,
      reviewed_at: null,
    },
  };
  books = books.map((candidate) => candidate.id === book.id ? {
    ...candidate,
    document_count: candidate.document_count + 1,
    page_count: candidate.page_count + 1,
    updated_at: now,
  } : candidate);
  notifications = [{
    id: `mock-notification-${Date.now()}`,
    title: 'Document uploaded',
    body: `${fileName} is ready to review.`,
    is_read: false,
    created_at: now,
  }, ...notifications];
  return json({ document_id: id, status: document.status }, 201);
}

async function createBook(request: Request) {
  const body = await jsonBody(request);
  const bookNumber = body?.book_number;
  const seriesYear = body?.series_year;
  if (typeof bookNumber !== 'number' || !Number.isInteger(bookNumber) || typeof seriesYear !== 'number' || !Number.isInteger(seriesYear)) {
    return error('Book number and series year are required', 400);
  }
  if (bookNumber < 1 || bookNumber > 1000 || seriesYear < 2000) {
    return error('Book number or series year is invalid', 400);
  }
  if (books.some((book) => book.book_number === bookNumber && book.series_year === seriesYear)) {
    return error('Book already exists', 400);
  }
  const now = new Date().toISOString();
  const book: MockBook = {
    id: `mock-book-${Date.now()}`,
    book_number: bookNumber,
    series_year: seriesYear,
    document_count: 0,
    page_count: 0,
    is_full: false,
    created_at: now,
    updated_at: null,
  };
  books = [...books, book];
  return json(book, 201);
}

async function searchDocuments(request: Request, token?: string) {
  const body = await jsonBody(request);
  const query = typeof body?.query === 'string' ? body.query.trim() : '';
  if (!query) return error('Search query is required', 400);
  const normalized = query.toLowerCase();
  const results = documents
    .filter((document) => canAccessDocument(token, document))
    .filter((document) => `${document.file_name} ${document.summary} ${document.labels.join(' ')}`.toLowerCase().includes(normalized))
    .map((document) => ({
      chunk_id: `mock-search-${document.id}`,
      document_id: document.id,
      text: document.summary,
      score: 0.95,
    }));
  return json({ query, results });
}

async function askDocument(id: string, request: Request, token?: string) {
  const document = documentFor(id);
  if (!document || !canAccessDocument(token, document)) return error('Document not found', 404);
  const body = await jsonBody(request);
  const question = typeof body?.question === 'string' ? body.question.trim() : '';
  if (!question) return error('A question is required', 400);
  return json({ answer: `Mock answer for ${document.file_name}: ${document.summary}` });
}

async function saveExtractionEdits(documentId: string, request: Request) {
  const body = await jsonBody(request) as Partial<UpdateExtractionRequest> | null;
  const edits = body?.edits;
  if (!Array.isArray(edits) || edits.length === 0) return error('At least one edit is required', 400);
  const extraction = extractions[documentId];
  if (!extraction) return error('Extraction not found', 404);
  if (extraction.is_reviewed) return error('Extraction has already been approved', 409);
  if (!edits.every((edit) => (
    typeof edit === 'object'
    && edit !== null
    && typeof edit.index === 'number'
    && Number.isInteger(edit.index)
    && typeof edit.text === 'string'
    && extraction.blocks.some((block) => block.index === edit.index && block.editable !== false)
  ))) return error('Extraction edit is invalid', 400);

  const validEdits = edits as BlockEdit[];
  const editedIndexes = new Set(validEdits.map((edit) => edit.index));
  extractions = {
    ...extractions,
    [documentId]: {
      ...extraction,
      blocks: extraction.blocks.map((block) => {
        const edit = validEdits.find((item) => item.index === block.index);
        return edit ? { ...block, text: edit.text, edited: true } : block;
      }),
    },
  };
  extractionFlags = {
    ...extractionFlags,
    [documentId]: (extractionFlags[documentId] ?? []).filter((flag) => !editedIndexes.has(flag.block_index ?? -1)),
  };
  return json(extractionReview(documentId));
}

function analyzeExtraction(documentId: string) {
  const extraction = extractions[documentId];
  if (!extraction) return error('Extraction not found', 404);
  if (extraction.is_reviewed) return error('Extraction has already been approved', 409);
  extractionFlags = {
    ...extractionFlags,
    [documentId]: [
      ...(extractionFlags[documentId] ?? []).filter((flag) => !flag.kind.startsWith('llm_')),
      {
        block_index: 0,
        kind: 'llm_missing_space',
        severity: 'low',
        message: 'The review pass found a possible missing space.',
        excerpt: extraction.blocks[0]?.text ?? '',
      },
    ],
  };
  return json(extractionReview(documentId));
}

function approveExtraction(documentId: string) {
  const extraction = extractions[documentId];
  if (!extraction) return error('Extraction not found', 404);
  if (extraction.is_reviewed) return error('Extraction has already been approved', 409);
  if (!extraction.blocks.some((block) => block.text.trim())) return error('Reviewed text is required', 400);
  const now = new Date().toISOString();
  extractions = {
    ...extractions,
    [documentId]: { ...extraction, is_reviewed: true, reviewed_by: mockIssuerId, reviewed_at: now },
  };
  documents = documents.map((document) => document.id === documentId ? {
    ...document,
    status: 'completed',
    updated_at: now,
  } : document);
  const reviewed = extractionReview(documentId)!;
  const response: ApproveExtractionResponse = {
    document_id: documentId,
    status: 'approved',
    edited_block_count: reviewed.edited_block_count,
    content_hash: deterministicHash(reviewed.blocks.map((block) => block.text).join('\n')),
    message: 'Extraction review approved.',
  };
  return json(response);
}

export async function mockPortalMutate(method: 'POST' | 'PATCH' | 'DELETE', path: string, request: Request, token?: string): Promise<Response> {
  if (!token || !isMockPortalToken(token)) return error('Not authenticated', 401);
  const requestPathname = pathname(path);
  const documentRestoreMatch = requestPathname.match(/^\/documents\/([^/]+)\/restore\/?$/);
  if (method === 'POST' && documentRestoreMatch) {
    if (!isMockDocumentIssuerToken(token)) return error('Lawyer access required', 403);
    const document = documentFor(documentRestoreMatch[1]);
    if (!document) return error('Document not found', 404);
    return json({
      document_id: document.id,
      restored_from: 'mock-archive',
      evidence_key: null,
      verified_hash: document.document_hash ?? `0x${deterministicHash(document.id)}`,
    });
  }
  const invitationActionMatch = requestPathname.match(/^\/documents\/invitations\/([^/]+)\/(accept|decline)$/);
  if (method === 'POST' && invitationActionMatch) {
    if (!isMockParticipant(token)) return error('User access required', 403);
    const [, invitationId, action] = invitationActionMatch;
    const invitation = invitations.find((item) => item.id === invitationId);
    if (!invitation || invitation.status !== 'pending') return error('Invitation not found', 404);
    invitations = invitations.filter((item) => item.id !== invitationId);
    if (action === 'accept') sharedDocumentIds.add(invitation.document_id);
    return json({ message: `Invitation ${action}ed` });
  }
  if (method === 'POST' && (requestPathname === '/documents/upload' || requestPathname === '/documents/upload/')) {
    if (!hasMockIssuerAccess(token)) return error('Lawyer access required', 403);
    return uploadDocument(request, path);
  }
  if (method === 'POST' && (requestPathname === '/books' || requestPathname === '/books/')) {
    if (!hasMockIssuerAccess(token)) return error('Lawyer access required', 403);
    return createBook(request);
  }

  const bookMatch = requestPathname.match(/^\/books\/([^/]+)\/?$/);
  if (method === 'DELETE' && bookMatch) {
    if (!hasMockIssuerAccess(token)) return error('Lawyer access required', 403);
    if (!books.some((book) => book.id === bookMatch[1])) return error('Book not found', 404);
    books = books.filter((book) => book.id !== bookMatch[1]);
    return new Response(null, { status: 204 });
  }

  const documentMatch = requestPathname.match(/^\/documents\/([^/]+)\/?$/);
  if (method === 'PATCH' && documentMatch) {
    if (!hasMockIssuerAccess(token)) return error('Lawyer access required', 403);
    const document = documentFor(documentMatch[1]);
    if (!document) return error('Document not found', 404);
    if (!canMutateDocumentLifecycle(document) || document.lifecycle !== 'draft') return error('Document cannot be renamed', 409);
    const body = await jsonBody(request);
    const fileName = validFileName(typeof body?.file_name === 'string' ? body.file_name : null);
    if (!fileName) return error('A valid file name is required', 400);
    const updated = { ...document, file_name: fileName, updated_at: new Date().toISOString() };
    documents = documents.map((item) => item.id === document.id ? updated : item);
    return json({ document_id: updated.id, status: updated.status, file_name: updated.file_name });
  }

  const documentUpdateMatch = requestPathname.match(/^\/documents\/([^/]+)\/update\/?$/);
  if (method === 'POST' && documentUpdateMatch) {
    if (!hasMockIssuerAccess(token)) return error('Lawyer access required', 403);
    const document = documentFor(documentUpdateMatch[1]);
    if (!document) return error('Document not found', 404);
    if (!canMutateDocumentLifecycle(document) || !document.is_latest) return error('This version has been superseded', 409);
    const form = await request.formData().catch(() => null);
    const file = form?.get('file');
    const fileName = validFileName(new URL(path, 'https://mock.lexchain.local').searchParams.get('file_name'));
    if (!(file instanceof File) || !file.name.toLowerCase().endsWith('.pdf') || !fileName) return error('A PDF file and valid file name are required', 400);
    const now = new Date().toISOString();
    const nextId = `${document.id}-v${Date.now()}`;
    const next = {
      ...document,
      id: nextId,
      document_id: nextId,
      file_name: fileName,
      storage_url: mockStorageUrl(fileName),
      content_type: file.type || 'application/pdf',
      status: 'ready_for_review',
      on_chain: false,
      is_latest: true,
      created_at: now,
      updated_at: now,
      lifecycle: 'draft' as const,
      document_hash: null,
      finalized_at: null,
      finalized_by: null,
      anchor_status: null,
      snapshots: [],
      integrity_state: 'not-recorded' as const,
      audit_log: [mockCreationAudit(document.id, now)],
    };
    documents = [...documents.map((item) => item.id === document.id ? { ...item, is_latest: false } : item), next];
    return json({ document_id: next.id, status: next.status }, 202);
  }

  const extractionMatch = requestPathname.match(/^\/documents\/([^/]+)\/extraction\/?$/);
  if (method === 'PATCH' && extractionMatch) {
    if (!hasMockIssuerAccess(token)) return error('Lawyer access required', 403);
    return saveExtractionEdits(extractionMatch[1], request);
  }
  const extractionAnalyzeMatch = requestPathname.match(/^\/documents\/([^/]+)\/extraction\/analyze\/?$/);
  if (method === 'POST' && extractionAnalyzeMatch) {
    if (!hasMockIssuerAccess(token)) return error('Lawyer access required', 403);
    return analyzeExtraction(extractionAnalyzeMatch[1]);
  }
  const extractionApproveMatch = requestPathname.match(/^\/documents\/([^/]+)\/extraction\/approve\/?$/);
  if (method === 'POST' && extractionApproveMatch) {
    if (!hasMockIssuerAccess(token)) return error('Lawyer access required', 403);
    return approveExtraction(extractionApproveMatch[1]);
  }

  const finalizeMatch = requestPathname.match(/^\/documents\/([^/]+)\/finalize\/?$/);
  if (method === 'POST' && finalizeMatch) {
    if (!hasMockIssuerAccess(token)) return error('Lawyer access required', 403);
    const document = documentFor(finalizeMatch[1]);
    if (!document) return error('Document not found', 404);
    if (!canMutateDocumentLifecycle(document)) return error('Shared document lifecycle is read-only', 403);
    const recordResponse = (dataHash: string): ApiSchema<'RecordResponse'> => ({
      document_id: document.id,
      tx_hash: `0x${deterministicHash(`tx-${document.id}`)}`,
      onchain_document_id: `chain-${document.id}`,
      data_hash: dataHash,
    });
    if (document.lifecycle === 'finalized') return json(recordResponse(document.document_hash ?? deterministicHash(document.id)));
    const extraction = extractions[document.id];
    if (!extraction?.is_reviewed) return error('Extraction review must be approved before finalization', 400);
    if (!canFinalizeMockDocument(document, extraction)) {
      return error('Document cannot be finalized', 400);
    }
    const now = new Date().toISOString();
    const documentHash = deterministicHash(extraction.blocks.map((block) => block.text).join('\n'));
    const finalizedDocument: MockDocument = {
      ...document,
      lifecycle: 'finalized',
      on_chain: true,
      document_hash: documentHash,
      finalized_at: now,
      finalized_by: mockIssuerId,
      anchor_status: 'confirmed',
      snapshots: document.snapshots.length ? document.snapshots : [{
        id: `mock-snapshot-${document.id}`,
        document_id: document.id,
        text_hash: documentHash,
        created_at: now,
      }],
      integrity_state: 'match',
      updated_at: now,
      audit_log: [...document.audit_log, {
        id: `mock-audit-finalized-${document.id}`,
        document_id: document.id,
        user_id: mockIssuerId,
        action: 'document_finalized',
        details: { document_hash: documentHash },
        created_at: now,
      }],
    };
    documents = documents.map((item) => item.id === document.id ? finalizedDocument : item);
    return json(recordResponse(documentHash));
  }

  const restoreMatch = requestPathname.match(/^\/documents\/([^/]+)\/snapshots\/([^/]+)\/restore\/?$/);
  if (method === 'POST' && restoreMatch) {
    if (!hasMockIssuerAccess(token)) return error('Lawyer access required', 403);
    const [, documentId, snapshotId] = restoreMatch;
    const document = documentFor(documentId);
    if (!document) return error('Document not found', 404);
    if (!canMutateDocumentLifecycle(document)) return error('Shared document lifecycle is read-only', 403);
    const snapshot = document.snapshots.find((item) => item.id === snapshotId);
    if (!snapshot) return error('Snapshot not found', 404);
    if (!canRestoreMockDocument(document)) {
      return error('Document cannot be restored', 400);
    }
    const body = await jsonBody(request);
    const reason = typeof body?.reason === 'string' ? body.reason.trim() : '';
    if (!reason) return error('A restoration reason is required', 400);
    const now = new Date().toISOString();
    const restoredDocument: MockDocument = {
      ...document,
      lifecycle: 'restored',
      document_hash: snapshot.text_hash,
      integrity_state: 'match',
      updated_at: now,
      audit_log: [...document.audit_log, {
        id: `mock-audit-restored-${document.id}-${Date.now()}`,
        document_id: document.id,
        user_id: mockIssuerId,
        action: 'document_restored',
        details: { snapshot_id: snapshot.id, reason },
        created_at: now,
      }],
    };
    documents = documents.map((item) => item.id === document.id ? restoredDocument : item);
    return json(restoredDocument);
  }
  if (method === 'POST' && path === '/search') return searchDocuments(request, token);

  const askMatch = path.match(/^\/documents\/([^/]+)\/ask\/?$/);
  if (method === 'POST' && askMatch) return askDocument(askMatch[1], request, token);

  const invitationMatch = requestPathname.match(/^\/documents\/([^/]+)\/parties\/(accept|reject)$/);
  if (method === 'POST' && invitationMatch) {
    if (!isMockParticipant(token)) return error('User access required', 403);
    const [, documentId, action] = invitationMatch;
    const invitation = invitations.find((item) => item.document_id === documentId && item.status === 'pending');
    if (!invitation) return error('Invitation not found', 404);
    invitations = invitations.filter((item) => item.id !== invitation.id);
    if (action === 'accept') sharedDocumentIds.add(documentId);
    return new Response(null, { status: 204 });
  }

  const reviewMatch = requestPathname.match(/^\/requests\/([^/]+)\/review$/);
  if (method === 'PATCH' && reviewMatch) {
    if (!isMockDocumentIssuerToken(token)) return error('Lawyer access required', 403);
    const body = await jsonBody(request);
    const action = body?.action;
    const rejectionReason = typeof body?.rejection_reason === 'string' ? body.rejection_reason.trim() : '';
    if (action !== 'approve' && action !== 'reject') return error('Review action must be approve or reject', 400);
    if (action === 'reject' && !rejectionReason) return error('A rejection reason is required', 400);
    const requestId = reviewMatch[1];
    const existingRequest = documentRequests.find((item) => item.id === requestId);
    if (!existingRequest) return error('Request not found', 404);
    if (existingRequest.status !== 'pending') return error('Request has already been reviewed', 400);
    const reviewedRequest: MockDocumentRequest = {
      ...existingRequest,
      status: action === 'approve' ? 'approved' : 'rejected',
      rejection_reason: action === 'reject' ? rejectionReason : null,
      updated_at: new Date().toISOString(),
    };
    documentRequests = documentRequests.map((item) => item.id === requestId ? reviewedRequest : item);
    return json(reviewedRequest);
  }

  if (method === 'PATCH' && path === '/notifications/read-all') {
    notifications = notifications.map((notification) => ({ ...notification, is_read: true }));
    return new Response(null, { status: 204 });
  }

  const notificationMatch = path.match(/^\/notifications\/([^/]+)\/read\/?$/);
  if (method === 'PATCH' && notificationMatch) {
    const found = notifications.some((notification) => notification.id === notificationMatch[1]);
    if (!found) return error('Notification not found', 404);
    notifications = notifications.map((notification) => (
      notification.id === notificationMatch[1] ? { ...notification, is_read: true } : notification
    ));
    return new Response(null, { status: 204 });
  }

  return error('Mock endpoint not found', 404);
}
