"use client";

import { useMemo, useState } from "react";
import { usePopup } from "@/shared/components/ui/use-popup";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import DownloadIcon from "@mui/icons-material/Download";
import ArticleIcon from "@mui/icons-material/Article";
import ListAltIcon from "@mui/icons-material/ListAlt";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import StorageIcon from "@mui/icons-material/Storage";
import ScheduleIcon from "@mui/icons-material/Schedule";
import VisibilityIcon from "@mui/icons-material/Visibility";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { toast } from "sonner";
import { Dropdown } from "@/features/admin/components/dropdown";
import { MockModal, exportMockRows } from "@/features/admin/components/mock-ui";

type AuditLog = {
  id: string;
  user_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

type AuditRow = AuditLog & {
  timestampLabel: string;
  targetLabel: string;
  detailsLabel: string;
};

function cn(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getTargetLabel(log: AuditLog) {
  return [log.target_type, log.target_id].filter(Boolean).join(" / ") || "—";
}

function getDetailsLabel(details: AuditLog["details"]) {
  if (!details) return "—";
  return JSON.stringify(details);
}

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function enrichLog(log: AuditLog): AuditRow {
  return {
    ...log,
    targetLabel: getTargetLabel(log),
    detailsLabel: getDetailsLabel(log.details),
    timestampLabel: formatTimestamp(log.created_at),
  };
}

function MetricCard({
  label,
  value,
  detail,
  icon,
  tone,
}: {
  label: string;
  value: number;
  detail: string;
  icon: React.ReactNode;
  tone: "blue" | "green" | "purple" | "orange" | "red" | "yellow";
}) {
  const tones = {
    blue: "bg-[#EAF3FF] text-[#0879D8]",
    green: "bg-[#EAFBF1] text-[#16A34A]",
    purple: "bg-[#F4ECFF] text-[#7C3AED]",
    orange: "bg-[#FFF1E8] text-[#F97316]",
    red: "bg-[#FEECEC] text-[#EF4444]",
    yellow: "bg-[#FFF7E6] text-[#F59E0B]",
  };

  return (
    <article className="flex min-h-[112px] items-center gap-3 rounded-2xl border border-[#E4EEF9] bg-white p-4 shadow-sm shadow-[#DDEAF7]/40 transition hover:-translate-y-0.5 hover:border-[#C7DBEF]">
      <div
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-full",
          tones[tone],
        )}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-black text-[#4B6382]">{label}</p>
        <p className="mt-1 text-2xl font-black leading-none text-[#071B33]">
          {value.toLocaleString()}
        </p>
        <p className="mt-2 truncate text-xs font-semibold text-[#5B6F8A]">
          {detail}
        </p>
      </div>
    </article>
  );
}

function RowActions({
  row,
  onView,
  onExport,
  onCopy,
}: {
  row: AuditRow;
  onView: () => void;
  onExport: () => void;
  onCopy: () => void;
}) {
  const { open, setOpen, ref } = usePopup();

  return (
    <div ref={ref} className="relative flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={onView}
        aria-label={`View audit event ${row.id}`}
        className="rounded-lg p-1.5 text-[#4B6382] transition hover:bg-[#EEF4FB] hover:text-[#0985E7]"
      >
        <VisibilityIcon sx={{ fontSize: 18 }} />
      </button>
      <button
        type="button"
        onClick={onExport}
        aria-label={`Export audit event ${row.id}`}
        className="rounded-lg p-1.5 text-[#4B6382] transition hover:bg-[#EEF4FB] hover:text-[#0985E7]"
      >
        <DownloadIcon sx={{ fontSize: 18 }} />
      </button>
      <button
        type="button"
        aria-label={`More actions for audit event ${row.id}`}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="rounded-lg p-1.5 text-[#4B6382] transition hover:bg-[#EEF4FB] hover:text-[#0985E7]"
      >
        <MoreVertIcon sx={{ fontSize: 18 }} />
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-50 mt-1 w-40 overflow-hidden rounded-xl border border-[#E4EEF9] bg-white shadow-xl shadow-[#183B6B]/10">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onView();
            }}
            className="block w-full px-4 py-2.5 text-left text-sm font-bold text-[#0C2B49] transition hover:bg-[#EEF4FB]"
          >
            Open details
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onCopy();
            }}
            className="block w-full px-4 py-2.5 text-left text-sm font-bold text-[#0C2B49] transition hover:bg-[#EEF4FB]"
          >
            Copy event ID
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function AuditLogsManagementView({
  logs,
  total,
}: {
  logs: AuditLog[];
  total: number;
}) {
  const showToast = ({ title, detail, tone }: { title: string; detail?: string; tone?: string }) => {
    if (tone === "error") toast.error(title, { description: detail });
    else toast.success(title, { description: detail });
  };
  const [tableSearch, setTableSearch] = useState("");
  const [targetFilter, setTargetFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState("10");
  const { open: moreFiltersOpen, setOpen: setMoreFiltersOpen, ref: filtersRef } = usePopup();
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedRow, setSelectedRow] = useState<AuditRow | null>(null);
  const [modalMode, setModalMode] = useState<"view" | null>(null);

  const rows = useMemo(() => logs.map(enrichLog), [logs]);
  const targetTypes = useMemo(
    () => [
      ...new Set(
        rows
          .map((row) => row.target_type)
          .filter((value): value is string => Boolean(value)),
      ),
    ],
    [rows],
  );
  const totalDisplay = total;
  const metricCounts = {
    returned: rows.length,
    withUser: rows.filter((row) => row.user_id).length,
    withTarget: rows.filter((row) => row.target_type || row.target_id).length,
    withDetails: rows.filter((row) => row.details).length,
  };

  const filtered = useMemo(() => {
    const queries = [tableSearch].map((value) => value.trim().toLowerCase()).filter(Boolean);
    const start = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : -Infinity;
    const endDate = toDate ? new Date(`${toDate}T00:00:00`) : null;
    // Advance the calendar day rather than 24 hours to include DST transition days.
    const end = endDate ? endDate.setDate(endDate.getDate() + 1) : Infinity;
    return rows.filter((row) => {
      const values = [
        row.id,
        row.user_id,
        row.action,
        row.target_type,
        row.target_id,
        row.ip_address,
        row.user_agent,
        row.detailsLabel,
      ];
      const matchesSearch =
        queries.every((query) => values.some((value) => (value ?? "").toLowerCase().includes(query)));
      const matchesTarget =
        targetFilter === "all" || row.target_type === targetFilter;
      const timestamp = new Date(row.created_at).getTime();
      const matchesDate = (!fromDate && !toDate) || (timestamp >= start && timestamp < end);
      return matchesSearch && matchesTarget && matchesDate;
    });
  }, [rows, tableSearch, targetFilter, fromDate, toDate]);

  const perPage = Number(pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages - 1);
  const visibleRows = filtered.slice(
    safePage * perPage,
    (safePage + 1) * perPage,
  );

  const metrics = [
    {
      label: "Total Events",
      value: totalDisplay,
      detail: "Backend total",
      icon: <ListAltIcon fontSize="small" />,
      tone: "blue" as const,
    },
    {
      label: "Returned",
      value: metricCounts.returned,
      detail: "Events in current response",
      icon: <ScheduleIcon fontSize="small" />,
      tone: "yellow" as const,
    },
    {
      label: "With User ID",
      value: metricCounts.withUser,
      detail: "user_id present",
      icon: <ManageAccountsIcon fontSize="small" />,
      tone: "green" as const,
    },
    {
      label: "With Target",
      value: metricCounts.withTarget,
      detail: "target_type or target_id present",
      icon: <StorageIcon fontSize="small" />,
      tone: "purple" as const,
    },
    {
      label: "With Details",
      value: metricCounts.withDetails,
      detail: "details object present",
      icon: <ArticleIcon fontSize="small" />,
      tone: "orange" as const,
    },
  ];

  return (
    <div className="flex w-full flex-col gap-5 xl:h-[calc(100dvh-113px)] xl:min-h-0">
      <header className="shrink-0">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#0879D8]">
            LexChain Operations
          </p>
          <h1 className="mt-1 text-3xl font-black leading-tight text-[#071B33]">
            Audit Logs
          </h1>
          <p className="mt-1 text-sm font-semibold text-[#4B6382]">
            Monitor user activity, system events, access changes, and
            security-relevant actions across the platform.
          </p>
        </div>
      </header>

      <section className="grid shrink-0 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className="grid min-h-0 gap-4 xl:flex-1">
        <article className="flex h-fit min-h-[520px] min-w-0 self-start flex-col overflow-hidden rounded-2xl border border-[#E4EEF9] bg-white shadow-sm shadow-[#DDEAF7]/35 xl:h-full xl:min-h-0">
          <div className="shrink-0 border-b border-[#E4EEF9] p-5">
            <div className="flex flex-wrap items-center gap-3 [&>div>button]:py-2.5">
              <h2 className="mr-auto shrink-0 text-lg font-black text-[#071B33]">Audit Trail</h2>
              <label className="flex w-full items-center gap-2 rounded-xl border border-[#E4EEF9] bg-white px-4 py-2.5 focus-within:border-[#0985E7] sm:w-72">
                <SearchIcon fontSize="small" className="text-[#4B6382]" />
                <input
                  aria-label="Search audit trail"
                  value={tableSearch}
                  onChange={(event) => { setTableSearch(event.target.value); setPage(0); }}
                  placeholder="Search audit trail..."
                  className="w-full bg-transparent text-sm font-semibold text-[#0C2B49] outline-none placeholder:text-[#9AAAC0]"
                />
              </label>
              <Dropdown
                value={targetFilter}
                onChange={(value) => { setTargetFilter(value); setPage(0); }}
                options={[
                  { label: "Target Type", value: "all" },
                  ...targetTypes.map((target) => ({
                    label: target,
                    value: target,
                  })),
                ]}
              />
              <div ref={filtersRef} className="relative">
              <button
                type="button"
                aria-expanded={moreFiltersOpen}
                aria-controls="audit-date-filters"
                onClick={() => setMoreFiltersOpen((value) => !value)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-black transition",
                  moreFiltersOpen
                    ? "border-[#0985E7] bg-[#EAF3FF] text-[#0879D8]"
                    : "border-[#E4EEF9] bg-white text-[#0C2B49] hover:border-[#0985E7]",
                )}
              >
                <FilterListIcon fontSize="small" />
                More Filters
              </button>
            {moreFiltersOpen ? (
              <div id="audit-date-filters" role="region" aria-label="Audit filters" className="absolute right-0 top-full z-50 mt-2 grid w-[min(440px,calc(100vw-3rem))] grid-cols-1 gap-4 rounded-xl border border-[#E4EEF9] bg-white p-4 text-sm font-semibold text-[#0C2B49] shadow-lg sm:grid-cols-2">
                <label className="grid gap-1.5 text-sm font-semibold text-[#4B6382]">
                  From date
                  <input type="date" value={fromDate} max={toDate || undefined} onChange={(event) => { setFromDate(event.target.value); setPage(0); }} className="min-w-0 rounded-lg border border-[#E4EEF9] bg-[#F8FBFF] px-3 py-2" />
                </label>
                <label className="grid gap-1.5 text-sm font-semibold text-[#4B6382]">
                  To date
                  <input type="date" value={toDate} min={fromDate || undefined} onChange={(event) => { setToDate(event.target.value); setPage(0); }} className="min-w-0 rounded-lg border border-[#E4EEF9] bg-[#F8FBFF] px-3 py-2" />
                </label>
                <button type="button" onClick={() => { setFromDate(""); setToDate(""); setTableSearch(""); setTargetFilter("all"); setPage(0); }} className="rounded-xl bg-[#EEF4FB] py-2.5 text-[#0879D8] sm:col-span-2">Reset filters</button>
              </div>
            ) : null}
              </div>
              <button
                type="button"
                onClick={() => {
                  exportMockRows("lexchain-audit-logs", filtered, "csv");
                  showToast({
                    title: "Audit logs exported",
                    detail: `${filtered.length} events downloaded.`,
                  });
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-[#E4EEF9] bg-white px-4 py-2.5 text-sm font-black text-[#0C2B49] transition hover:border-[#0985E7]"
              >
                <DownloadIcon fontSize="small" />
                Export
              </button>
            </div>
          </div>

          <div className="admin-table-scroll min-h-0 flex-1 overflow-auto">
            <table className="w-full min-w-[1180px] text-sm">
              <thead>
                <tr className="border-b border-[#D9E5F0] bg-[#F8FBFF] text-left text-xs font-black uppercase tracking-[0.08em] text-[#4B6382]">
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">User ID</th>
                  <th className="px-5 py-3">Action</th>
                  <th className="px-5 py-3">IP Address</th>
                  <th className="px-5 py-3">User Agent</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr
                    key={row.id}
                    className="h-[68px] border-b border-[#F1F5F9] transition hover:bg-[#F8FBFF]"
                  >
                    <td className="px-5 py-3 font-semibold text-[#0C2B49]">
                      {row.timestampLabel}
                    </td>
                    <td className="px-5 py-3 font-semibold text-[#0C2B49]">
                      {row.user_id ?? "—"}
                    </td>
                    <td className="px-5 py-3 font-semibold text-[#0C2B49]">
                      {row.action}
                    </td>
                    <td className="px-5 py-3 font-semibold text-[#0C2B49]">
                      {row.ip_address ?? "—"}
                    </td>
                    <td className="max-w-[220px] truncate px-5 py-3 font-semibold text-[#0C2B49]">
                      {row.user_agent ?? "—"}
                    </td>
                    <td className="px-5 py-3">
                      <RowActions
                        row={row}
                        onCopy={async () => {
                          try {
                            await navigator.clipboard.writeText(row.id);
                            showToast({ title: "Event ID copied" });
                          } catch {
                            showToast({ title: "Could not copy event ID", detail: "Copy the ID from event details instead.", tone: "error" });
                          }
                        }}
                        onView={() => {
                          setSelectedRow(row);
                          setModalMode("view");
                        }}
                        onExport={() => {
                          exportMockRows(
                            `audit-event-${row.id}`,
                            [row],
                            "json",
                          );
                          showToast({
                            title: "Audit event exported",
                            detail: row.id,
                          });
                        }}
                      />
                    </td>
                  </tr>
                ))}
                {visibleRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-10 text-center text-sm font-semibold text-[#5B6F8A]"
                    >
                      No audit events match the current filters.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="flex shrink-0 flex-col gap-3 border-t border-[#E4EEF9] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-[#5B6F8A]">
              Showing {filtered.length === 0 ? 0 : safePage * perPage + 1}-
              {Math.min((safePage + 1) * perPage, filtered.length)} of{" "}
              {filtered.length} events
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                aria-label="Previous page"
                onClick={() => setPage(Math.max(0, safePage - 1))}
                disabled={safePage === 0}
                className="rounded-lg border border-[#E4EEF9] p-2 text-[#4B6382] transition hover:bg-[#EEF4FB] disabled:opacity-35"
              >
                <ChevronLeftIcon fontSize="small" />
              </button>
              {[...Array(Math.min(3, totalPages))].map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setPage(index)}
                  className={cn(
                    "size-9 rounded-lg border text-sm font-black transition",
                    safePage === index
                      ? "border-[#0985E7] bg-[#EAF3FF] text-[#0879D8]"
                      : "border-[#E4EEF9] text-[#0C2B49] hover:bg-[#EEF4FB]",
                  )}
                >
                  {index + 1}
                </button>
              ))}
              {totalPages > 3 && (
                <span className="px-2 text-sm font-black text-[#5B6F8A]">
                  ...
                </span>
              )}
              <button
                type="button"
                aria-label="Next page"
                onClick={() =>
                  setPage(Math.min(totalPages - 1, safePage + 1))
                }
                disabled={safePage >= totalPages - 1}
                className="rounded-lg border border-[#E4EEF9] p-2 text-[#4B6382] transition hover:bg-[#EEF4FB] disabled:opacity-35"
              >
                <ChevronRightIcon fontSize="small" />
              </button>
              <Dropdown
                value={pageSize}
                openUp
                onChange={(value) => { setPageSize(value); setPage(0); }}
                options={[
                  { label: "10 / page", value: "10" },
                  { label: "20 / page", value: "20" },
                ]}
              />
            </div>
          </div>
        </article>
      </section>
      <MockModal
        open={modalMode === "view"}
        onClose={() => setModalMode(null)}
        title={selectedRow?.id ?? "Audit event"}
        description="Audit event fields from the backend response."
        footer={
          <button
            type="button"
            onClick={() => setModalMode(null)}
            className="w-full rounded-xl bg-[#0985E7] px-5 py-3 text-sm font-black text-white"
          >
            Done
          </button>
        }
      >
        {selectedRow ? (
          <div className="space-y-3 text-sm font-semibold text-[#4B6382]">
            <p>
              <strong className="text-[#071B33]">User ID:</strong>{" "}
              {selectedRow.user_id ?? "—"}
            </p>
            <p>
              <strong className="text-[#071B33]">Action:</strong>{" "}
              {selectedRow.action}
            </p>
            <p>
              <strong className="text-[#071B33]">Target:</strong>{" "}
              {selectedRow.targetLabel}
            </p>
            <p>
              <strong className="text-[#071B33]">IP Address:</strong>{" "}
              {selectedRow.ip_address ?? "—"}
            </p>
            <p>
              <strong className="text-[#071B33]">User Agent:</strong>{" "}
              {selectedRow.user_agent ?? "—"}
            </p>
            <p>
              <strong className="text-[#071B33]">Details:</strong>
            </p>
            {selectedRow.details ? (
              <div className="space-y-2 pl-4">
              {Object.entries(selectedRow.details).map(([key, value]) => (
                <p key={key}>
                <strong className="text-[#071B33]">{key}:</strong>{" "}
                {typeof value === "object"
                  ? JSON.stringify(value)
                  : String(value)}
                </p>
              ))}
              </div>
            ) : (
              <p>—</p>
            )}
          </div>
        ) : null}
      </MockModal>
    </div>
  );
}
