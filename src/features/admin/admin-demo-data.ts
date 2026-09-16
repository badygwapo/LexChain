export const adminStats = {
  total_users: 120,
  total_lawyers: 25,
  total_documents: 2340,
  processed_documents: 2100,
  pending_documents: 120,
  failed_documents: 30,
  total_on_chain: 1980,
  pending_invitations: 8,
  total_verifications: 900,
  tamper_alerts: 5,
};

export const adminUsers = [
  {
    id: "usr_001",
    name: "Atty. Maria Santos",
    email: "maria.santos@davaolaw.ph",
    role: "lawyer",
    status: "active",
    last_login_at: "2026-05-13T08:42:00Z",
    uploaded_documents: 148,
    verification_attempts: 6,
    created_at: "2026-04-12T10:20:00Z",
  },
  {
    id: "usr_002",
    name: "Juan Dela Cruz",
    email: "juan.delacruz@example.com",
    role: "user",
    status: "active",
    last_login_at: "2026-05-12T13:45:00Z",
    uploaded_documents: 0,
    verification_attempts: 24,
    created_at: "2026-04-18T13:45:00Z",
  },
  {
    id: "usr_003",
    name: "Ana Reyes",
    email: "ana.reyes@example.com",
    role: "user",
    status: "pending_email_verification",
    last_login_at: null,
    uploaded_documents: 0,
    verification_attempts: 1,
    created_at: "2026-05-03T08:15:00Z",
  },
  {
    id: "usr_004",
    name: "LexChain Owner",
    email: "owner@lexchain.local",
    role: "lawyer",
    status: "active",
    last_login_at: "2026-05-13T15:24:00Z",
    uploaded_documents: 0,
    verification_attempts: 0,
    created_at: "2026-03-01T09:00:00Z",
  },
];

export const adminDocuments = [
  {
    file_name: "Deed of Sale - Lot 18.pdf",
    owner_name: "Santos & Cruz Law Office",
    category: "Deed of Sale",
    status: "verified",
    privacy: "public_verification",
    ocr_status: "complete",
    nlp_status: "complete",
    blockchain_status: "anchored",
    created_at: "2026-05-01T09:12:00Z",
  },
  {
    file_name: "Service Contract - Redacted.pdf",
    owner_name: "Davao Business Hub",
    category: "Contract",
    status: "processing",
    privacy: "invite_only",
    ocr_status: "complete",
    nlp_status: "queued",
    blockchain_status: "pending",
    created_at: "2026-05-05T11:30:00Z",
  },
  {
    file_name: "Barangay Resolution 2026-14.pdf",
    owner_name: "Barangay Matina Office",
    category: "Barangay Resolution",
    status: "failed",
    privacy: "public_verification",
    ocr_status: "failed",
    nlp_status: "queued",
    blockchain_status: "failed",
    created_at: "2026-05-08T15:10:00Z",
  },
  {
    file_name: "Lease Agreement - Unit 4B.pdf",
    owner_name: "Mindanao Property Group",
    category: "Lease Agreement",
    status: "tampered",
    privacy: "confidential",
    ocr_status: "complete",
    nlp_status: "complete",
    blockchain_status: "anchored",
    created_at: "2026-05-10T14:05:00Z",
  },
];

export const adminVerificationLogs = [
  {
    document_name: "Deed of Sale - Lot 18.pdf",
    verification_code: "LEX-DEMO-2026",
    verifier: "juan.delacruz@example.com",
    status: "authentic",
    blockchain_hash: "0x91a4...f02c",
    verified_at: "2026-05-01T09:18:00Z",
  },
  {
    document_name: "Service Contract - Redacted.pdf",
    verification_code: "LEX-PENDING-018",
    verifier: "public.portal@visitor.local",
    status: "pending",
    blockchain_hash: "Pending anchoring",
    verified_at: null,
  },
  {
    document_name: "Barangay Resolution 2026-14.pdf",
    verification_code: "LEX-FAILED-019",
    verifier: "records.audit@example.com",
    status: "mismatch",
    blockchain_hash: "0x20af...9db1",
    verified_at: "2026-05-08T15:19:00Z",
  },
];

export const adminIssuers = [
  {
    name: "Santos & Cruz Law Office",
    contact_email: "records@davaolaw.ph",
    organization_type: "Law Firm",
    active_users: 8,
    documents_uploaded: 486,
    status: "active",
  },
  {
    name: "Barangay Matina Office",
    contact_email: "secretariat@matina.gov.ph",
    organization_type: "Government Office",
    active_users: 4,
    documents_uploaded: 134,
    status: "under_review",
  },
  {
    name: "Mindanao Property Group",
    contact_email: "legal@mpg.example",
    organization_type: "Private Office",
    active_users: 5,
    documents_uploaded: 211,
    status: "active",
  },
];

export const adminCategories = [
  { name: "Deed of Sale", publicly_verifiable: true, requires_invitation: false, allow_download: true, default_privacy: "public_verification" },
  { name: "Contract", publicly_verifiable: false, requires_invitation: true, allow_download: false, default_privacy: "confidential" },
  { name: "Affidavit", publicly_verifiable: true, requires_invitation: false, allow_download: true, default_privacy: "public_verification" },
  { name: "Agreement", publicly_verifiable: false, requires_invitation: true, allow_download: false, default_privacy: "invite_only" },
  { name: "Certificate", publicly_verifiable: true, requires_invitation: false, allow_download: true, default_privacy: "public_verification" },
];

