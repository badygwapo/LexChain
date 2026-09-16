import { redirect } from "next/navigation";

export default function LegacyAdminAuditLogsPage() {
  redirect("/portal/audit-logs");
}
