export type AdminUser = {
  id: string;
  email: string;
  f_name?: string;
  l_name?: string;
  role: string;
  is_active?: boolean;
  created_at: string;
};

export type DemoAdminUserChanges = Partial<
  Pick<AdminUser, "f_name" | "l_name" | "email" | "role" | "is_active">
>;

export type DirectoryUser = AdminUser & {
  displayName: string;
  initials: string;
  roleLabel: string;
  statusLabel: "Active" | "Suspended";
};
