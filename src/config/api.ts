export function trimTrailingSlash(value: string) {
  return value.trim().replace(/\/$/, "");
}

export function getApiBaseUrl(env: Record<string, string | undefined>) {
  return trimTrailingSlash(env.API_URL ?? env.NEXT_PUBLIC_API_URL ?? "");
}

export function requireApiBaseUrl(env: Record<string, string | undefined>) {
  const apiBaseUrl = getApiBaseUrl(env);

  if (!apiBaseUrl) {
    throw new Error("Missing API_URL or NEXT_PUBLIC_API_URL.");
  }

  return apiBaseUrl;
}

export function buildApiUrl(apiBaseUrl: string, path: string) {
  return `${trimTrailingSlash(apiBaseUrl)}${path.startsWith("/") ? path : `/${path}`}`;
}
