import GroupsIcon from "@mui/icons-material/Groups";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WorkIcon from "@mui/icons-material/Work";
import PersonOffIcon from "@mui/icons-material/PersonOff";
import type { DirectoryUser } from "./users-types";

function cn(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function UserMetricCard({
  icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  detail: string;
  tone: "blue" | "green" | "purple" | "orange" | "red" | "cyan";
}) {
  const tones = {
    blue: "bg-[#EAF3FF] text-[#0879D8]",
    green: "bg-[#EAFBF1] text-[#16A34A]",
    purple: "bg-[#F4ECFF] text-[#7C3AED]",
    orange: "bg-[#FFF4DF] text-[#F59E0B]",
    red: "bg-[#FEECEC] text-[#EF4444]",
    cyan: "bg-[#E6FAFF] text-[#06B6D4]",
  };

  return (
    <article className="flex min-h-[112px] items-center gap-3 rounded-2xl border border-[#E4EEF9] bg-white p-4 shadow-sm shadow-[#DDEAF7]/40 transition hover:-translate-y-0.5 hover:border-[#C7DBEF]">
      <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-full", tones[tone])}>{icon}</div>
      <div className="min-w-0">
        <p className="truncate text-xs font-black text-[#0C2B49]">{label}</p>
        <p className="mt-1 text-2xl font-black leading-none text-[#071B33]">{value.toLocaleString()}</p>
        <p className="mt-2 truncate text-xs font-semibold text-[#5B6F8A]">{detail}</p>
      </div>
    </article>
  );
}

export function StatusPill({ status }: { status: DirectoryUser["statusLabel"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-black",
        status === "Active" && "bg-[#EAFBF1] text-[#16A34A]",
        status === "Suspended" && "bg-[#FEECEC] text-[#DC2626]",
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

export function RoleDistribution({ users }: { users: DirectoryUser[] }) {
  const colors = ["#0879D8", "#59C878", "#9B6AF3", "#F6B52E", "#22C7D8"];
  const groups = [...new Set(users.map((user) => user.roleLabel))].map((label, index) => ({
    label,
    color: colors[index % colors.length],
  }));
  const total = Math.max(1, users.length);
  let cursor = 0;
  const gradient = groups
    .map((group) => {
      const count = users.filter((user) => user.roleLabel === group.label).length;
      const start = cursor;
      cursor += (count / total) * 100;
      return `${group.color} ${start}% ${cursor}%`;
    })
    .join(", ");

  return (
    <article className="flex h-fit self-start flex-col rounded-2xl border border-[#E4EEF9] bg-white p-3 shadow-sm shadow-[#DDEAF7]/35">
      <h2 className="mb-2 text-lg font-black text-[#071B33]">Role Distribution</h2>
      <div className="grid items-center gap-5 sm:grid-cols-[160px_1fr] xl:grid-cols-1 2xl:grid-cols-[160px_1fr]">
        <div className="relative mx-auto size-36 rounded-full" style={{ background: `conic-gradient(${gradient})` }}>
          <div className="absolute inset-6 flex flex-col items-center justify-center rounded-full bg-white text-center">
            <strong className="text-2xl font-black text-[#071B33]">{total}</strong>
            <span className="text-xs font-semibold text-[#6B7E95]">Total Users</span>
          </div>
        </div>
        <div className="space-y-3">
          {groups.map((group) => {
            const count = users.filter((user) => user.roleLabel === group.label).length;
            return (
              <div key={group.label} className="flex items-center gap-3 text-sm">
                <span className="size-2.5 rounded-full" style={{ backgroundColor: group.color }} />
                <span className="min-w-0 flex-1 font-semibold text-[#5B6F8A]">{group.label}</span>
                <strong className="font-black text-[#071B33]">{count}</strong>
                <span className="text-xs font-semibold text-[#5B6F8A]">({Math.round((count / total) * 100)}%)</span>
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}

export function RecentlyCreatedAccounts({ users }: { users: DirectoryUser[] }) {
  const recentUsers = [...users]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <article className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[#E4EEF9] bg-white p-3 shadow-sm shadow-[#DDEAF7]/35">
      <div className="mb-2 flex shrink-0 items-center justify-between">
        <h2 className="text-lg font-black text-[#071B33]">Recently Created Accounts</h2>
        <span className="text-xs font-black text-[#5B6F8A]">{recentUsers.length} latest</span>
      </div>
      <div className="admin-table-scroll scrollbar-hide min-h-0 max-h-64 space-y-3 overflow-y-auto pr-1 xl:max-h-none xl:flex-1">
        {recentUsers.map((user, index) => (
          <div key={user.id} className="grid grid-cols-[40px_1fr_auto] items-center gap-3 rounded-xl p-1.5 transition hover:bg-[#F8FBFF]">
            <div className={cn("flex size-10 items-center justify-center rounded-xl text-xs font-black", index % 3 === 0 ? "bg-[#EAF3FF] text-[#0879D8]" : index % 3 === 1 ? "bg-[#F4ECFF] text-[#7C3AED]" : "bg-[#FFF4DF] text-[#D97706]")}>
              {user.initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-[#071B33]">{user.displayName}</p>
              <p className="truncate text-xs font-semibold text-[#5B6F8A]">{user.email}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-[#EEF4FB] px-2 py-0.5 text-[10px] font-black text-[#0879D8]">{user.roleLabel}</span>
                <StatusPill status={user.statusLabel} />
              </div>
            </div>
            <p className="text-right text-xs font-bold text-[#4B6382]">{new Date(user.created_at).toLocaleDateString()}</p>
          </div>
        ))}
        {recentUsers.length === 0 ? (
          <p className="text-sm font-semibold text-[#5B6F8A]">No accounts returned by the API.</p>
        ) : null}
      </div>
    </article>
  );
}

export function UsersMetrics({ users: directoryUsers, total }: { users: DirectoryUser[]; total: number }) {
  const metrics = [
    { label: "Total Users", value: total || directoryUsers.length, detail: "Registered accounts", icon: <GroupsIcon fontSize="small" />, tone: "blue" as const },
    { label: "Active Users", value: directoryUsers.filter((user) => user.statusLabel === "Active").length, detail: "is_active true", icon: <CheckCircleIcon fontSize="small" />, tone: "green" as const },
    { label: "Suspended Users", value: directoryUsers.filter((user) => user.statusLabel === "Suspended").length, detail: "is_active false", icon: <PersonOffIcon fontSize="small" />, tone: "red" as const },
    { label: "Lawyers", value: directoryUsers.filter((user) => user.roleLabel === "Document Issuer").length, detail: "role field", icon: <WorkIcon fontSize="small" />, tone: "blue" as const },
  ];

  return (
    <section className="grid shrink-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => <UserMetricCard key={metric.label} {...metric} />)}
    </section>
  );
}
