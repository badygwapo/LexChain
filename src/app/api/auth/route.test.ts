import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const credentials = (email: string) => new Request("https://lexchain.test/api/auth", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ email, password: "Password123" }),
});

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("USE_MOCK_API", "true");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("unified auth session cookies", () => {
  it("issues an HttpOnly issuer credential to the canonical document issuer", async () => {
    const { POST } = await import("./route");

    const response = await POST(credentials("issuer@example.com"));

    expect(response.status).toBe(200);
    expect(response.cookies.get("portal_token")?.value).toBe("mock-token:mock-document-issuer");
    expect(response.cookies.get("issuer_token")?.value).toBe("mock-token:mock-document-issuer");
    expect(response.cookies.get("issuer_token")?.httpOnly).toBe(true);
  });

  it("keeps portal access but clears issuer and stale admin access for a participant", async () => {
    const { POST } = await import("./route");

    const response = await POST(credentials("participant@example.com"));

    expect(response.status).toBe(200);
    expect(response.cookies.get("portal_token")?.value).toBe("mock-token:mock-document-participant");
    expect(response.cookies.get("issuer_token")?.maxAge).toBe(0);
    expect(response.cookies.get("admin_token")?.maxAge).toBe(0);
  });

  it("issues an issuer credential only for the exact backend document_issuer role", async () => {
    vi.stubEnv("USE_MOCK_API", "false");
    vi.stubEnv("API_URL", "https://api.lexchain.test");
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        access_token: "issuer-token",
        user: { id: "issuer-1", email: "issuer@lexchain.test" },
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ role: "document_issuer" }), { status: 200 })));
    const { POST } = await import("./route");

    const response = await POST(credentials("issuer@lexchain.test"));

    expect(response.status).toBe(200);
    expect(response.cookies.get("issuer_token")?.value).toBe("issuer-token");
  });

  it("uses the role returned by sign-in when the profile endpoint is unavailable", async () => {
    vi.stubEnv("USE_MOCK_API", "false");
    vi.stubEnv("API_URL", "https://api.lexchain.test");
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      access_token: "issuer-token",
      user: { id: "lawyer-1", email: "lawyer@lexchain.com", role: "lawyer" },
    }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const { POST } = await import("./route");

    const response = await POST(credentials("lawyer@lexchain.com"));

    expect(response.status).toBe(200);
    expect(response.cookies.get("issuer_token")?.value).toBe("issuer-token");
    await expect(response.json()).resolves.toMatchObject({
      user: { email: "lawyer@lexchain.com", role: "lawyer" },
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["legacy user", "user"],
    ["canonical participant", "document_participant"],
    ["unknown", "staff"],
    ["missing", undefined],
    ["malformed", { value: "document_issuer" }],
  ])("does not issue issuer authority for a %s backend profile role", async (_case, role) => {
    vi.stubEnv("USE_MOCK_API", "false");
    vi.stubEnv("API_URL", "https://api.lexchain.test");
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        access_token: "portal-token",
        user: { id: "account-1", email: "account@lexchain.test" },
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ role }), { status: 200 })));
    const { POST } = await import("./route");

    const response = await POST(credentials("account@lexchain.test"));

    expect(response.status).toBe(200);
    expect(response.cookies.get("portal_token")?.value).toBe("portal-token");
    expect(response.cookies.get("issuer_token")?.maxAge).toBe(0);
  });
});
