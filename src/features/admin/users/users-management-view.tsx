"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import dayjs from "dayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Dropdown } from "@/features/admin/components/dropdown";
import { FilterDetails } from "@/shared/components/ui/filter-details";
import { usePopup } from "@/shared/components/ui/use-popup";
import { useMockToast } from "@/features/admin/components/mock-ui";
import { getPortalRoleLabel } from "@/features/access";
import { UsersMetrics, RoleDistribution, RecentlyCreatedAccounts, StatusPill } from "./users-summary";
import { UserDialogs, type UserDialogSelection } from "./user-dialogs";
import type { AdminUser, DemoAdminUserChanges, DirectoryUser } from "./users-types";

const datePickerSlotProps = {
  textField: { size: "small" as const, fullWidth: true },
  field: { clearable: true },
  popper: { disablePortal: true },
  desktopPaper: { sx: { borderRadius: 3, border: "1px solid #E4EEF9" } },
};

export function updateDemoUser(
  users: AdminUser[],
  userId: string,
  changes: DemoAdminUserChanges,
): AdminUser[] {
  return users.map((user) => user.id === userId ? { ...user, ...changes } : user);
}

function cn(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getName(user: AdminUser) {
  return `${user.f_name ?? ""} ${user.l_name ?? ""}`.trim() || user.email.split("@")[0];
}

function getInitials(name: string) {
  const parts = name.split(" ").filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? parts[0]?.[1] ?? "")).toUpperCase();
}

function deriveRole(user: AdminUser) {
  return getPortalRoleLabel(user.role);
}

function getStatus(user: AdminUser): DirectoryUser["statusLabel"] {
  return user.is_active === false ? "Suspended" : "Active";
}

function enrichUser(user: AdminUser): DirectoryUser {
  const displayName = getName(user);
  return {
    ...user,
    roleLabel: deriveRole(user),
    displayName,
    initials: getInitials(displayName),
    statusLabel: getStatus(user),
  };
}

function ActionsMenu({ user, onView, onEdit, onChangeStatus }: { user: DirectoryUser; onView: () => void; onEdit: () => void; onChangeStatus: () => void }) {
  const { open, setOpen, ref } = usePopup();
  const isCurrentAccount = user.email === "admin@lexchain.local";

  return (
    <div ref={ref} className="relative flex items-center justify-end gap-1">
      <button type="button" onClick={onView} aria-label={`View ${user.displayName}`} className="rounded-lg p-1.5 text-[#7C8DA5] transition hover:bg-[#EEF4FB] hover:text-[#0985E7]">
        <VisibilityIcon fontSize="small" />
      </button>
      <button type="button" onClick={onEdit} aria-label={`Edit ${user.displayName}`} className="rounded-lg p-1.5 text-[#7C8DA5] transition hover:bg-[#EEF4FB] hover:text-[#0985E7]">
        <EditIcon fontSize="small" />
      </button>
      <button
        type="button"
        aria-label={`More actions for ${user.displayName}`}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="rounded-lg p-1.5 text-[#7C8DA5] transition hover:bg-[#EEF4FB] hover:text-[#0985E7]"
      >
        <MoreVertIcon fontSize="small" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-40 overflow-hidden rounded-xl border border-[#E4EEF9] bg-white shadow-xl shadow-[#183B6B]/10">
          {["Reset password", "Change role"].map((action) => (
            <button
              key={action}
              type="button"
              onClick={() => setOpen(false)}
              className="block w-full px-4 py-2.5 text-left text-sm font-bold text-[#0C2B49] transition hover:bg-[#EEF4FB]"
            >
              {action}
            </button>
          ))}
          <button
            type="button"
            disabled={isCurrentAccount && user.statusLabel === "Active"}
            aria-label={isCurrentAccount && user.statusLabel === "Active" ? "Current account cannot be suspended" : undefined}
            onClick={() => { setOpen(false); onChangeStatus(); }}
            className={cn(
              "block w-full px-4 py-2.5 text-left text-sm font-bold transition",
              isCurrentAccount && user.statusLabel === "Active"
                ? "cursor-not-allowed text-[#94A3B8]"
                : user.statusLabel === "Active"
                  ? "text-red-600 hover:bg-red-50"
                  : "text-green-700 hover:bg-green-50",
            )}
          >
            {isCurrentAccount && user.statusLabel === "Active"
              ? "Current account cannot be suspended"
              : user.statusLabel === "Active" ? "Suspend user" : "Reactivate user"}
          </button>
        </div>
      )}
    </div>
  );
}

