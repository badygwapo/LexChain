import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { backendUrl } from "@/server/api/backend";
import { isMockDocumentIssuerToken } from "@/lib/mocks/portal";
import { isMockMode } from "@/lib/mocks/mode";

export async function requireDocumentIssuerPage() {
  const cookieStore = await cookies();
  const portalToken = cookieStore.get("portal_token")?.value;
  const issuerToken = cookieStore.get("issuer_token")?.value;

  if (!portalToken) redirect("/login");
  if (!issuerToken || portalToken !== issuerToken) redirect("/portal/dashboard");

  if (isMockMode()) {
    if (!isMockDocumentIssuerToken(portalToken)) redirect("/portal/dashboard");
    return;
  }

  const apiBase = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
  if (!apiBase) redirect("/portal/dashboard");

  const response = await fetch(backendUrl("/users/"), {
    headers: {
      Authorization: `Bearer ${issuerToken}`,
      "ngrok-skip-browser-warning": "true",
    },
    cache: "no-store",
  }).catch(() => null);
  if (!response?.ok) redirect("/portal/dashboard");

  const profile = await response.json().catch(() => null);
  const role = profile?.role?.trim().toLowerCase();
  if (!role || !["lawyer", "document_issuer", "admin", "super_admin"].includes(role)) redirect("/portal/dashboard");
}
