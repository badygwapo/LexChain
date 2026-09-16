"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ApiSchema } from "@/shared/types/index";
import { RequestStatus } from "@/features/access/components/request-status";
import type { PortalDocumentRequestList } from "@/features/access/portal-compat-types";
import { portalFetch } from "@/shared/api/client";
import { getPortalUiRole } from "@/features/access/portal-role";
import { getRequestActionError, getRequestActions } from "@/features/access/request-ui";

type UserProfile = ApiSchema<"UserProfileResponse">;
type RequestStatusFilter = "pending" | "approved" | "rejected";

const filters: Array<"all" | RequestStatusFilter> = ["all", "pending", "approved", "rejected"];

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Recently" : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

async function reviewRequest(requestId: string, action: "approve" | "reject", rejectionReason?: string) {
  const response = await fetch(`/api/portal/proxy-post?path=${encodeURIComponent(`/requests/${requestId}/review`)}`, {
    method: "PATCH",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(action === "reject" ? { action, rejection_reason: rejectionReason } : { action }),
  });
  if (!response.ok) throw new Error("Unable to update request");
}

export default function RequestsPage() {
  const [filter, setFilter] = useState<"all" | RequestStatusFilter>("pending");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const path = filter === "all" ? "/requests" : `/requests?status=${filter}`;
  const profileQuery = useQuery<UserProfile>({ queryKey: ["portal-profile"], queryFn: () => portalFetch<UserProfile>("/users/") });
  const uiRole = getPortalUiRole(profileQuery.data?.role);
  const isIssuer = uiRole === "lawyer";
  const { data, error, isLoading } = useQuery<PortalDocumentRequestList>({ queryKey: ["portal-requests", filter], queryFn: () => portalFetch<PortalDocumentRequestList>(path), enabled: isIssuer });
  const requests = data?.requests ?? [];

  async function decide(requestId: string, action: "approve" | "reject") {
    const rejectionReason = reason.trim();
    if (action === "reject" && !rejectionReason) return;
    setBusyId(requestId);
    setActionError(null);
    try {
      await reviewRequest(requestId, action, rejectionReason || undefined);
      await queryClient.invalidateQueries({ queryKey: ["portal-requests"] });
      setRejectingId(null);
      setReason("");
    } catch {
      setActionError(getRequestActionError(action));
    } finally {
      setBusyId(null);
    }
  }

  if (profileQuery.isLoading) return <p className="text-sm font-semibold text-[#64748b]">Checking portal access…</p>;
  if (profileQuery.isError || !isIssuer) return <div className="rounded-[18px] border border-[#E8F0F8] bg-white p-8 text-center"><h1 className="text-xl font-black text-[#0C2B49]">Document request access unavailable</h1><p className="mt-2 text-sm font-semibold text-[#64748b]">Only Document Issuers can review e-copy requests.</p></div>;

  return <div className="flex flex-col gap-5"><div><p className="text-xs font-black tracking-wider text-[#0985E7]">REQUEST MANAGEMENT</p><h1 className="mt-1 text-[28px] font-black text-[#0C2B49]">Document Requests</h1><p className="mt-1 text-sm font-semibold text-[#64748b]">Review participant e-copy requests and record decisions.</p></div>
    <div className="flex flex-wrap gap-2">{filters.map((item) => <button type="button" key={item} onClick={() => setFilter(item)} className={`rounded-full px-4 py-2 text-sm font-black capitalize ${filter === item ? "bg-[#0985E7] text-white" : "border border-[#E8F0F8] bg-white text-[#64748b]"}`}>{item}</button>)}</div>
    {isLoading ? <p className="text-sm font-semibold text-[#64748b]">Loading requests…</p> : null}
    {error ? <p className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">Unable to load requests. Please try again.</p> : null}
    {actionError ? <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">{actionError}</p> : null}
    {!isLoading && !error && requests.length === 0 ? <div className="rounded-[18px] border border-[#E8F0F8] bg-white p-8 text-center text-sm font-bold text-[#0C2B49]">No requests found</div> : null}
    <div className="grid gap-3">{requests.map((request) => { const actions = getRequestActions(uiRole, request.status); const isRejecting = rejectingId === request.id; const isBusy = busyId === request.id; return <article key={request.id} className="rounded-[18px] border border-[#E8F0F8] bg-white p-5 shadow-[0_4px_12px_rgba(19,59,115,0.05)]"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-base font-black text-[#0C2B49]">{request.document_name ?? `Document ${request.document_id.slice(0, 8)}`}</h2><p className="mt-1 text-sm font-semibold text-[#64748b]">{request.requester_name} · {request.requester_email}</p></div><RequestStatus status={request.status} /></div><dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><div><dt className="font-black text-[#64748b]">Description</dt><dd className="mt-1 font-semibold text-[#0C2B49]">{request.description}</dd></div><div><dt className="font-black text-[#64748b]">Submitted</dt><dd className="mt-1 font-semibold text-[#0C2B49]">{formatDate(request.created_at)}</dd></div></dl>
      {actions.length > 0 ? <div className="mt-4 border-t border-[#E8F0F8] pt-4">{isRejecting ? <div className="flex flex-col gap-3"><label className="text-sm font-black text-[#0C2B49]">Rejection reason<textarea value={reason} onChange={(event) => setReason(event.target.value)} className="mt-1 min-h-24 w-full rounded-xl border border-[#E8F0F8] p-3 font-semibold outline-none focus:border-[#0985E7]" placeholder="Required before rejecting" /></label><div className="flex gap-3"><button type="button" onClick={() => { setRejectingId(null); setReason(""); }} className="rounded-full border border-[#E8F0F8] px-4 py-2 text-sm font-black text-[#64748b]">Cancel</button><button type="button" disabled={isBusy || !reason.trim()} onClick={() => void decide(request.id, "reject")} className="rounded-full bg-red-600 px-4 py-2 text-sm font-black text-white disabled:opacity-50">{isBusy ? "Rejecting…" : "Confirm rejection"}</button></div></div> : <div className="flex gap-3"><button type="button" disabled={isBusy} onClick={() => { setRejectingId(request.id); setReason(""); }} className="rounded-full border border-red-200 px-4 py-2 text-sm font-black text-red-700 disabled:opacity-50">Reject</button><button type="button" disabled={isBusy} onClick={() => void decide(request.id, "approve")} className="rounded-full bg-[#0985E7] px-4 py-2 text-sm font-black text-white disabled:opacity-50">{isBusy ? "Approving…" : "Approve"}</button></div>}</div> : null}</article>; })}</div>
  </div>;
}
