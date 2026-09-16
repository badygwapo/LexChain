"use client";

import { useState, useRef, useEffect } from "react";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { Dropdown } from "@/features/admin/components/dropdown";
import { Table } from "@/features/admin/components/table";

type AdminUser = {
  id: string;
  email: string;
  f_name?: string;
  l_name?: string;
  role: string;
  is_active?: boolean;
  created_at: string;
};

function formatRole(role: string) {
  switch (role) {
    case "admin": return "Admin";
    case "lawyer": return "Lawyer";
    case "user": return "User";
    default: return role;
  }
}

function getRoleBadgeClass(role: string) {
  switch (role) {
    case "admin": return "bg-[#f5f3ff] text-[#7c3aed]";
    case "lawyer": return "bg-[#dbeafe] text-[#2563eb]";
    case "user": return "bg-[#f0f9ff] text-[#0284c7]";
    default: return "bg-[#f1f5f9] text-[#64748b]";
  }
}

function getUserStatus(user: AdminUser) {
  return user.is_active !== false;
}

function ActionsMenu({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={`User actions for ${userId}`}
        className="cursor-pointer rounded-lg p-1.5 text-[#64748b] transition hover:bg-[#EEF4FB] hover:text-[#0C2B49]"
      >
        <MoreHorizIcon fontSize="small" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-36 overflow-hidden rounded-xl border border-[#E4EEF9] bg-white shadow-lg">
          {["View", "Edit", "Deactivate"].map((action) => (
            <button
              key={action}
              type="button"
              onClick={() => setOpen(false)}
              className="flex w-full cursor-pointer px-4 py-2.5 text-left text-sm font-semibold text-[#0C2B49] transition hover:bg-[#EEF4FB]"
            >
              {action}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function UsersTable({ users }: { users: AdminUser[] }) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("latest");

  const roles = [...new Set(users.map((u) => formatRole(u.role)))];

  const filtered = users
    .filter((user) => {
      const name = `${user.f_name ?? ""} ${user.l_name ?? ""}`.trim().toLowerCase();
      const matchesSearch = name.includes(search.toLowerCase()) || user.email.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === "all" || formatRole(user.role) === roleFilter;
      const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? getUserStatus(user) : !getUserStatus(user));
      return matchesSearch && matchesRole && matchesStatus;
    })
    .sort((a, b) => {
      const diff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return sortOrder === "latest" ? diff : -diff;
    });

  return (
    <article className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-[#E4EEF9] bg-white">
      <div className="flex flex-wrap items-center gap-3 border-b border-[#E4EEF9] px-6 py-4">
        <h2 className="text-lg font-black text-[#0C2B49]">All Users</h2>
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-[#E4EEF9] bg-[#F8FBFF] px-3 py-2">
            <SearchIcon fontSize="small" className="text-[#64748b]" />
            <input
              type="text"
              placeholder="Search name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm font-semibold text-[#0C2B49] outline-none placeholder:text-[#94a3b8] w-48"
            />
          </div>
          <Dropdown
            icon={<FilterListIcon fontSize="small" className="text-[#64748b]" />}
            value={roleFilter}
            onChange={setRoleFilter}
            options={[{ label: "All Roles", value: "all" }, ...roles.map((r) => ({ label: r, value: r }))]}
          />
          <Dropdown
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { label: "All Status", value: "all" },
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
            ]}
          />
          <Dropdown
            value={sortOrder}
            onChange={setSortOrder}
            options={[
              { label: "Latest", value: "latest" },
              { label: "Oldest", value: "oldest" },
            ]}
          />
        </div>
      </div>
      <Table
        columns={[
          { key: "name", label: "Name", render: (user) => <span className="font-semibold text-[#0C2B49]">{`${user.f_name ?? ""} ${user.l_name ?? ""}`.trim() || user.email}</span> },
          { key: "email", label: "Email", render: (user) => <span className="text-[#64748b]">{user.email}</span> },
          { key: "role", label: "Role", render: (user) => <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${getRoleBadgeClass(user.role)}`}>{formatRole(user.role)}</span> },
          { key: "status", label: "Status", render: (user) => <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${getUserStatus(user) ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>{getUserStatus(user) ? "Active" : "Inactive"}</span> },
          { key: "joined", label: "Joined", render: (user) => <span className="text-[#64748b] tabular-nums">{new Date(user.created_at).toLocaleDateString()}</span> },
          { key: "actions", label: "", render: (user) => <ActionsMenu userId={user.id} /> },
        ]}
        data={filtered}
        keyExtractor={(user) => user.id}
        emptyMessage="No users found."
      />
    </article>
  );
}