export const adminInvitations = [
  {
    document_name: "Service Contract - Redacted.pdf",
    issuer: "Davao Business Hub",
    participant_email: "client@example.com",
    permission_type: "view_only",
    status: "accepted",
    sent_at: "2026-05-05T12:00:00Z",
  },
  {
    document_name: "Lease Agreement - Unit 4B.pdf",
    issuer: "Mindanao Property Group",
    participant_email: "tenant@example.com",
    permission_type: "view_download",
    status: "sent",
    sent_at: "2026-05-10T14:25:00Z",
  },
  {
    document_name: "Employment Contract - Batch A.pdf",
    issuer: "Santos & Cruz Law Office",
    participant_email: "pending-user@example.com",
    permission_type: "verify_only",
    status: "expired",
    sent_at: "2026-04-28T09:10:00Z",
  },
];

export const adminBlockchainRecords = [
  {
    document_hash: "0x91a4d1b9c8f02c",
    transaction_hash: "0xabc4410e228fd90",
    block_number: 8420011,
    network: "Polygon Amoy Testnet",
    status: "anchored",
    anchored_at: "2026-05-01T09:16:00Z",
  },
  {
    document_hash: "0x20af78ce139db1",
    transaction_hash: "0xdeb9910a771ce00",
    block_number: 8420188,
    network: "Polygon Amoy Testnet",
    status: "anchored",
    anchored_at: "2026-05-08T15:14:00Z",
  },
  {
    document_hash: "0xf01c8842aa901b",
    transaction_hash: "Retry queued",
    block_number: null,
    network: "Polygon Amoy Testnet",
    status: "failed",
    anchored_at: null,
  },
];

export const adminProcessingLogs = [
  {
    document_name: "Deed of Sale - Lot 18.pdf",
    ocr_status: "success",
    nlp_status: "generated",
    extracted_data_status: "Parties, dates, property details, obligations",
    processing_time: "41s",
    api_usage: "1 OCR job, 1 summary job",
  },
  {
    document_name: "Barangay Resolution 2026-14.pdf",
    ocr_status: "failed",
    nlp_status: "needs_retry",
    extracted_data_status: "Unreadable scan pages 2-3",
    processing_time: "12s",
    api_usage: "1 OCR retry queued",
  },
  {
    document_name: "Lease Agreement - Unit 4B.pdf",
    ocr_status: "low_confidence",
    nlp_status: "generated",
    extracted_data_status: "Parties and dates extracted; clauses need review",
    processing_time: "58s",
    api_usage: "1 OCR job, 1 summary job",
  },
];

export const adminAnalytics = [
  { label: "Documents processed this month", value: "500", detail: "Up 18% from last month" },
  { label: "Most used category", value: "Deed of Sale", detail: "31% of uploaded documents" },
  { label: "Verification success", value: "95%", detail: "5% mismatch or inconclusive" },
  { label: "OCR/NLP failure rate", value: "3%", detail: "Mostly low-quality scans" },
  { label: "Active issuers", value: "20", detail: "Offices active in the last 30 days" },
  { label: "Storage usage", value: "8 GB", detail: "Across issuer document storage" },
  { label: "Anchoring success rate", value: "98%", detail: "2% delayed or retrying" },
];

export const adminGeneratedReports = [
  {
    id: "rpt_001",
    title: "Deed of Sale - Lot 18 Summary",
    type: "NLP Summary",
    source: "Deed of Sale - Lot 18.pdf",
    status: "ready",
    generated_by: "Atty. Maria Santos",
    generated_at: "2026-05-01T09:22:00Z",
  },
  {
    id: "rpt_002",
    title: "Public Verification Mismatch Report",
    type: "Verification Report",
    source: "Barangay Resolution 2026-14.pdf",
    status: "ready",
    generated_by: "System",
    generated_at: "2026-05-08T15:21:00Z",
  },
  {
    id: "rpt_003",
    title: "Lease Agreement OCR Extraction",
    type: "OCR Extraction",
    source: "Lease Agreement - Unit 4B.pdf",
    status: "review_needed",
    generated_by: "System",
    generated_at: "2026-05-10T14:08:00Z",
  },
  {
    id: "rpt_004",
    title: "Weekly Blockchain Anchoring Export",
    type: "Blockchain Export",
    source: "Polygon Amoy Testnet",
    status: "queued",
    generated_by: "LexChain Owner",
    generated_at: "2026-05-13T08:30:00Z",
  },
];

export const adminAuditLogs = [
  {
    actor: "owner@lexchain.local",
    action: "Changed category privacy rule",
    target: "Contract",
    severity: "info",
    created_at: "2026-05-13T10:20:00Z",
  },
  {
    actor: "records.audit@example.com",
    action: "Verified document and received mismatch result",
    target: "doc_003",
    severity: "critical",
    created_at: "2026-05-08T15:19:00Z",
  },
  {
    actor: "client@example.com",
    action: "Accepted invitation",
    target: "Service Contract - Redacted.pdf",
    severity: "info",
    created_at: "2026-05-05T13:02:00Z",
  },
  {
    actor: "unknown visitor",
    action: "Too many failed verification attempts",
    target: "Public verification portal",
    severity: "warning",
    created_at: "2026-05-12T21:33:00Z",
  },
];

export const adminSettings = [
  { setting: "Allowed file types", value: "PDF, DOCX, TXT", scope: "Upload rules" },
  { setting: "Max file size", value: "10MB", scope: "Upload rules" },
  { setting: "OCR preprocessing", value: "Enabled", scope: "OCR settings" },
  { setting: "NLP provider", value: "Demo AI provider", scope: "NLP/API settings" },
  { setting: "Blockchain network", value: "Polygon Amoy Testnet", scope: "Blockchain" },
  { setting: "Verification rule", value: "Category-based public or invite-only", scope: "Verification" },
  { setting: "Invite expiration", value: "7 days", scope: "Email invitations" },
  { setting: "Maintenance mode", value: "Off", scope: "System availability" },
];
