"use client";

import { useState } from "react";
import { Modal } from "@/features/admin/components/modal";
import AddIcon from "@mui/icons-material/Add";

type CreateInvitationModalProps = {
  label?: string;
  className?: string;
  onCreate?: (invite: { email: string; role: string }) => void;
};

export function CreateInvitationModal({ label = "Create Invitation", className, onCreate }: CreateInvitationModalProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (onCreate) {
        onCreate({ email, role: "lawyer" });
      } else {
        const response = await fetch("/api/admin/invitations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, role: "lawyer" }),
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.message ?? "Failed to create invitation.");
        }
        window.location.reload();
      }
      setEmail("");
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create invitation.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className ?? "flex cursor-pointer items-center gap-2 rounded-lg bg-[#0985E7] px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-[#0770c4]"}
      >
        <AddIcon fontSize="small" />
        {label}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Create Invitation">
        <p className="text-sm font-semibold text-[#64748b]">
          Send a magic-link invitation to a Lawyer to join the platform.
        </p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {error}
            </p>
          ) : null}
          <div>
            <label className="block text-xs font-black uppercase tracking-[0.1em] text-[#64748b] mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="issuer@example.com"
              className="w-full rounded-xl border border-[#E4EEF9] bg-[#F8FBFF] px-4 py-2.5 text-sm font-semibold text-[#0C2B49] outline-none placeholder:text-[#94a3b8] focus:border-[#0985E7]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full cursor-pointer rounded-xl bg-[#0985E7] px-5 py-3 text-sm font-black text-white transition hover:bg-[#0770c4] disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send Invitation"}
          </button>
        </form>
      </Modal>
    </>
  );
}
