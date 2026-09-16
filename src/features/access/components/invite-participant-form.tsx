'use client';

import { useState } from 'react';
import type { DocumentParticipantPermission } from '@/features/access/participant-access';
import { documentParticipantPermissions, validateParticipantInvitation } from '@/features/access/participant-access';

type InviteParticipantFormProps = {
  onInvite: (invitation: { email: string; role: DocumentParticipantPermission }) => Promise<void>;
};

const permissionLabels: Record<DocumentParticipantPermission, string> = {
  viewer: 'Viewer',
  signer: 'Signer',
  editor: 'Editor',
};

export function InviteParticipantForm({ onInvite }: InviteParticipantFormProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<DocumentParticipantPermission>('viewer');
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validateParticipantInvitation({ email, role });
    if (!validation.valid) {
      setError(validation.message);
      return;
    }

    setError(undefined);
    setIsSubmitting(true);
    try {
      await onInvite(validation.value);
      setEmail('');
      setRole('viewer');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to invite this participant.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-[18px] border border-[#E8F0F8] bg-white p-5 shadow-[0_4px_12px_rgba(19,59,115,0.05)]">
      <h2 className="text-lg font-extrabold text-[#0C2B49]">Invite a participant</h2>
      <p className="mt-1 text-sm font-medium text-[#64748b]">Grant access to this document only.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_150px_auto]">
        <label className="flex flex-col gap-1.5 text-xs font-bold text-[#0C2B49]">
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" placeholder="participant@example.com" className="rounded-xl border border-[#D6E3F1] px-3 py-2.5 text-sm font-medium outline-none focus:border-[#0985E7]" />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-bold text-[#0C2B49]">
          Permission
          <select value={role} onChange={(event) => setRole(event.target.value as DocumentParticipantPermission)} className="rounded-xl border border-[#D6E3F1] bg-white px-3 py-2.5 text-sm font-medium outline-none focus:border-[#0985E7]">
            {documentParticipantPermissions.map((permission) => <option key={permission} value={permission}>{permissionLabels[permission]}</option>)}
          </select>
        </label>
        <button type="submit" disabled={isSubmitting} className="self-end rounded-xl bg-[#0985E7] px-4 py-2.5 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? 'Inviting…' : 'Send invitation'}</button>
      </div>
      {error && <p role="alert" className="mt-3 text-sm font-semibold text-[#C2410C]">{error}</p>}
    </form>
  );
}
