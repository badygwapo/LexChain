import { afterEach, describe, expect, it, vi } from "vitest";

function invitationRequest(
  cookie?: string,
  body: unknown = { email: "new-issuer@example.com", role: "lawyer" },
) {
  return new Request("https://lexchain.test/api/admin/invitations", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(cookie ? { cookie } : {}),
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

afterEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("POST /api/admin/invitations", () => {
  it("rejects an anonymous request before the mock branch", async () => {
    vi.stubEnv("USE_MOCK_API", "true");
    vi.stubEnv("NEXT_PUBLIC_USE_MOCK_API", "true");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { POST } = await import("./route");

    const response = await POST(invitationRequest());

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ message: "Not authenticated." });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("denies a participant credential before the mock branch", async () => {
    vi.stubEnv("USE_MOCK_API", "true");
    vi.stubEnv("NEXT_PUBLIC_USE_MOCK_API", "true");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { POST } = await import("./route");

    const response = await POST(invitationRequest(
      "portal_token=mock-token:mock-document-participant; issuer_token=mock-token:mock-document-participant",
    ));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ message: "Lawyer access required." });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("accepts only the exact mock issuer credential under the server mock flag", async () => {
    vi.stubEnv("USE_MOCK_API", "true");
    vi.stubEnv("NEXT_PUBLIC_USE_MOCK_API", "false");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { POST } = await import("./route");

    const response = await POST(invitationRequest(
      "portal_token=mock-token:mock-document-issuer; issuer_token=mock-token:mock-document-issuer",
    ));

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ message: "Mock invitation accepted." });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects invalid JSON after authenticating the issuer", async () => {
    vi.stubEnv("USE_MOCK_API", "true");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { POST } = await import("./route");

    const response = await POST(invitationRequest(
      "issuer_token=mock-token:mock-document-issuer",
      "{",
    ));

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ["missing", { role: "lawyer" }],
    ["blank", { email: "   ", role: "lawyer" }],
    ["non-string", { email: 42, role: "lawyer" }],
    ["invalid", { email: "not-an-email", role: "lawyer" }],
  ])("rejects a %s email before the mock/backend split", async (_case, body) => {
    vi.stubEnv("USE_MOCK_API", "true");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { POST } = await import("./route");

    const response = await POST(invitationRequest(
      "issuer_token=mock-token:mock-document-issuer",
      body,
    ));

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(["admin", "user", "document_issuer", "document_participant", "arbitrary_role"])(
    "rejects a supplied noncanonical %s role",
    async (role) => {
      vi.stubEnv("USE_MOCK_API", "true");
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);
      const { POST } = await import("./route");

      const response = await POST(invitationRequest(
        "issuer_token=mock-token:mock-document-issuer",
        { email: "new-issuer@example.com", role },
      ));

      expect(response.status).toBe(400);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("forwards only the trimmed email and canonical issuer role in real mode", async () => {
    vi.stubEnv("USE_MOCK_API", "false");
    vi.stubEnv("API_URL", "https://api.lexchain.test");
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "invite-1" }), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    const { POST } = await import("./route");

    const response = await POST(invitationRequest(
      "issuer_token=real-issuer-token",
      { email: "  new-issuer@example.com  ", role: "lawyer", ignored: true },
    ));

    expect(response.status).toBe(201);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      email: "new-issuer@example.com",
      role: "lawyer",
    });
  });
});
