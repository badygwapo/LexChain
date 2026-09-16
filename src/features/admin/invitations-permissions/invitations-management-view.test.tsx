// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { MockToastProvider } from "@/features/admin/components/mock-ui";
import { InvitationsManagementView } from "@/features/admin/invitations-permissions/invitations-management-view";

afterEach(cleanup);

const invitation = {
  status: "pending",
  expires_at: "2026-08-01T00:00:00Z",
  created_at: "2026-07-01T00:00:00Z",
};

function rowFor(email: string) {
  return within(screen.getByRole("row", { name: new RegExp(email) }));
}

it("maps canonical and backend invitation roles while marking unknown values unsupported", () => {
  render(
    <MockToastProvider>
      <InvitationsManagementView
        mockMode
        invitations={[
          { ...invitation, id: "issuer", email: "issuer@example.com", role: "lawyer" },
          { ...invitation, id: "participant", email: "participant@example.com", role: "user" },
          { ...invitation, id: "legacy-user", email: "legacy-user@example.com", role: "user" },
          { ...invitation, id: "legacy-admin", email: "legacy-admin@example.com", role: "admin" },
          { ...invitation, id: "unknown", email: "unknown@example.com", role: "unexpected" },
        ]}
      />
    </MockToastProvider>,
  );

  expect(rowFor("issuer@example.com").getByText("Lawyer")).toBeTruthy();
  expect(rowFor("participant@example.com").getByText("User")).toBeTruthy();
  expect(rowFor("legacy-user@example.com").getByText("User")).toBeTruthy();
  expect(rowFor("legacy-admin@example.com").getByText("Lawyer")).toBeTruthy();
  expect(rowFor("unknown@example.com").getByText("Unsupported role")).toBeTruthy();
});

it("matches the portal management layout without duplicate header controls", () => {
  render(
    <MockToastProvider>
      <InvitationsManagementView mockMode invitations={[]} />
    </MockToastProvider>,
  );

  const view = screen.getByRole("heading", { name: "Issuer Invitations" }).closest("header")?.parentElement;
  const directory = screen.getByRole("heading", { name: "Invitation Directory" }).closest("article");
  const activityList = screen.getByRole("heading", { name: "Recent Invitation Activity" }).closest("article")?.querySelector(".admin-table-scroll");

  expect(view?.className).toContain("xl:h-[calc(100dvh-113px)]");
  expect(view?.className).toContain("xl:min-h-0");
  expect(directory?.parentElement?.className).toContain("xl:flex-1");
  expect(directory?.className).toContain("xl:h-full");
  expect(activityList?.className).toContain("xl:flex-1");
  expect(screen.getByPlaceholderText("Search invitations...")).toBeTruthy();
  expect(screen.queryByPlaceholderText("Search by email or role...")).toBeNull();
  expect(screen.queryByRole("button", { name: "Filter" })).toBeNull();
  expect(screen.queryByText("More Filters")).toBeNull();
});
