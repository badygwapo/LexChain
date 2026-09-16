import { MockResourcePage } from "@/features/admin";

export default async function AdminCategoriesPage() {
  const { adminCategories } = await import("@/features/admin/admin-demo-data");

  return (
    <MockResourcePage resource="categories" rows={adminCategories} />
  );
}
