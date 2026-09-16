import { afterEach, describe, expect, it, vi } from "vitest";

const context = { params: Promise.resolve({ id: "invite-123" }) };

function revokeRequest(cookie?: string) {
  return new Request("https://lexchain.test/api/admin/invitations/invite-123", {
    method: "DELETE",
    headers: cookie ? { cookie } : undefined,
  });
}

afterEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("DELETE /api/admin/invitations/[id]", () => {
  it("rejects an anonymous request before the mock branch", async () => {
    vi.stubEnv("USE_MOCK_API", "true");
    vi.stubEnv("NEXT_PUBLIC_USE_MOCK_API", "true");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { DELETE } = await import("./route");

    const response = await DELETE(revokeRequest(), context);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ message: "Not authenticated." });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("denies a participant credential before the mock branch", async () => {
    vi.stubEnv("USE_MOCK_API", "true");
    vi.stubEnv("NEXT_PUBLIC_USE_MOCK_API", "true");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { DELETE } = await import("./route");

    const response = await DELETE(revokeRequest(
      "portal_token=mock-token:mock-document-participant; issuer_token=mock-token:mock-document-participant",
    ), context);

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ message: "Lawyer access required." });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("accepts only the exact mock issuer credential under the server mock flag", async () => {
    vi.stubEnv("USE_MOCK_API", "true");
    vi.stubEnv("NEXT_PUBLIC_USE_MOCK_API", "false");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { DELETE } = await import("./route");

    const response = await DELETE(revokeRequest(
      "portal_token=mock-token:mock-document-issuer; issuer_token=mock-token:mock-document-issuer",
    ), context);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      id: "invite-123",
      message: "Mock invitation revoked.",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
