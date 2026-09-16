import { MockResourcePage } from "@/features/admin";

export default async function AdminVerificationLogsPage() {
  const { adminVerificationLogs } = await import("@/features/admin/admin-demo-data");

  return (
    <MockResourcePage resource="verification-logs" rows={adminVerificationLogs} />
  );
}
