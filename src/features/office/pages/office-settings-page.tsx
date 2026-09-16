'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ApiSchema } from '@/shared/types/index';
import {
  defaultOfficeSettings,
  invitationExpiryDays,
  uploadLimitMegabytes,
  validateOfficeSettings,
  type OfficeSettings,
} from '@/features/office/office-settings-schema';
import { getPortalUiRole } from "@/features/access";

type NumberSettingField = keyof OfficeSettings;
type OfficeSettingsDraft = { [Key in NumberSettingField]: OfficeSettings[Key] | '' };
type UserProfile = ApiSchema<'UserProfileResponse'>;

const fields: Array<{
  key: NumberSettingField;
  label: string;
  description: string;
  range: { min: number; max: number; unit: string };
}> = [
  {
    key: 'invitationExpiryDays',
    label: 'Invitation expiry',
    description: 'How long an invitation remains available before it expires.',
    range: invitationExpiryDays,
  },
  {
    key: 'uploadLimitMegabytes',
    label: 'Upload limit',
    description: 'The largest document size this office can upload in the demo.',
    range: uploadLimitMegabytes,
  },
];

async function fetchProfile(): Promise<UserProfile | null> {
  const response = await fetch('/api/portal/proxy?path=%2Fusers%2F', { credentials: 'same-origin' });
  if (!response.ok) return null;
  return response.json();
}

export default function OfficeSettingsPage() {
  const profileQuery = useQuery<UserProfile | null>({ queryKey: ['portal-profile'], queryFn: fetchProfile });

  if (profileQuery.isLoading) {
    return <p className="py-10 text-sm font-semibold text-[#64748b]">Loading office settings access…</p>;
  }

  if (getPortalUiRole(profileQuery.data?.role) !== 'lawyer') {
    return <p className="text-sm font-semibold text-[#64748b]">Office Settings are available to Lawyers only.</p>;
  }

  return <OfficeSettingsForm />;
}

function OfficeSettingsForm() {
  const [savedSettings, setSavedSettings] = useState<OfficeSettings>(defaultOfficeSettings);
  const [settings, setSettings] = useState<OfficeSettingsDraft>(defaultOfficeSettings);
  const [savedMessage, setSavedMessage] = useState(false);
  const errors = useMemo(() => validateOfficeSettings({
    invitationExpiryDays: Number(settings.invitationExpiryDays),
    uploadLimitMegabytes: Number(settings.uploadLimitMegabytes),
  }), [settings]);
  const hasErrors = Object.values(errors).some(Boolean);
  const isDirty = Object.keys(settings).some((key) => (
    settings[key as NumberSettingField] !== savedSettings[key as NumberSettingField]
  ));

  function updateSetting(key: NumberSettingField, value: string) {
    setSavedMessage(false);
    setSettings((current) => ({ ...current, [key]: value === '' ? '' : Number(value) }));
  }

  function handleSave() {
    if (hasErrors || !isDirty) return;
    const nextSettings: OfficeSettings = {
      invitationExpiryDays: Number(settings.invitationExpiryDays),
      uploadLimitMegabytes: Number(settings.uploadLimitMegabytes),
    };
    setSavedSettings(nextSettings);
    setSettings(nextSettings);
    setSavedMessage(true);
  }

  function handleCancel() {
    setSettings(savedSettings);
    setSavedMessage(false);
  }

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <header>
        <p className="text-xs font-black uppercase tracking-[0.12em] text-[#0985E7]">Lawyer workspace</p>
        <h1 className="mt-1 text-[28px] font-black text-[#0C2B49]">Office Settings</h1>
        <p className="mt-1 text-sm text-[#64748b]">Set local defaults for invitations, uploads, and office sessions.</p>
      </header>

      <p className="rounded-[18px] border border-[#E8F0F8] bg-[#F8FBFF] p-4 text-sm font-semibold text-[#64748b]">
        Demo data — changes reset when this page is refreshed.
      </p>

      <form
        aria-label="Office settings"
        className="rounded-[18px] border border-[#E8F0F8] bg-white p-5"
        onSubmit={(event) => {
          event.preventDefault();
          handleSave();
        }}
      >
        <div className="space-y-6">
          {fields.map(({ key, label, description, range }) => {
            const error = errors[key];
            const inputId = `office-settings-${key}`;
            const errorId = `${inputId}-error`;

            return (
              <div key={key}>
                <label htmlFor={inputId} className="block text-sm font-black text-[#0C2B49]">{label}</label>
                <p className="mt-1 text-sm text-[#64748b]">{description}</p>
                <div className="mt-3 flex max-w-xs items-center gap-3">
                  <input
                    id={inputId}
                    type="number"
                    min={range.min}
                    max={range.max}
                    step="1"
                    value={settings[key]}
                    onChange={(event) => updateSetting(key, event.target.value)}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? errorId : undefined}
                    className="w-28 rounded-xl border border-[#D7E4F2] px-3 py-2 text-sm font-bold text-[#0C2B49] outline-none transition focus:border-[#0985E7] focus:ring-2 focus:ring-[#B9DDF9]"
                  />
                  <span className="text-sm font-semibold text-[#64748b]">{range.unit}</span>
                </div>
                {error ? <p id={errorId} className="mt-2 text-sm font-semibold text-[#C53030]">{error}</p> : null}
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-[#E8F0F8] pt-5">
          <button
            type="submit"
            disabled={!isDirty || hasErrors}
            className="rounded-full bg-[#0985E7] px-5 py-2.5 text-sm font-black text-white transition hover:bg-[#0770c4] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save settings
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-full border border-[#D7E4F2] bg-white px-5 py-2.5 text-sm font-black text-[#0C2B49] transition hover:border-[#0985E7] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          {isDirty && !hasErrors ? <p role="status" className="text-sm font-semibold text-[#B77900]">Unsaved changes</p> : null}
          {savedMessage ? <p role="status" className="text-sm font-semibold text-[#16834B]">Settings saved for this demo session.</p> : null}
        </div>
      </form>
    </div>
  );
}