export function UsersManagementView({ users, total }: { users: AdminUser[]; total: number }) {
  const { showToast } = useMockToast();
  const [tableSearch, setTableSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState("6");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [sortOrder, setSortOrder] = useState("created-desc");
  const [dialogSelection, setDialogSelection] = useState<UserDialogSelection | null>(null);
  const [userRows, setUserRows] = useState(users);

  const directoryUsers = useMemo(() => userRows.map(enrichUser), [userRows]);
  const roleOptions = useMemo(() => [...new Set(directoryUsers.map((user) => user.roleLabel))], [directoryUsers]);

  const filtered = useMemo(() => {
    const query = tableSearch.trim().toLowerCase();
    return directoryUsers.filter((user) => {
      const matchesSearch = !query || user.displayName.toLowerCase().includes(query) || user.email.toLowerCase().includes(query);
      const matchesRole = roleFilter === "all" || user.roleLabel === roleFilter;
      const matchesStatus = statusFilter === "all" || user.statusLabel === statusFilter;
      const created = new Date(user.created_at);
      const date = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, "0")}-${String(created.getDate()).padStart(2, "0")}`;
      const matchesDate = (!createdFrom || date >= createdFrom) && (!createdTo || date <= createdTo);
      return matchesSearch && matchesRole && matchesStatus && matchesDate;
    }).sort((a, b) => {
      const direction = sortOrder.endsWith("desc") ? -1 : 1;
      if (sortOrder.startsWith("created")) return direction * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      const field = sortOrder.startsWith("email") ? "email" : "displayName";
      return direction * a[field].localeCompare(b[field]);
    });
  }, [directoryUsers, roleFilter, statusFilter, tableSearch, createdFrom, createdTo, sortOrder]);

  const perPage = Number(pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages - 1);
  const visibleUsers = filtered.slice(safePage * perPage, (safePage + 1) * perPage);

  return (
    <div className="flex w-full flex-col gap-5 xl:h-[calc(100dvh-113px)] xl:min-h-0">
      <header className="flex shrink-0 flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#0879D8]">LexChain Operations</p>
          <h1 className="mt-1 text-3xl font-black leading-tight text-[#071B33]">Users</h1>
          <p className="mt-1 text-sm font-semibold text-[#4B6382]">Manage registered accounts, roles, and access permissions.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/portal/issuer-invitations" className="inline-flex items-center gap-2 rounded-xl bg-[#0985E7] px-5 py-3 text-sm font-black text-white shadow-sm shadow-[#0985E7]/25 transition hover:bg-[#0770C4]">
            <PersonAddIcon fontSize="small" />
            Invite User
          </Link>
        </div>
      </header>

      <UsersMetrics users={directoryUsers} total={total} />

      <section className="grid min-h-0 gap-4 xl:flex-1 xl:grid-cols-[minmax(0,1fr)_420px]">
        <article className="flex h-fit min-h-[520px] min-w-0 self-start flex-col overflow-hidden rounded-2xl border border-[#E4EEF9] bg-white shadow-sm shadow-[#DDEAF7]/35 xl:h-full xl:min-h-0">
          <div className="shrink-0 border-b border-[#E4EEF9] p-5">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="mr-auto shrink-0 text-lg font-black text-[#071B33]">User Directory</h2>
              <label className="flex w-full items-center gap-2 rounded-xl border border-[#E4EEF9] bg-white px-4 py-2.5 focus-within:border-[#0985E7] sm:w-72">
                <SearchIcon fontSize="small" className="text-[#4B6382]" />
                <input
                  value={tableSearch}
                  onChange={(event) => setTableSearch(event.target.value)}
                  placeholder="Search users..."
                  className="w-full bg-transparent text-sm font-semibold text-[#0C2B49] outline-none placeholder:text-[#9AAAC0]"
                />
              </label>
              <div className="flex items-center gap-2 text-sm font-semibold text-[#4B6382] [&>div>button]:py-2.5">
                <Dropdown value={sortOrder} onChange={(value) => { setSortOrder(value); setPage(0); }} options={[
                  { label: "Newest first", value: "created-desc" },
                  { label: "Oldest first", value: "created-asc" },
                  { label: "Name A–Z", value: "name-asc" },
                  { label: "Name Z–A", value: "name-desc" },
                  { label: "Email A–Z", value: "email-asc" },
                  { label: "Email Z–A", value: "email-desc" },
                ]} />
              </div>
              <FilterDetails summary={<>
                  <FilterListIcon fontSize="small" />
                  More Filters{roleFilter !== "all" || statusFilter !== "all" || createdFrom || createdTo ? " •" : ""}
                </>}>
                <div className="absolute right-0 top-full z-50 mt-2 grid w-[min(440px,calc(100vw-3rem))] grid-cols-1 gap-x-3 gap-y-4 rounded-xl sm:grid-cols-2 border border-[#E4EEF9] bg-white p-4 text-sm font-semibold text-[#0C2B49] shadow-lg">
                  <div className="grid gap-1.5 [&>div>button]:w-full [&>div>button]:justify-between"><span>Role</span>
                    <Dropdown value={roleFilter} onChange={(value) => { setRoleFilter(value); setPage(0); }} options={[{ label: "All Roles", value: "all" }, ...roleOptions.map((role) => ({ label: role, value: role }))]} />
                  </div>
                  <div className="grid gap-1.5 [&>div>button]:w-full [&>div>button]:justify-between"><span>Status</span>
                    <Dropdown value={statusFilter} onChange={(value) => { setStatusFilter(value); setPage(0); }} options={[{ label: "All Statuses", value: "all" }, { label: "Active", value: "Active" }, { label: "Suspended", value: "Suspended" }]} />
                  </div>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      sx={{ "& .MuiPickersOutlinedInput-root": { borderRadius: 3, backgroundColor: "#F8FBFF", color: "#0C2B49" } }}
                      label="Created from"
                      format="MM/DD/YYYY"
                      value={createdFrom ? dayjs(createdFrom) : null}
                      maxDate={createdTo ? dayjs(createdTo) : undefined}
                      onChange={(value, context) => { if (context.validationError) return; setCreatedFrom(value?.format("YYYY-MM-DD") ?? ""); setPage(0); }}
                      slotProps={datePickerSlotProps}
                    />
                    <DatePicker
                      sx={{ "& .MuiPickersOutlinedInput-root": { borderRadius: 3, backgroundColor: "#F8FBFF", color: "#0C2B49" } }}
                      label="Created through"
                      format="MM/DD/YYYY"
                      value={createdTo ? dayjs(createdTo) : null}
                      minDate={createdFrom ? dayjs(createdFrom) : undefined}
                      onChange={(value, context) => { if (context.validationError) return; setCreatedTo(value?.format("YYYY-MM-DD") ?? ""); setPage(0); }}
                      slotProps={datePickerSlotProps}
                    />
                  </LocalizationProvider>
                  <button type="button" onClick={() => { setCreatedFrom(""); setCreatedTo(""); setSortOrder("created-desc"); setTableSearch(""); setRoleFilter("all"); setStatusFilter("all"); setPage(0); }} className="rounded-xl border-t border-[#E4EEF9] bg-[#EEF4FB] py-2.5 text-[#0879D8] sm:col-span-2">Reset filters</button>
                </div>
              </FilterDetails>
            </div>
          </div>

          <div className="admin-table-scroll min-h-0 flex-1 overflow-auto">
            <table className="w-full min-w-[920px] text-sm">
              <thead>
                <tr className="border-b border-[#D9E5F0] bg-[#F8FBFF] text-left text-xs font-black uppercase tracking-[0.08em] text-[#4B6382]">
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Created</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleUsers.map((user, index) => (
                  <tr key={user.id} className="h-[68px] border-b border-[#F1F5F9] transition hover:bg-[#F8FBFF]">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className={cn("flex size-10 items-center justify-center rounded-full text-xs font-black", index % 3 === 0 ? "bg-[#EAF3FF] text-[#0879D8]" : index % 3 === 1 ? "bg-[#F4ECFF] text-[#7C3AED]" : "bg-[#FFF4DF] text-[#D97706]")}>{user.initials}</div>
                        <div className="min-w-0">
                          <p className="truncate font-black text-[#071B33]">{user.displayName}</p>
                          <p className="truncate text-xs font-semibold text-[#5B6F8A]">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-semibold text-[#0C2B49]">{user.roleLabel}</td>
                    <td className="px-5 py-3"><StatusPill status={user.statusLabel} /></td>
                    <td className="px-5 py-3 font-semibold text-[#0C2B49]">{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-3">
                      <ActionsMenu
                        user={user}
                        onView={() => setDialogSelection({ user, mode: "view" })}
                        onEdit={() => setDialogSelection({ user, mode: "edit" })}
                        onChangeStatus={() => setDialogSelection({ user, mode: "suspend" })}
                      />
                    </td>
                  </tr>
                ))}
                {visibleUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-sm font-semibold text-[#5B6F8A]">No users match the current filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex shrink-0 flex-col gap-3 border-t border-[#E4EEF9] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-[#5B6F8A]">
              Showing {filtered.length === 0 ? 0 : safePage * perPage + 1}-{Math.min((safePage + 1) * perPage, filtered.length)} of {filtered.length} users
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => setPage((value) => Math.max(0, value - 1))} disabled={safePage === 0} aria-label="Previous page" className="rounded-lg border border-[#E4EEF9] p-2 text-[#4B6382] transition hover:bg-[#EEF4FB] disabled:opacity-35">
                <ChevronLeftIcon fontSize="small" />
              </button>
              {[...Array(Math.min(3, totalPages))].map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setPage(index)}
                  className={cn("size-9 rounded-lg border text-sm font-black transition", safePage === index ? "border-[#0985E7] bg-[#EAF3FF] text-[#0879D8]" : "border-[#E4EEF9] text-[#0C2B49] hover:bg-[#EEF4FB]")}
                >
                  {index + 1}
                </button>
              ))}
              {totalPages > 3 && <span className="px-2 text-sm font-black text-[#5B6F8A]">...</span>}
              <button type="button" onClick={() => setPage((value) => Math.min(totalPages - 1, value + 1))} disabled={safePage >= totalPages - 1} aria-label="Next page" className="rounded-lg border border-[#E4EEF9] p-2 text-[#4B6382] transition hover:bg-[#EEF4FB] disabled:opacity-35">
                <ChevronRightIcon fontSize="small" />
              </button>
              <Dropdown
                openUp
                value={pageSize}
                onChange={setPageSize}
                options={[{ label: "6 / page", value: "6" }, { label: "10 / page", value: "10" }, { label: "20 / page", value: "20" }]}
              />
            </div>
          </div>
        </article>

        <aside className="grid min-h-0 content-start gap-4 xl:h-full xl:grid-rows-[auto_minmax(0,1fr)]">
          <RoleDistribution users={directoryUsers} />
          <RecentlyCreatedAccounts users={directoryUsers} />
        </aside>
      </section>
      {dialogSelection && (
        <UserDialogs
          key={`${dialogSelection.user.id}:${dialogSelection.mode}`}
          selection={dialogSelection}
          onClose={() => setDialogSelection(null)}
          onSave={(changes) => {
            setUserRows((currentUsers) => updateDemoUser(currentUsers, dialogSelection.user.id, changes));
            showToast({ title: "Demo account updated", detail: "Demo mode — changes reset when this page is refreshed." });
            setDialogSelection(null);
          }}
        />
      )}
    </div>
  );
}
