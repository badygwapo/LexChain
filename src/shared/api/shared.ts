import { buildApiUrl } from "@/config/api";

type ApiErrorPayload = {
  detail?: unknown;
  message?: unknown;
};

export function getApiErrorMessage(payload: ApiErrorPayload | null, fallback: string) {
  if (typeof payload?.message === "string") {
    return payload.message;
  }

  if (typeof payload?.detail === "string") {
    return payload.detail;
  }

  if (Array.isArray(payload?.detail) && payload.detail.length > 0) {
    return "The uploaded PDF could not be verified. Check the file and try again.";
  }

  return fallback;
}

export async function proxyFormDataToApi(
  apiBaseUrl: string,
  path: string,
  formData: FormData,
) {
  return fetch(buildApiUrl(apiBaseUrl, path), {
    method: "POST",
    body: formData,
  });
}
