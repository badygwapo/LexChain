"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import Link from "next/link";
import SearchIcon from "@mui/icons-material/Search";
import DownloadIcon from "@mui/icons-material/Download";
import EmailIcon from "@mui/icons-material/Email";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import GppBadIcon from "@mui/icons-material/GppBad";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ReplayIcon from "@mui/icons-material/Replay";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Dropdown } from "@/features/admin/components/dropdown";
import { MockModal, exportMockRows, useMockToast } from "@/features/admin/components/mock-ui";
import { CreateInvitationModal } from "@/features/admin/invitations-permissions/create-invitation-modal";
import { getPortalRoleLabel } from "@/features/access";

type Invitation = {
  id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
  created_at: string;
  magic_link?: string | null;
};

type DirectoryInvitation = Invitation & {
  invitee: string;
  initials: string;
  roleLabel: string;
  statusLabel: "Pending" | "Accepted" | "Expired" | "Revoked";
  createdLabel: string;
  expiresLabel: string;
};

function cn(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getNameFromEmail(email: string) {
  return email
    .split("@")[0]
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getInitials(name: string) {
  const parts = name.split(" ").filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? parts[0]?.[1] ?? "")).toUpperCase();
}

function getStatus(status: string): DirectoryInvitation["statusLabel"] {
  const raw = status.toLowerCase();
  if (raw === "accepted") return "Accepted";
  if (raw === "expired") return "Expired";
  if (raw === "revoked") return "Revoked";
  return "Pending";
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

function formatExpires(invitation: Invitation) {
  const status = getStatus(invitation.status);
  if (status === "Accepted" || status === "Revoked") return "—";
  if (status === "Expired") return "Expired";
  const timestamp = new Date(invitation.expires_at).getTime();
  if (Number.isNaN(timestamp)) return invitation.expires_at;
  return formatDate(invitation.expires_at);
}

function withInviteEmail(link: string | null | undefined, email: string) {
  if (!link) return null;

  try {
    const url = new URL(link);
    url.searchParams.set("email", email);
    return url.toString();
  } catch {
    const separator = link.includes("?") ? "&" : "?";
    return `${link}${separator}email=${encodeURIComponent(email)}`;
  }
}

function enrichInvitation(invitation: Invitation): DirectoryInvitation {
  const invitee = getNameFromEmail(invitation.email);
  return {
    ...invitation,
    magic_link: withInviteEmail(invitation.magic_link, invitation.email),
    invitee,
    initials: getInitials(invitee),
    roleLabel: getPortalRoleLabel(invitation.role),
    statusLabel: getStatus(invitation.status),
    createdLabel: formatDate(invitation.created_at),
    expiresLabel: formatExpires(invitation),
  };
}

function MetricCard({ label, value, detail, icon, tone }: { label: string; value: number; detail: string; icon: React.ReactNode; tone: "blue" | "yellow" | "green" | "orange" | "red" | "purple" }) {
  const tones = {
    blue: "bg-[#EAF3FF] text-[#0879D8]",
    yellow: "bg-[#FFF7E6] text-[#F59E0B]",
    green: "bg-[#EAFBF1] text-[#16A34A]",
    orange: "bg-[#FFF1E8] text-[#F97316]",
    red: "bg-[#FEECEC] text-[#EF4444]",
    purple: "bg-[#F4ECFF] text-[#7C3AED]",
  };

  return (
    <article className="flex min-h-[112px] items-center gap-3 rounded-2xl border border-[#E4EEF9] bg-white p-4 shadow-sm shadow-[#DDEAF7]/40 transition hover:-translate-y-0.5 hover:border-[#C7DBEF]">
      <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-full", tones[tone])}>{icon}</div>
      <div className="min-w-0">
        <p className="truncate text-xs font-black text-[#4B6382]">{label}</p>
        <p className="mt-1 text-2xl font-black leading-none text-[#071B33]">{value.toLocaleString()}</p>
        <p className="mt-2 truncate text-xs font-semibold text-[#5B6F8A]">{detail}</p>
      </div>
    </article>
  );
}

function StatusPill({ status }: { status: DirectoryInvitation["statusLabel"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-black",
        status === "Accepted" && "bg-[#EAFBF1] text-[#16A34A]",
        status === "Pending" && "bg-[#FFF4DF] text-[#D97706]",
        status === "Expired" && "bg-[#F1F5F9] text-[#64748B]",
        status === "Revoked" && "bg-[#FEECEC] text-[#DC2626]",
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

function ActionsMenu({ invite, onView, onCopyLink, onRevoke }: { invite: DirectoryInvitation; onView: () => void; onCopyLink: () => void; onRevoke: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative flex items-center justify-end gap-1">
      <button type="button" onClick={onView} aria-label={`View ${invite.email}`} className="rounded-lg p-1.5 text-[#7C8DA5] transition hover:bg-[#EEF4FB] hover:text-[#0985E7]">
        <VisibilityIcon sx={{ fontSize: 17 }} />
      </button>
      <button type="button" onClick={onCopyLink} aria-label={`Copy invite link for ${invite.email}`} className="rounded-lg p-1.5 text-[#7C8DA5] transition hover:bg-[#EEF4FB] hover:text-[#0985E7]">
        <ReplayIcon sx={{ fontSize: 17 }} />
      </button>
      <button type="button" aria-label={`More actions for ${invite.email}`} aria-expanded={open} onClick={() => setOpen((value) => !value)} className="rounded-lg p-1.5 text-[#7C8DA5] transition hover:bg-[#EEF4FB] hover:text-[#0985E7]">
        <MoreVertIcon sx={{ fontSize: 17 }} />
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-50 mt-1 w-40 overflow-hidden rounded-xl border border-[#E4EEF9] bg-white shadow-xl shadow-[#183B6B]/10">
          <button type="button" onClick={() => { setOpen(false); onCopyLink(); }} className="block w-full px-4 py-2.5 text-left text-sm font-bold text-[#0C2B49] transition hover:bg-[#EEF4FB]">Copy invite link</button>
          <button type="button" onClick={() => { setOpen(false); onRevoke(); }} className="block w-full px-4 py-2.5 text-left text-sm font-bold text-red-600 transition hover:bg-red-50">Revoke access</button>
        </div>
      ) : null}
    </div>
  );
}

function StatusDistribution({ invitations }: { invitations: DirectoryInvitation[] }) {
  const groups = [
    { label: "Accepted", status: "Accepted", color: "#41B96B" },
    { label: "Pending", status: "Pending", color: "#F6B52E" },
    { label: "Expired", status: "Expired", color: "#F97316" },
    { label: "Revoked", status: "Revoked", color: "#EF4444" },
  ] as const;
  const total = Math.max(1, invitations.length);
  let cursor = 0;
  const gradient = groups.map((group) => {
    const count = invitations.filter((invite) => invite.statusLabel === group.status).length;
    const start = cursor;
    cursor += (count / total) * 100;
    return `${group.color} ${start}% ${cursor}%`;
  }).join(", ");

  return (
    <article className="flex h-fit self-start flex-col rounded-2xl border border-[#E4EEF9] bg-white p-3 shadow-sm shadow-[#DDEAF7]/35">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-black text-[#071B33]">Invitation Status</h2>
      </div>
      <div className="grid items-center gap-5 sm:grid-cols-[160px_1fr] xl:grid-cols-1 2xl:grid-cols-[160px_1fr]">
        <div className="relative mx-auto size-36 rounded-full" style={{ background: `conic-gradient(${gradient})` }}>
          <div className="absolute inset-6 flex flex-col items-center justify-center rounded-full bg-white text-center">
            <strong className="text-2xl font-black text-[#071B33]">{total}</strong>
            <span className="text-xs font-semibold text-[#6B7E95]">Total Invites</span>
          </div>
        </div>
        <div className="space-y-3">
          {groups.map((group) => {
            const count = invitations.filter((invite) => invite.statusLabel === group.status).length;
            return (
              <div key={group.status} className="flex items-center gap-3 text-sm">
                <span className="size-2.5 rounded-full" style={{ backgroundColor: group.color }} />
                <span className="min-w-0 flex-1 font-semibold text-[#4B6382]">{group.label}</span>
                <strong className="font-black text-[#071B33]">{count}</strong>
                <span className="text-xs font-semibold text-[#5B6F8A]">({Math.round((count / total) * 100)}%)</span>
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}

function ActivityPanel({ invitations, mockMode }: { invitations: DirectoryInvitation[]; mockMode: boolean }) {
  const activity = invitations.slice(0, 5).map((invite) => ({
    label: `${invite.statusLabel} — ${invite.email}`,
    time: invite.createdLabel,
    icon: invite.statusLabel === "Accepted" ? <CheckCircleIcon fontSize="small" /> : invite.statusLabel === "Expired" ? <HourglassTopIcon fontSize="small" /> : invite.statusLabel === "Revoked" ? <GppBadIcon fontSize="small" /> : <EmailIcon fontSize="small" />,
    color: invite.statusLabel === "Accepted" ? "text-[#16A34A]" : invite.statusLabel === "Expired" ? "text-[#F97316]" : invite.statusLabel === "Revoked" ? "text-[#EF4444]" : "text-[#0879D8]",
  }));

  return (
    <article className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[#E4EEF9] bg-white p-3 shadow-sm shadow-[#DDEAF7]/35">
      <div className="mb-2 flex shrink-0 items-center justify-between">
        <h2 className="text-lg font-black text-[#071B33]">Recent Invitation Activity</h2>
        <Link href="/portal/audit-logs" className="text-xs font-black text-[#0985E7] hover:text-[#0767B9]">View logs</Link>
      </div>
      <div className="admin-table-scroll scrollbar-hide min-h-0 max-h-64 flex-1 space-y-3 overflow-y-auto pr-1 xl:max-h-none xl:flex-1">
        {activity.map((item) => (
          <div key={item.label} className="grid grid-cols-[24px_1fr_auto] items-center gap-3 rounded-xl py-1.5 transition hover:bg-[#F8FBFF]">
            <span className={item.color}>{item.icon}</span>
            <span className="truncate text-sm font-semibold text-[#0C2B49]">{item.label}</span>
            <span className="text-xs font-semibold text-[#5B6F8A]">{item.time}</span>
          </div>
        ))}
        {activity.length === 0 ? <p className="text-sm font-semibold text-[#5B6F8A]">{mockMode ? "No mock invitation activity." : "No invitation activity returned by the API."}</p> : null}
      </div>
    </article>
  );
}

export function InvitationsManagementView({ invitations, mockMode = false }: { invitations: Invitation[]; mockMode?: boolean }) {
  const { showToast } = useMockToast();
  const [tableSearch, setTableSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [pageSize, setPageSize] = useState("10");
  const [page, setPage] = useState(0);
  const [selectedInvite, setSelectedInvite] = useState<DirectoryInvitation | null>(null);
  const [modalMode, setModalMode] = useState<"view" | "revoke" | null>(null);

  const directoryInvites = useMemo(() => invitations.map(enrichInvitation), [invitations]);
  const roleOptions = useMemo(() => [...new Set(directoryInvites.map((invite) => invite.roleLabel))], [directoryInvites]);

  const filtered = useMemo(() => {
    const query = tableSearch.trim().toLowerCase();
    return directoryInvites.filter((invite) => {
      const matchesSearch = !query || invite.email.toLowerCase().includes(query) || invite.invitee.toLowerCase().includes(query) || invite.roleLabel.toLowerCase().includes(query);
      const matchesStatus = statusFilter === "all" || invite.statusLabel === statusFilter;
      const matchesRole = roleFilter === "all" || invite.roleLabel === roleFilter;
      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [directoryInvites, roleFilter, statusFilter, tableSearch]);

  const perPage = Number(pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages - 1);
  const visibleInvites = filtered.slice(safePage * perPage, (safePage + 1) * perPage);
  const pendingCount = directoryInvites.filter((invite) => invite.statusLabel === "Pending").length;
  const copyInviteLink = async (invite: DirectoryInvitation) => {
    if (!invite.magic_link) {
      showToast({ title: "No magic link returned", detail: invite.email, tone: "info" });
      return;
    }

    await navigator.clipboard?.writeText(invite.magic_link);
    showToast({ title: "Invitation link copied", detail: invite.email, tone: "success" });
  };

  const metrics = [
    { label: "Total Invites", value: directoryInvites.length, detail: "All invitation records", icon: <EmailIcon fontSize="small" />, tone: "blue" as const },
    { label: "Pending", value: pendingCount, detail: "Awaiting acceptance", icon: <AccessTimeIcon fontSize="small" />, tone: "yellow" as const },
    { label: "Accepted", value: directoryInvites.filter((invite) => invite.statusLabel === "Accepted").length, detail: "Activated accounts", icon: <CheckCircleIcon fontSize="small" />, tone: "green" as const },
    { label: "Expired", value: directoryInvites.filter((invite) => invite.statusLabel === "Expired").length, detail: "Resend required", icon: <HourglassTopIcon fontSize="small" />, tone: "orange" as const },
    { label: "Revoked", value: directoryInvites.filter((invite) => invite.statusLabel === "Revoked").length, detail: "Access withdrawn", icon: <GppBadIcon fontSize="small" />, tone: "red" as const },
  ];

  return (
    <div className="flex w-full flex-col gap-5 xl:h-[calc(100dvh-113px)] xl:min-h-0">
      <header className="flex shrink-0 flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#0879D8]">LexChain Operations</p>
          <h1 className="mt-1 text-3xl font-black leading-tight text-[#071B33]">Issuer Invitations</h1>
          <p className="mt-1 text-sm font-semibold text-[#4B6382]">Manage Lawyer invitations from the backend invitation response.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <CreateInvitationModal
            label="New Invitation"
            className="inline-flex items-center gap-2 rounded-xl bg-[#0985E7] px-5 py-3 text-sm font-black text-white shadow-sm shadow-[#0985E7]/25 transition hover:bg-[#0770C4]"
          />
        </div>
      </header>

      <section className="grid shrink-0 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}
      </section>

      <section className="grid min-h-0 gap-4 xl:flex-1 xl:grid-cols-[minmax(0,1fr)_420px]">
        <article className="flex h-fit min-h-[520px] min-w-0 self-start flex-col overflow-hidden rounded-2xl border border-[#E4EEF9] bg-white shadow-sm shadow-[#DDEAF7]/35 xl:h-full xl:min-h-0">
          <div className="shrink-0 border-b border-[#E4EEF9] p-5">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="mr-auto shrink-0 text-lg font-black text-[#071B33]">Invitation Directory</h2>
              <label className="flex w-full items-center gap-2 rounded-xl border border-[#E4EEF9] bg-white px-4 py-2.5 focus-within:border-[#0985E7] sm:w-72">
                <SearchIcon fontSize="small" className="text-[#4B6382]" />
                <input value={tableSearch} onChange={(event) => setTableSearch(event.target.value)} placeholder="Search invitations..." className="w-full bg-transparent text-sm font-semibold text-[#0C2B49] outline-none placeholder:text-[#9AAAC0]" />
              </label>
              <div className="[&>div>button]:py-2.5">
                <Dropdown value={roleFilter} onChange={(value) => { setRoleFilter(value); setPage(0); }} options={[{ label: "Role", value: "all" }, ...roleOptions.map((role) => ({ label: role, value: role }))]} />
              </div>
              <div className="[&>div>button]:py-2.5">
                <Dropdown value={statusFilter} onChange={(value) => { setStatusFilter(value); setPage(0); }} options={[{ label: "Status", value: "all" }, { label: "Pending", value: "Pending" }, { label: "Accepted", value: "Accepted" }, { label: "Expired", value: "Expired" }, { label: "Revoked", value: "Revoked" }]} />
              </div>
              <button type="button" onClick={() => { exportMockRows("lexchain-invitations", filtered, "csv"); showToast({ title: "Invitations exported", detail: `${filtered.length} invitations downloaded.` }); }} className="inline-flex items-center gap-2 rounded-xl border border-[#E4EEF9] bg-white px-4 py-2.5 text-sm font-black text-[#0C2B49] transition hover:border-[#0985E7]">
                <DownloadIcon fontSize="small" />
                Export
              </button>
            </div>
          </div>

          <div className="admin-table-scroll min-h-0 flex-1 overflow-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="border-b border-[#D9E5F0] bg-[#F8FBFF] text-left text-xs font-black uppercase tracking-[0.08em] text-[#4B6382]">
                  <th className="px-5 py-3">Invitee</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Created</th>
                  <th className="px-5 py-3">Expires</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleInvites.map((invite, index) => (
                  <tr key={invite.id} className="h-[68px] border-b border-[#F1F5F9] transition hover:bg-[#F8FBFF]">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className={cn("flex size-10 items-center justify-center rounded-full text-xs font-black", index % 4 === 0 ? "bg-[#EAF3FF] text-[#0879D8]" : index % 4 === 1 ? "bg-[#EAFBF1] text-[#16A34A]" : index % 4 === 2 ? "bg-[#F4ECFF] text-[#7C3AED]" : "bg-[#FFF1E8] text-[#F97316]")}>{invite.initials}</div>
                        <div className="min-w-0">
                          <p className="truncate font-black text-[#071B33]">{invite.invitee}</p>
                          <p className="truncate text-xs font-semibold text-[#5B6F8A]">{invite.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-semibold text-[#0C2B49]">{invite.roleLabel}</td>
                    <td className="px-5 py-3"><StatusPill status={invite.statusLabel} /></td>
                    <td className="px-5 py-3 font-semibold text-[#0C2B49]">{invite.createdLabel}</td>
                    <td className={cn("px-5 py-3 font-semibold", invite.expiresLabel === "Expired" ? "text-[#EF4444]" : "text-[#0C2B49]")}>{invite.expiresLabel}</td>
                    <td className="px-5 py-3">
                      <ActionsMenu
                        invite={invite}
                        onView={() => { setSelectedInvite(invite); setModalMode("view"); }}
                        onCopyLink={() => { void copyInviteLink(invite); }}
                        onRevoke={() => { setSelectedInvite(invite); setModalMode("revoke"); }}
                      />
                    </td>
                  </tr>
                ))}
                {visibleInvites.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sm font-semibold text-[#5B6F8A]">No invitations match the current filters.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="flex shrink-0 flex-col gap-3 border-t border-[#E4EEF9] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-[#5B6F8A]">
              Showing {filtered.length === 0 ? 0 : safePage * perPage + 1}-{Math.min((safePage + 1) * perPage, filtered.length)} of {filtered.length} invitations
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => setPage((value) => Math.max(0, value - 1))} disabled={safePage === 0} aria-label="Previous page" className="rounded-lg border border-[#E4EEF9] p-2 text-[#4B6382] transition hover:bg-[#EEF4FB] disabled:opacity-35"><ChevronLeftIcon fontSize="small" /></button>
              {[...Array(Math.min(3, totalPages))].map((_, index) => (
                <button key={index} type="button" onClick={() => setPage(index)} className={cn("size-9 rounded-lg border text-sm font-black transition", safePage === index ? "border-[#0985E7] bg-[#EAF3FF] text-[#0879D8]" : "border-[#E4EEF9] text-[#0C2B49] hover:bg-[#EEF4FB]")}>{index + 1}</button>
              ))}
              {totalPages > 3 && <span className="px-2 text-sm font-black text-[#5B6F8A]">...</span>}
              <button type="button" onClick={() => setPage((value) => Math.min(totalPages - 1, value + 1))} disabled={safePage >= totalPages - 1} aria-label="Next page" className="rounded-lg border border-[#E4EEF9] p-2 text-[#4B6382] transition hover:bg-[#EEF4FB] disabled:opacity-35"><ChevronRightIcon fontSize="small" /></button>
              <Dropdown openUp value={pageSize} onChange={setPageSize} options={[{ label: "10 / page", value: "10" }, { label: "20 / page", value: "20" }]} />
            </div>
          </div>
        </article>

        <aside className="grid min-h-0 content-start gap-4 xl:h-full xl:grid-rows-[auto_minmax(0,1fr)]">
          <StatusDistribution invitations={directoryInvites} />
          <ActivityPanel invitations={directoryInvites} mockMode={mockMode} />
        </aside>
      </section>
      <MockModal open={modalMode === "view"} onClose={() => setModalMode(null)} title={selectedInvite?.invitee ?? "Invitation details"} description="Invitation details from the backend response." footer={<button type="button" onClick={() => setModalMode(null)} className="w-full rounded-xl bg-[#0985E7] px-5 py-3 text-sm font-black text-white">Done</button>}>
        {selectedInvite ? <div className="space-y-3 text-sm font-semibold text-[#4B6382]"><p><strong className="text-[#071B33]">Email:</strong> {selectedInvite.email}</p><p><strong className="text-[#071B33]">Role:</strong> {selectedInvite.roleLabel}</p><p><strong className="text-[#071B33]">Status:</strong> {selectedInvite.statusLabel}</p><p><strong className="text-[#071B33]">Magic link:</strong> {selectedInvite.magic_link ?? "Not returned"}</p></div> : null}
      </MockModal>
      <MockModal open={modalMode === "revoke"} onClose={() => setModalMode(null)} title={`Revoke ${selectedInvite?.email ?? "invitation"}?`} description="This sends a revoke request to the invitations backend." footer={<div className="flex gap-3"><button type="button" onClick={() => setModalMode(null)} className="flex-1 rounded-xl border border-[#E4EEF9] px-5 py-3 text-sm font-black text-[#0C2B49]">Cancel</button><button type="button" onClick={async () => { if (!selectedInvite) return; const response = await fetch(`/api/admin/invitations/${encodeURIComponent(selectedInvite.id)}`, { method: "DELETE" }); if (!response.ok) { showToast({ title: "Revoke failed", detail: selectedInvite.email, tone: "error" }); return; } showToast({ title: "Invitation revoked", detail: selectedInvite.email, tone: "warning" }); setModalMode(null); window.location.reload(); }} className="flex-1 rounded-xl bg-red-600 px-5 py-3 text-sm font-black text-white">Revoke</button></div>}>
        <p className="text-sm font-semibold text-[#5B6F8A]">After revoke succeeds, this page reloads from the backend response.</p>
      </MockModal>
    </div>
  );
}
