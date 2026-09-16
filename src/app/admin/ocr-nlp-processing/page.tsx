import { MockResourcePage } from "@/features/admin";

export default async function AdminOcrNlpProcessingPage() {
  const { adminProcessingLogs } = await import("@/features/admin/admin-demo-data");

  return (
    <MockResourcePage resource="ocr-nlp-processing" rows={adminProcessingLogs} />
  );
}
