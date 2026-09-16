import { MockResourcePage } from "@/features/admin";

export default async function AdminAnalyticsPage() {
  const { adminAnalytics } = await import("@/features/admin/admin-demo-data");

  return (
    <MockResourcePage resource="analytics" rows={adminAnalytics} />
  );
}
