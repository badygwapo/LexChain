export async function portalFetch<T>(path: string): Promise<T> {
  // Client-side: pass credentials so cookies are sent
  const res = await fetch(`/api/portal/proxy?path=${encodeURIComponent(path)}`, {
    credentials: 'same-origin',
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
