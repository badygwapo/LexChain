import { adminFetch } from "@/features/admin/server";
import { UsersManagementView } from "@/features/admin/users";
import { requireDocumentIssuerPage } from "@/features/access/server";
import { isMockMode } from "@/lib/mocks/mode";

const useMock = isMockMode();

type AdminUser = {
  id: string;
  email: string;
  f_name?: string;
  l_name?: string;
  role: string;
  is_active?: boolean;
  created_at: string;
};

type UsersData = { users: AdminUser[]; total: number };

async function getUsers(): Promise<UsersData> {
  if (useMock) {
    const { adminUsers } = await import("@/features/admin/admin-demo-data");
    return {
      users: adminUsers.map((user) => ({
        id: user.id,
        f_name: user.name.split(" ")[0] ?? "",
        l_name: user.name.split(" ").slice(1).join(" "),
        email: user.email,
        role: user.role,
        is_active: user.status === "active",
        created_at: user.created_at,
      })),
      total: adminUsers.length,
    };
  }

  try {
    return await adminFetch<UsersData>("/admin/users");
  } catch {
    return { users: [], total: 0 };
  }
}

export default async function PortalUsersPage() {
  await requireDocumentIssuerPage();
  const data = await getUsers();

  return <UsersManagementView users={data.users} total={data.total} />;
}
