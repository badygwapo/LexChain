import { afterEach, describe, expect, it, vi } from "vitest";

const session = vi.hoisted(() => ({
  portalToken: undefined as string | undefined,
  issuerToken: undefined as string | undefined,
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get(name: string) {
      const value = name === "portal_token" ? session.portalToken : session.issuerToken;
      return value ? { name, value } : undefined;
    },
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`REDIRECT:${path}`);
  },
}));

vi.mock("@/features/admin/server/fetch", () => ({
  adminFetch: () => Promise.reject(new Error("Mock-mode pages must not call the backend.")),
}));

afterEach(() => {
  session.portalToken = undefined;
  session.issuerToken = undefined;
  vi.resetModules();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

async function loadManagementPages() {
  const pages = await Promise.all([
    import("@/features/office/pages/users-page"),
    import("@/features/access/pages/issuer-invitations-page"),
    import("@/features/office/pages/audit-logs-page"),
  ]);

  return pages.map((page) => page.default);
}

describe("issuer management page authority", () => {
  it("loads all three server-rendered management pages for the exact mock issuer session", async () => {
    vi.stubEnv("USE_MOCK_API", "true");
    vi.stubEnv("NEXT_PUBLIC_USE_MOCK_API", "false");
    session.portalToken = "mock-token:mock-document-issuer";
    session.issuerToken = "mock-token:mock-document-issuer";

    const [usersPage, invitationsPage, auditLogsPage] = await loadManagementPages();
    const usersView = await usersPage();
    const invitationsView = await invitationsPage();
    const auditLogsView = await auditLogsPage();

    expect(usersView.props).toMatchObject({ total: 4 });
    expect(invitationsView.props).toMatchObject({ mockMode: true });
    expect(auditLogsView.props).toMatchObject({ total: 4 });
  });

  it.each([
    ["a participant token duplicated into both authority cookies", "mock-token:mock-document-participant"],
    ["an arbitrary issuer cookie", "forged-issuer-token"],
  ])("denies %s before any of the three management pages render", async (_case, issuerToken) => {
    vi.stubEnv("USE_MOCK_API", "true");
    session.portalToken = "mock-token:mock-document-participant";
    session.issuerToken = issuerToken;

    for (const Page of await loadManagementPages()) {
      await expect(Promise.resolve().then(() => Page())).rejects.toThrow("REDIRECT:/portal/dashboard");
    }
  });

  it.each([["lawyer"], ["document_issuer"]])("admits a real %s profile and renders management pages", async (role) => {
    vi.stubEnv("USE_MOCK_API", "false");
    vi.stubEnv("API_URL", "https://api.lexchain.test");
    session.portalToken = "real-token";
    session.issuerToken = "real-token";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ role }), { status: 200 })));
    const { default: UsersPage } = await import("@/features/office/pages/users-page");

    await expect(Promise.resolve().then(() => UsersPage())).resolves.not.toThrow();
  });

  it.each([
    ["document_participant"],
    ["user"],
    ["unknown"],
    [undefined],
  ])("denies a real profile role of %j before local management content renders", async (role) => {
    vi.stubEnv("USE_MOCK_API", "false");
    vi.stubEnv("API_URL", "https://api.lexchain.test");
    session.portalToken = "real-token";
    session.issuerToken = "real-token";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ role }), { status: 200 })));
    const { default: UsersPage } = await import("@/features/office/pages/users-page");

    await expect(Promise.resolve().then(() => UsersPage())).rejects.toThrow("REDIRECT:/portal/dashboard");
  });
});
