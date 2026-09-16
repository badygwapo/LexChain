'use client';

import { useState } from 'react';
import type { components } from '@/shared/types/index';

type DocumentParty = components['schemas']['DocumentPartyResponse'];

type ParticipantAccessTableProps = {
  parties: DocumentParty[];
  onRevoke: (party: DocumentParty) => Promise<void>;
};

export function ParticipantAccessTable({ parties, onRevoke }: ParticipantAccessTableProps) {
  const [partyToRevoke, setPartyToRevoke] = useState<DocumentParty>();
  const [isRevoking, setIsRevoking] = useState(false);
  const [error, setError] = useState<string>();

  async function confirmRevoke() {
    if (!partyToRevoke) return;
    setError(undefined);
    setIsRevoking(true);
    try {
      await onRevoke(partyToRevoke);
      setPartyToRevoke(undefined);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to revoke document access.');
    } finally {
      setIsRevoking(false);
    }
  }

  return (
    <section className="rounded-[18px] border border-[#E8F0F8] bg-white shadow-[0_4px_12px_rgba(19,59,115,0.05)]">
      <div className="border-b border-[#E8F0F8] px-5 py-4">
        <h2 className="text-lg font-extrabold text-[#0C2B49]">Document participants</h2>
        <p className="mt-1 text-sm font-medium text-[#64748b]">Access is limited to this document.</p>
      </div>
      {parties.length === 0 ? <p className="px-5 py-6 text-sm font-medium text-[#64748b]">No participants have access yet.</p> : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="bg-[#F8FBFF] text-xs uppercase tracking-wide text-[#64748b]"><tr><th className="px-5 py-3">Participant</th><th className="px-5 py-3">Permission</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Actions</th></tr></thead>
            <tbody>{parties.map((party) => <tr key={party.id} className="border-t border-[#EEF3F8]"><td className="px-5 py-4"><p className="font-bold text-[#0C2B49]">{party.f_name} {party.l_name}</p><p className="text-xs text-[#64748b]">{party.email}</p></td><td className="px-5 py-4 capitalize text-[#0C2B49]">{party.role}</td><td className="px-5 py-4 capitalize text-[#0C2B49]">{party.status}</td><td className="px-5 py-4 text-right"><button type="button" disabled title="Resending document invitations is not supported by the current API." className="mr-2 rounded-lg border border-[#D6E3F1] px-3 py-1.5 text-xs font-bold text-[#64748b] disabled:cursor-not-allowed disabled:opacity-60">Resend unavailable</button><button type="button" onClick={() => setPartyToRevoke(party)} className="rounded-lg border border-[#F4C7C3] px-3 py-1.5 text-xs font-bold text-[#B42318]">Revoke</button></td></tr>)}</tbody>
          </table>
        </div>
      )}
      {error && <p role="alert" className="px-5 pb-4 text-sm font-semibold text-[#C2410C]">{error}</p>}
      {partyToRevoke && <div role="dialog" aria-modal="true" aria-label="Confirm participant revocation" className="border-t border-[#E8F0F8] bg-[#FFF9F8] px-5 py-4"><p className="font-bold text-[#0C2B49]">Revoke access for {partyToRevoke.email}?</p><p className="mt-1 text-sm text-[#64748b]">They will no longer be able to open this document. Historical activity remains recorded.</p><div className="mt-3 flex gap-2"><button type="button" onClick={() => setPartyToRevoke(undefined)} disabled={isRevoking} className="rounded-lg border border-[#D6E3F1] px-3 py-2 text-sm font-bold text-[#0C2B49]">Cancel</button><button type="button" onClick={() => void confirmRevoke()} disabled={isRevoking} className="rounded-lg bg-[#B42318] px-3 py-2 text-sm font-bold text-white disabled:opacity-60">{isRevoking ? 'Revoking…' : 'Revoke access'}</button></div></div>}
    </section>
  );
}
