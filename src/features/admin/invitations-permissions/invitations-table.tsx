"use client";

import { useState } from "react";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import { Dropdown } from "@/features/admin/components/dropdown";
import { Table } from "@/features/admin/components/table";

type Invitation = {
  id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
  created_at: string;
};

export function InvitationsTable({ invitations }: { invitations: Invitation[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("latest");

  const filtered = invitations
    .filter((inv) => {
      const matchesSearch = inv.email.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const diff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return sortOrder === "latest" ? diff : -diff;
    });

  return (
    <article className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-[#E4EEF9] bg-white">
      <div className="flex flex-wrap items-center gap-3 border-b border-[#E4EEF9] px-6 py-4">
        <h2 className="text-lg font-black text-[#0C2B49]">All Invitations</h2>
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-[#E4EEF9] bg-[#F8FBFF] px-3 py-2">
            <SearchIcon fontSize="small" className="text-[#64748b]" />
            <input
              type="text"
              placeholder="Search email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48 bg-transparent text-sm font-semibold text-[#0C2B49] outline-none placeholder:text-[#94a3b8]"
            />
          </div>
          <Dropdown
            icon={<FilterListIcon fontSize="small" className="text-[#64748b]" />}
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { label: "All Status", value: "all" },
              { label: "Pending", value: "pending" },
              { label: "Accepted", value: "accepted" },
              { label: "Revoked", value: "revoked" },
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
          { key: "email", label: "Email", render: (inv) => <span className="font-semibold text-[#0C2B49]">{inv.email}</span> },
          { key: "role", label: "Role", render: (inv) => <span className="rounded-full bg-[#EEF4FB] px-2.5 py-1 text-xs font-black capitalize text-[#0985E7]">{inv.role}</span> },
          { key: "status", label: "Status", render: (inv) => <span className={`rounded-full px-2.5 py-1 text-xs font-black ${inv.status === "accepted" ? "bg-green-50 text-green-700" : inv.status === "pending" ? "bg-yellow-50 text-yellow-700" : "bg-red-50 text-red-600"}`}>{inv.status}</span> },
          { key: "created", label: "Created", render: (inv) => <span className="text-[#64748b]">{new Date(inv.created_at).toLocaleDateString()}</span> },
          { key: "expires", label: "Expires", render: (inv) => <span className="text-[#64748b]">{new Date(inv.expires_at).toLocaleDateString()}</span> },
        ]}
        data={filtered}
        keyExtractor={(inv) => inv.id}
        emptyMessage="No invitations found."
      />
    </article>
  );
}
