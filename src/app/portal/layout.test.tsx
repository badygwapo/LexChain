// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import PortalLayout from "@/features/portal/portal-layout";

const useQuery = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-query", () => ({
  useQuery,
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));
vi.mock("next/navigation", () => ({
  usePathname: () => "/portal/documents",
  useRouter: () => ({ push: vi.fn() }),
}));

afterEach(() => {
  cleanup();
  useQuery.mockReset();
});

describe("PortalLayout mobile navigation", () => {
  it("renders the role-generic bottom navigation for a Document Participant", () => {
    useQuery.mockImplementation(({ queryKey }: { queryKey: string[] }) => {
      if (queryKey[0] === "portal-profile") {
        return {
          data: {
            role: "document_participant",
            f_name: "Document",
            l_name: "Participant",
            email: "participant@example.com",
          },
          isError: false,
          isPending: false,
        };
      }
      return { data: [], isError: false, isPending: false };
    });

    render(<PortalLayout><p>Shared workspace</p></PortalLayout>);

    const mobileNavigation = screen.getByRole("navigation", { name: "Mobile portal navigation" });
    expect(within(mobileNavigation).getByRole("link", { name: "My E-copy Requests" })).toBeTruthy();
    expect(within(mobileNavigation).queryByRole("link", { name: "Processing Monitor" })).toBeNull();
    expect(within(screen.getByRole("complementary")).getByRole("link", { name: /LexChain/ }).getAttribute("href"))
      .toBe("/portal/documents");
    expect(screen.getByRole("button", { name: "Collapse sidebar" }).getAttribute("type"))
      .toBe("button");
  });

  it("renders the skeleton shell while the profile is loading", () => {
    useQuery.mockImplementation(() => ({ data: undefined, isError: false, isPending: true }));

    render(<PortalLayout><p>Shared workspace</p></PortalLayout>);

    const skeleton = screen.getByRole("status", { name: "Loading portal" });
    expect(skeleton.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
    expect(screen.queryByText("Shared workspace")).toBeNull();
  });
});
