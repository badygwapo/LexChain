import { MockResourcePage } from "@/features/admin";

export default async function AdminBlockchainRecordsPage() {
  const { adminBlockchainRecords } = await import("@/features/admin/admin-demo-data");

  return (
    <MockResourcePage resource="blockchain-records" rows={adminBlockchainRecords} />
  );
}
