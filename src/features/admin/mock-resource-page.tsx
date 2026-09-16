"use client";

import { AdminBadge, AdminResourcePage, formatAdminDate } from "@/features/admin/admin-resource-page";

type Resource =
  | "analytics"
  | "documents"
  | "categories"
  | "ocr-nlp-processing"
  | "verification-logs"
  | "document-issuers"
  | "blockchain-records";

type Row = Record<string, unknown>;

function text(row: Row, key: string) {
  const value = row[key];
  return value === null || value === undefined ? "" : String(value);
}

function bool(row: Row, key: string) {
  return Boolean(row[key]);
}

export function MockResourcePage({ resource, rows }: { resource: Resource; rows: Row[] }) {
  if (resource === "analytics") {
    return (
      <AdminResourcePage
        activeHref="/admin/analytics"
        title="Analytics"
        subtitle="Track usage, processing throughput, verification results, and operational trends."
        cards={[
          { label: "Metrics", value: rows.length, detail: "Operational signals." },
          { label: "Verification", value: "95%", detail: "Success rate." },
          { label: "OCR/NLP fail", value: "3%", detail: "Current demo failure rate." },
        ]}
        columns={[
          { key: "metric", label: "Metric", render: (row) => text(row, "label") },
          { key: "value", label: "Value", render: (row) => text(row, "value") },
          { key: "detail", label: "Detail", render: (row) => text(row, "detail") },
        ]}
        rows={rows}
      />
    );
  }

  if (resource === "documents") {
    return (
      <AdminResourcePage
        activeHref="/admin/documents"
        title="Documents"
        subtitle="Review uploaded document metadata, processing state, ownership, and verification readiness."
        cards={[
          { label: "Uploaded", value: rows.length, detail: "Documents in this view." },
          { label: "Anchored", value: rows.filter((row) => row.blockchain_status === "anchored").length, detail: "Blockchain records confirmed." },
          { label: "Needs review", value: rows.filter((row) => row.status === "failed" || row.status === "tampered").length, detail: "Failed or mismatch state." },
        ]}
        columns={[
          { key: "file", label: "File", render: (row) => text(row, "file_name") },
          { key: "owner", label: "Owner", render: (row) => text(row, "owner_name") },
          { key: "category", label: "Category", render: (row) => <AdminBadge>{text(row, "category")}</AdminBadge> },
          { key: "status", label: "Status", render: (row) => <AdminBadge>{text(row, "status")}</AdminBadge> },
          { key: "processing", label: "OCR / NLP", render: (row) => `${text(row, "ocr_status")} / ${text(row, "nlp_status")}` },
          { key: "chain", label: "Chain", render: (row) => <AdminBadge>{text(row, "blockchain_status")}</AdminBadge> },
          { key: "created", label: "Created", render: (row) => formatAdminDate(text(row, "created_at")) },
        ]}
        rows={rows}
      />
    );
  }

  if (resource === "categories") {
    return (
      <AdminResourcePage
        activeHref="/admin/categories"
        title="Categories"
        subtitle="Manage document grouping, classification labels, and category usage patterns."
        cards={[
          { label: "Categories", value: rows.length, detail: "Configured document types." },
          { label: "Public", value: rows.filter((row) => bool(row, "publicly_verifiable")).length, detail: "Public verification allowed." },
          { label: "Invite only", value: rows.filter((row) => bool(row, "requires_invitation")).length, detail: "Requires controlled access." },
        ]}
        columns={[
          { key: "name", label: "Category", render: (row) => text(row, "name") },
          { key: "public", label: "Public", render: (row) => bool(row, "publicly_verifiable") ? "Yes" : "No" },
          { key: "invite", label: "Invite", render: (row) => bool(row, "requires_invitation") ? "Required" : "Optional" },
          { key: "download", label: "Download", render: (row) => bool(row, "allow_download") ? "Allowed" : "Blocked" },
          { key: "privacy", label: "Default Privacy", render: (row) => <AdminBadge>{text(row, "default_privacy")}</AdminBadge> },
        ]}
        rows={rows}
      />
    );
  }

  if (resource === "ocr-nlp-processing") {
    return (
      <AdminResourcePage
        activeHref="/admin/ocr-nlp-processing"
        title="OCR / NLP Processing"
        subtitle="Monitor extraction queues, summary generation, key field detection, and failed jobs."
        cards={[
          { label: "Jobs", value: rows.length, detail: "Recent processing logs." },
          { label: "Generated", value: rows.filter((row) => row.nlp_status === "generated").length, detail: "NLP output ready." },
          { label: "Needs retry", value: rows.filter((row) => row.ocr_status !== "success" || row.nlp_status !== "generated").length, detail: "Requires review." },
        ]}
        columns={[
          { key: "document", label: "Document", render: (row) => text(row, "document_name") },
          { key: "ocr", label: "OCR", render: (row) => <AdminBadge>{text(row, "ocr_status")}</AdminBadge> },
          { key: "nlp", label: "NLP", render: (row) => <AdminBadge>{text(row, "nlp_status")}</AdminBadge> },
          { key: "extracted", label: "Extracted Data", render: (row) => text(row, "extracted_data_status") },
          { key: "time", label: "Time", render: (row) => text(row, "processing_time") },
          { key: "usage", label: "API Usage", render: (row) => text(row, "api_usage") },
        ]}
        rows={rows}
      />
    );
  }

  if (resource === "verification-logs") {
    return (
      <AdminResourcePage
        activeHref="/admin/verification-logs"
        title="Verification Logs"
        subtitle="Review uploaded PDF checks, public verifier attempts, status results, and confidence scores."
        cards={[
          { label: "Attempts", value: rows.length, detail: "Total verification requests." },
          { label: "Matches", value: rows.filter((row) => row.status === "authentic").length, detail: "Verified document matches." },
          { label: "Mismatches", value: rows.filter((row) => row.status === "mismatch").length, detail: "Potential tamper alerts." },
        ]}
        columns={[
          { key: "document", label: "Document", render: (row) => text(row, "document_name") },
          { key: "code", label: "Code", render: (row) => text(row, "verification_code") },
          { key: "verifier", label: "Verifier", render: (row) => text(row, "verifier") },
          { key: "status", label: "Status", render: (row) => <AdminBadge>{text(row, "status")}</AdminBadge> },
          { key: "hash", label: "Hash", render: (row) => text(row, "blockchain_hash") },
          { key: "date", label: "Verified", render: (row) => formatAdminDate(text(row, "verified_at")) },
        ]}
        rows={rows}
      />
    );
  }

  if (resource === "document-issuers") {
    return (
      <AdminResourcePage
        activeHref="/admin/document-issuers"
        title="Document Issuers"
        subtitle="Monitor offices, law firms, and organizations that issue or notarize records."
        cards={[
          { label: "Issuers", value: rows.length, detail: "Registered organizations." },
          { label: "Active", value: rows.filter((row) => row.status === "active").length, detail: "Issuer profiles active." },
          { label: "Needs review", value: rows.filter((row) => row.status === "under_review").length, detail: "Issuer setup incomplete." },
        ]}
        columns={[
          { key: "name", label: "Issuer", render: (row) => text(row, "name") },
          { key: "email", label: "Contact", render: (row) => text(row, "contact_email") },
          { key: "type", label: "Type", render: (row) => <AdminBadge>{text(row, "organization_type")}</AdminBadge> },
          { key: "users", label: "Users", render: (row) => text(row, "active_users") },
          { key: "docs", label: "Documents", render: (row) => text(row, "documents_uploaded") },
          { key: "status", label: "Status", render: (row) => <AdminBadge>{text(row, "status")}</AdminBadge> },
        ]}
        rows={rows}
      />
    );
  }

  return (
    <AdminResourcePage
      activeHref="/admin/blockchain-records"
      title="Blockchain Records"
      subtitle="Inspect anchoring status, transaction hashes, issuer addresses, and integrity checks."
      cards={[
        { label: "Records", value: rows.length, detail: "Tracked blockchain writes." },
        { label: "Anchored", value: rows.filter((row) => row.status === "anchored").length, detail: "Documents with on-chain records." },
        { label: "Failed", value: rows.filter((row) => row.status === "failed").length, detail: "Needs retry." },
      ]}
      columns={[
        { key: "hash", label: "Document Hash", render: (row) => text(row, "document_hash") },
        { key: "tx", label: "Transaction", render: (row) => text(row, "transaction_hash") },
        { key: "block", label: "Block", render: (row) => text(row, "block_number") || "Pending" },
        { key: "network", label: "Network", render: (row) => text(row, "network") },
        { key: "status", label: "Status", render: (row) => <AdminBadge>{text(row, "status")}</AdminBadge> },
        { key: "anchored", label: "Anchored", render: (row) => formatAdminDate(text(row, "anchored_at")) },
      ]}
      rows={rows}
    />
  );
}
