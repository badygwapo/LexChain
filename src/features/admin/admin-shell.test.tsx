// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AdminShell } from "@/features/admin/admin-shell";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

afterEach(() => {
  cleanup();
  push.mockReset();
  vi.unstubAllGlobals();
});

it("signs out through the admin session route and returns to unified login", async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true })));
  vi.stubGlobal("fetch", fetchMock);
  render(<AdminShell><p>Admin content</p></AdminShell>);

  fireEvent.click(screen.getByRole("button", { name: "Admin profile options" }));
  fireEvent.click(screen.getByRole("button", { name: "Logout" }));

  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledWith("/api/admin/logout", { method: "POST" });
    expect(push).toHaveBeenCalledWith("/login");
  });
});
