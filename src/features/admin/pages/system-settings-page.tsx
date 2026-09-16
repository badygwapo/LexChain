"use client";

import { useState } from "react";
import { AdminShell } from "@/features/admin/admin-shell";
import { Dropdown } from "@/features/admin/components/dropdown";
import { PageHeader } from "@/features/admin/components/page-header";
import PersonIcon from "@mui/icons-material/Person";
import LockIcon from "@mui/icons-material/Lock";
import TuneIcon from "@mui/icons-material/Tune";
import NotificationsIcon from "@mui/icons-material/Notifications";

export default function AdminSystemSettingsPage() {
  const [displayName, setDisplayName] = useState("LexChain Admin");
  const [email, setEmail] = useState("admin@lexchain.local");
  const [timezone, setTimezone] = useState("asia-manila");
  const [digest, setDigest] = useState("daily");
  const [maxFileSize, setMaxFileSize] = useState("10mb");
  const [network, setNetwork] = useState("polygon-amoy");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  }

  return (
    <AdminShell activeHref="">
      <div className="flex h-full w-full flex-col gap-6">
        <PageHeader
          title="Settings"
          description="Manage your admin profile, account security, notifications, and platform defaults."
          action={
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center justify-center rounded-xl bg-[#0985E7] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#0770c4] focus:outline-none focus:ring-2 focus:ring-[#0985E7] focus:ring-offset-2"
            >
              Save Changes
            </button>
          }
        />

        {saved ? (
          <div className="rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-bold text-green-700">
            Settings saved.
          </div>
        ) : null}

        <section className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
          <article className="rounded-2xl border border-[#E4EEF9] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF4FB] text-[#0985E7]">
                <PersonIcon fontSize="small" />
              </span>
              <div>
                <h2 className="text-lg font-black text-[#0C2B49]">Admin Profile</h2>
                <p className="text-sm font-semibold text-[#64748b]">Name, email, and public admin identity.</p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-5 lg:flex-row">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#0985E7] text-2xl font-black text-white">
                LA
              </div>
              <div className="grid flex-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-[0.1em] text-[#64748b]">Display name</span>
                  <input
                    className="mt-2 min-h-12 w-full rounded-xl border border-[#E4EEF9] bg-[#F8FBFF] px-4 text-sm font-semibold text-[#0C2B49] outline-none focus:border-[#0985E7]"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-[0.1em] text-[#64748b]">Email</span>
                  <input
                    className="mt-2 min-h-12 w-full rounded-xl border border-[#E4EEF9] bg-[#F8FBFF] px-4 text-sm font-semibold text-[#0C2B49] outline-none focus:border-[#0985E7]"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-[0.1em] text-[#64748b]">Role</span>
                  <input
                    className="mt-2 min-h-12 w-full rounded-xl border border-[#E4EEF9] bg-[#F8FBFF] px-4 text-sm font-semibold text-[#64748b] outline-none"
                    value="Operations Administrator"
                    disabled
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-[0.1em] text-[#64748b]">Timezone</span>
                  <div className="mt-2">
                    <Dropdown
                      value={timezone}
                      onChange={setTimezone}
                      options={[
                        { label: "Asia/Manila", value: "asia-manila" },
                        { label: "UTC", value: "utc" },
                        { label: "US Pacific", value: "us-pacific" },
                      ]}
                    />
                  </div>
                </label>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-[#E4EEF9] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5f3ff] text-[#7c3aed]">
                <LockIcon fontSize="small" />
              </span>
              <div>
                <h2 className="text-lg font-black text-[#0C2B49]">Security</h2>
                <p className="text-sm font-semibold text-[#64748b]">Password and sign-in protection.</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.1em] text-[#64748b]">Current password</span>
                <input
                  className="mt-2 min-h-12 w-full rounded-xl border border-[#E4EEF9] bg-[#F8FBFF] px-4 text-sm font-semibold text-[#0C2B49] outline-none focus:border-[#0985E7]"
                  type="password"
                  placeholder="Enter current password"
                />
              </label>
              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.1em] text-[#64748b]">New password</span>
                <input
                  className="mt-2 min-h-12 w-full rounded-xl border border-[#E4EEF9] bg-[#F8FBFF] px-4 text-sm font-semibold text-[#0C2B49] outline-none focus:border-[#0985E7]"
                  type="password"
                  placeholder="Enter new password"
                />
              </label>
              <label className="flex items-center justify-between gap-4 rounded-2xl bg-[#F8FBFF] p-4">
                <span>
                  <span className="block text-sm font-black text-[#0C2B49]">Two-factor authentication</span>
                  <span className="block text-xs font-semibold text-[#64748b]">Require extra verification for admin login.</span>
                </span>
                <input
                  checked={twoFactorEnabled}
                  onChange={(event) => setTwoFactorEnabled(event.target.checked)}
                  type="checkbox"
                  className="h-5 w-5 accent-[#0985E7]"
                />
              </label>
            </div>
          </article>
        </section>

        <section className="grid gap-5 xl:grid-cols-2">
          <article className="rounded-2xl border border-[#E4EEF9] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0fdf4] text-[#16a34a]">
                <NotificationsIcon fontSize="small" />
              </span>
              <div>
                <h2 className="text-lg font-black text-[#0C2B49]">Notifications</h2>
                <p className="text-sm font-semibold text-[#64748b]">Admin report and alert preferences.</p>
              </div>
            </div>

            <div className="mt-6">
              <span className="text-xs font-black uppercase tracking-[0.1em] text-[#64748b]">Report digest</span>
              <div className="mt-2">
                <Dropdown
                  value={digest}
                  onChange={setDigest}
                  options={[
                    { label: "Daily", value: "daily" },
                    { label: "Weekly", value: "weekly" },
                    { label: "Critical only", value: "critical" },
                  ]}
                />
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-[#E4EEF9] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fefce8] text-[#ca8a04]">
                <TuneIcon fontSize="small" />
              </span>
              <div>
                <h2 className="text-lg font-black text-[#0C2B49]">Platform Defaults</h2>
                <p className="text-sm font-semibold text-[#64748b]">Upload, chain, and availability controls.</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <span className="text-xs font-black uppercase tracking-[0.1em] text-[#64748b]">Max file size</span>
                <div className="mt-2">
                  <Dropdown
                    value={maxFileSize}
                    onChange={setMaxFileSize}
                    options={[
                      { label: "10 MB", value: "10mb" },
                      { label: "25 MB", value: "25mb" },
                      { label: "50 MB", value: "50mb" },
                    ]}
                  />
                </div>
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-[0.1em] text-[#64748b]">Blockchain network</span>
                <div className="mt-2">
                  <Dropdown
                    value={network}
                    onChange={setNetwork}
                    options={[
                      { label: "Polygon Amoy", value: "polygon-amoy" },
                      { label: "Local Testnet", value: "local-testnet" },
                    ]}
                  />
                </div>
              </div>
              <label className="flex items-center justify-between gap-4 rounded-2xl bg-[#F8FBFF] p-4 sm:col-span-2">
                <span>
                  <span className="block text-sm font-black text-[#0C2B49]">Maintenance mode</span>
                  <span className="block text-xs font-semibold text-[#64748b]">Pause public verification and admin mutations.</span>
                </span>
                <input
                  checked={maintenanceMode}
                  onChange={(event) => setMaintenanceMode(event.target.checked)}
                  type="checkbox"
                  className="h-5 w-5 accent-[#0985E7]"
                />
              </label>
            </div>
          </article>
        </section>
      </div>
    </AdminShell>
  );
}
