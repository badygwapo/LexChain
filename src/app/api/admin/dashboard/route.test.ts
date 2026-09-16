import { afterEach, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

it("rejects sibling issuer cookie names before calling the dashboard backend", async () => {
  vi.stubEnv("API_URL", "https://api.lexchain.test");
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
  const { GET } = await import("./route");

  const response = await GET(new Request("https://lexchain.test/api/admin/dashboard", {
    headers: { cookie: "xissuer_token=fake" },
  }));

  expect(response.status).toBe(401);
  await expect(response.json()).resolves.toEqual({ message: "Not authenticated." });
  expect(fetchMock).not.toHaveBeenCalled();
});

it("treats a malformed issuer cookie as unauthenticated", async () => {
  vi.stubEnv("API_URL", "https://api.lexchain.test");
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  const { GET } = await import("./route");

  const response = await GET(new Request("https://lexchain.test/api/admin/dashboard", {
    headers: { cookie: "issuer_token=%" },
  }));

  expect(response.status).toBe(401);
  await expect(response.json()).resolves.toEqual({ message: "Not authenticated." });
  expect(fetchMock).not.toHaveBeenCalled();
});
