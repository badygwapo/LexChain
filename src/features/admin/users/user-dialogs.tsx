import { useState } from "react";
import { Field, MockModal, inputClassName } from "@/features/admin/components/mock-ui";
import type { AdminUser, DemoAdminUserChanges, DirectoryUser } from "./users-types";

export type UserDialogSelection = {
  mode: "view" | "edit" | "suspend";
  user: DirectoryUser;
};

function cn(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function UserDialogs({
  selection: { mode, user: selectedUser },
  onClose,
  onSave,
}: {
  selection: UserDialogSelection;
  onClose: () => void;
  onSave: (changes: DemoAdminUserChanges) => void;
}) {
  const [userDraft, setUserDraft] = useState<AdminUser>(selectedUser);

  return (
    <>
      <MockModal
        open={mode === "view"}
        onClose={onClose}
        title={selectedUser.displayName}
        description="User profile details from the System Management directory."
        footer={<button type="button" onClick={onClose} className="w-full rounded-xl bg-[#0985E7] px-5 py-3 text-sm font-black text-white">Done</button>}
      >
          <div className="space-y-3 text-sm font-semibold text-[#4B6382]">
            <p><strong className="text-[#071B33]">Email:</strong> {selectedUser.email}</p>
            <p><strong className="text-[#071B33]">Role:</strong> {selectedUser.roleLabel}</p>
            <p><strong className="text-[#071B33]">Status:</strong> {selectedUser.statusLabel}</p>
            <p><strong className="text-[#071B33]">Created:</strong> {new Date(selectedUser.created_at).toLocaleDateString()}</p>
          </div>
      </MockModal>
      <MockModal
        open={mode === "edit"}
        onClose={onClose}
        title="Edit User"
        description="Update this account for the current demo session."
        footer={
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-[#E4EEF9] px-5 py-3 text-sm font-black text-[#0C2B49]">Cancel</button>
            <button type="button" onClick={() => {
              onSave({
                f_name: userDraft.f_name,
                l_name: userDraft.l_name,
                email: userDraft.email,
                role: userDraft.role,
              });
            }} className="flex-1 rounded-xl bg-[#0985E7] px-5 py-3 text-sm font-black text-white">Save</button>
          </div>
        }
      >
          <div className="grid gap-4">
            <Field label="First name"><input className={inputClassName} value={userDraft.f_name ?? ""} onChange={(event) => setUserDraft((draft) => ({ ...draft, f_name: event.target.value }))} /></Field>
            <Field label="Last name"><input className={inputClassName} value={userDraft.l_name ?? ""} onChange={(event) => setUserDraft((draft) => ({ ...draft, l_name: event.target.value }))} /></Field>
            <Field label="Email"><input className={inputClassName} value={userDraft.email} onChange={(event) => setUserDraft((draft) => ({ ...draft, email: event.target.value }))} /></Field>
            <Field label="Role"><select className={inputClassName} value={userDraft.role} onChange={(event) => setUserDraft((draft) => ({ ...draft, role: event.target.value }))}><option value="lawyer">Lawyer</option><option value="user">User</option></select></Field>
            <p className="text-xs font-semibold text-[#5B6F8A]">Demo mode — changes reset when this page is refreshed.</p>
          </div>
      </MockModal>
      <MockModal
        open={mode === "suspend"}
        onClose={onClose}
        title={`${selectedUser.statusLabel === "Active" ? "Suspend" : "Reactivate"} ${selectedUser.displayName}?`}
        description="Update this account status for the current demo session."
        footer={
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-[#E4EEF9] px-5 py-3 text-sm font-black text-[#0C2B49]">Cancel</button>
            <button type="button" onClick={() => {
              onSave({ is_active: selectedUser.statusLabel !== "Active" });
            }} className={cn(
              "flex-1 rounded-xl px-5 py-3 text-sm font-black text-white",
              selectedUser.statusLabel === "Active" ? "bg-red-600" : "bg-green-700",
            )}>{selectedUser.statusLabel === "Active" ? "Suspend" : "Reactivate"}</button>
          </div>
        }
      >
        <div className="space-y-3 text-sm font-semibold text-[#5B6F8A]">
          <p>{selectedUser.statusLabel === "Active" ? "This account will be marked as suspended." : "This account will be marked as active."}</p>
          <p className="text-xs">Demo mode — changes reset when this page is refreshed.</p>
        </div>
      </MockModal>
    </>
  );
}
