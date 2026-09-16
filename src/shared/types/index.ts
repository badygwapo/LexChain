import type { components } from "./generated/schema";

export type { components, operations, paths, webhooks } from "./generated/schema";

export type ApiSchema<Name extends keyof components["schemas"]> =
  components["schemas"][Name];

export type AdminDashboardResponse = ApiSchema<"AdminDashboardResponse">;
export type AdminUserResponse = ApiSchema<"AdminUserResponse">;
export type AdminUserListResponse = ApiSchema<"AdminUserListResponse">;
export type CreateInvitationRequest = ApiSchema<"CreateInvitationRequest">;
