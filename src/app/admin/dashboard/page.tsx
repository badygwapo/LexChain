import { redirect } from "next/navigation";

export default function LegacyAdminDashboardPage() {
  redirect("/portal/dashboard");
}
