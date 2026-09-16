import { AdminShell } from "@/features/admin";
import { RolesPermissionsView } from "@/features/admin/roles-permissions";

export default function AdminRolesPermissionsPage() {
  return (
    <AdminShell activeHref="/admin/roles-permissions">
      <RolesPermissionsView />
    </AdminShell>
  );
}
