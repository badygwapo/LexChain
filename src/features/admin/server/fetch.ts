import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { backendUrl } from "@/server/api/backend";

export async function adminFetch<T>(path: string, opts?: { revalidate?: number }): Promise<T> {
  const cookieStore = await cookies();
  const token = cookieStore.get("issuer_token")?.value;
  if (!token) redirect("/admin/login");

  const res = await fetch(backendUrl(path), {
    headers: {
      Authorization: `Bearer ${token}`,
      "ngrok-skip-browser-warning": "true",
    },
    next: { revalidate: opts?.revalidate ?? 60 },
  });

  if (res.status === 401) redirect("/admin/login");
  if (!res.ok) throw new Error(`API ${path} unavailable.`);

  return res.json();
}
