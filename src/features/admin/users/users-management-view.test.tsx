// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MockToastProvider } from "@/features/admin/components/mock-ui";
import { AdminShell } from "@/features/admin/admin-shell";
import { updateDemoUser, UsersManagementView } from "@/features/admin/users/users-management-view";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const users = [
  {
    id: "admin-1",
    f_name: "LexChain",
    l_name: "Issuer",
    email: "admin@lexchain.local",
    role: "document_issuer",
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "user-1",
    f_name: "Maria",
    l_name: "Santos",
    email: "maria@example.com",
    role: "document_issuer",
    is_active: true,
    created_at: "2026-01-02T00:00:00Z",
  },
  {
    id: "user-2",
    f_name: "Juan",
    l_name: "Cruz",
    email: "juan@example.com",
    role: "document_participant",
    is_active: false,
    created_at: "2026-01-03T00:00:00Z",
  },
];

function renderUsers() {
  return renderUserList(users);
}

function renderUserList(userRows: typeof users) {
  return render(
    <MockToastProvider>
      <UsersManagementView users={userRows} total={userRows.length} />
    </MockToastProvider>,
  );
}

function rowFor(email: string) {
  return screen.getByRole("row", { name: new RegExp(email) });
}

afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("updateDemoUser", () => {
  it("changes only the matching row and preserves omitted fields", () => {
    const result = updateDemoUser(users, "user-1", { f_name: "Mariel", role: "user" });

    expect(result[1]).toEqual({ ...users[1], f_name: "Mariel", role: "user" });
    expect(result[0]).toBe(users[0]);
    expect(result[2]).toBe(users[2]);
    expect(result[1].email).toBe("maria@example.com");
  });

  it("leaves every row unchanged for an unknown id", () => {
    const result = updateDemoUser(users, "missing", { is_active: false });

    expect(result).toEqual(users);
    expect(result.every((user, index) => user === users[index])).toBe(true);
  });

  it("does not mutate the input array or matching row", () => {
    const before = structuredClone(users);

    updateDemoUser(users, "user-1", { email: "updated@example.com" });

    expect(users).toEqual(before);
  });
});

describe("UsersManagementView demo mutations", () => {
  it("dismisses sibling popups while keeping nested filters usable", () => {
    renderUsers();
    const more = screen.getByText("More Filters");
    fireEvent.click(more);
    fireEvent.click(screen.getByRole("button", { name: "All Roles" }));
    fireEvent.click(screen.getByRole("button", { name: "All Statuses" }));
    expect(screen.queryByRole("button", { name: "Document Issuer" })).toBeNull();
    expect(screen.getByRole("button", { name: "Suspended" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Active" }));
    expect(more.closest("details")?.open).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Newest first" }));
    expect(more.closest("details")?.open).toBe(false);
    fireEvent.click(more);
    expect(screen.queryByRole("button", { name: "Oldest first" })).toBeNull();
    fireEvent.pointerDown(document.body, { pointerType: "touch" });
    expect(more.closest("details")?.open).toBe(false);
    fireEvent.click(more);
    fireEvent.keyDown(more, { key: "Escape" });
    expect(more.closest("details")?.open).toBe(false);
    expect(document.activeElement).toBe(more);
  });

  it("filters inclusive creation dates, sorts results, and resets filters", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-01-15T12:00:00"));
    renderUsers();
    expect(screen.queryByText("Sort by")).toBeNull();
    expect(screen.getByRole("button", { name: "Newest first" })).toBeTruthy();
    expect(screen.getAllByRole("row")[1].textContent).toContain("juan@example.com");
    fireEvent.click(screen.getByText("More Filters"));
    fireEvent.click(screen.getAllByRole("button", { name: "Choose date" })[0]);
    fireEvent.click(screen.getByRole("gridcell", { name: "2" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    fireEvent.click(screen.getByRole("button", { name: "Choose date" }));
    fireEvent.click(screen.getByRole("gridcell", { name: "3" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(screen.queryByRole("row", { name: /admin@lexchain.local/ })).toBeNull();
    expect(rowFor("maria@example.com")).toBeTruthy();
    expect(screen.getAllByRole("row")[1].textContent).toContain("juan@example.com");
    fireEvent.click(screen.getByRole("button", { name: "Newest first" }));
    fireEvent.click(screen.getByRole("button", { name: "Name Z–A" }));
    expect(screen.getAllByRole("row")[1].textContent).toContain("maria@example.com");
    fireEvent.click(screen.getByText(/More Filters/));
    fireEvent.click(screen.getByRole("button", { name: "Reset filters" }));
    expect(screen.getAllByRole("row")).toHaveLength(users.length + 1);
    expect(screen.getByRole("button", { name: "Newest first" })).toBeTruthy();
    expect(screen.getAllByRole("row")[1].textContent).toContain("juan@example.com");
  });

  it("keeps directory search while removing duplicate header controls and export", () => {
    renderUsers();
    expect(screen.queryByPlaceholderText("Search users by name or email...")).toBeNull();
    expect(screen.queryByRole("button", { name: "Filter" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Export" })).toBeNull();
    expect(screen.getByRole("link", { name: "Invite User" })).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText("Search users..."), { target: { value: "maria@example.com" } });
    expect(rowFor("maria@example.com")).toBeTruthy();
    expect(screen.queryByRole("row", { name: /juan@example.com/ })).toBeNull();
  });

  it("fills the remaining dynamic viewport height on desktop", () => {
    renderUsers();

    const header = screen.getByRole("heading", { name: "Users", level: 1 }).closest("header");
    const view = header?.parentElement;
    const directorySection = screen.getByRole("heading", { name: "User Directory" }).closest("article")?.parentElement;

    expect(view?.className).toContain("xl:h-[calc(100dvh-113px)]");
    expect(directorySection?.className).toContain("xl:flex-1");
  });

  it("stacks the sidebar cards without stretching or excess padding", () => {
    renderUsers();

    const roleCard = screen.getByRole("heading", { name: "Role Distribution" }).closest("article");
    const recentHeading = screen.getByRole("heading", { name: "Recently Created Accounts" });
    const recentCard = recentHeading.closest("article");
    const sidebar = roleCard?.parentElement;

    expect(sidebar?.className).toContain("content-start");
    expect(sidebar?.className).toContain("xl:h-full");
    expect(sidebar?.className).toContain("xl:grid-rows-[auto_minmax(0,1fr)]");
    expect(recentCard?.parentElement).toBe(sidebar);
    expect(recentCard?.className).toContain("p-3");
    expect(recentCard?.className).toContain("min-h-0");
    expect(recentHeading.parentElement?.className).toContain("mb-2");
  });

  it("fills the directory row on desktop while sizing to content on mobile", () => {
    renderUsers();

    const heading = screen.getByRole("heading", { name: "User Directory" });
    const card = heading.closest("article");

    expect(card?.className).toContain("h-fit");
    expect(card?.className).toContain("xl:h-full");
  });

  it("sizes the Role Distribution card to its content", () => {
    renderUsers();

    const heading = screen.getByRole("heading", { name: "Role Distribution" });
    const card = heading.closest("article");
    const content = card?.querySelector(":scope > div");

    expect(card?.className).toContain("h-fit");
    expect(card?.className).toContain("self-start");
    expect(card?.className).toContain("p-3");
    expect(heading.className).toContain("mb-2");
    expect(content?.className).not.toContain("flex-1");
  });

  it("keeps recent accounts scrollable within the available card height", () => {
    const userRows = [
      ...users,
      { ...users[0], id: "user-3", email: "user3@example.com", created_at: "2026-01-04T00:00:00Z" },
      { ...users[0], id: "user-4", email: "user4@example.com", created_at: "2026-01-05T00:00:00Z" },
      { ...users[0], id: "user-5", email: "user5@example.com", created_at: "2026-01-06T00:00:00Z" },
    ];

    renderUserList(userRows);

    const heading = screen.getByRole("heading", { name: "Recently Created Accounts" });
    const list = heading.closest("article")?.querySelector(".admin-table-scroll");

    expect(list?.className).toContain("max-h-64");
    expect(list?.className).toContain("overflow-y-auto");
    expect(list?.className).toContain("xl:max-h-none");
    expect(list?.className).toContain("xl:flex-1");
    expect(list?.children).toHaveLength(userRows.length);
  });

  it("maps canonical and backend account roles while marking unknown values unsupported", () => {
    renderUserList([
      users[1],
      users[2],
      { ...users[0], id: "legacy-user", email: "legacy-user@example.com", role: "user" },
      { ...users[0], id: "legacy-admin", email: "legacy-admin@example.com", role: "admin" },
      { ...users[0], id: "unknown", email: "unknown@example.com", role: "unexpected" },
    ]);

    expect(within(rowFor("maria@example.com")).getByText("Lawyer")).toBeTruthy();
    expect(within(rowFor("juan@example.com")).getByText("User")).toBeTruthy();
    expect(within(rowFor("legacy-user@example.com")).getByText("User")).toBeTruthy();
    expect(within(rowFor("legacy-admin@example.com")).getByText("Lawyer")).toBeTruthy();
    expect(within(rowFor("unknown@example.com")).getByText("Unsupported role")).toBeTruthy();
  });

  it("does not expose legacy role navigation from user management", () => {
    renderUsers();

    expect(screen.queryByRole("link", { name: "Manage roles" })).toBeNull();
  });

  it("pre-fills the edit form with the selected user's current values", () => {
    renderUsers();

    fireEvent.click(within(rowFor("maria@example.com")).getByRole("button", { name: "Edit Maria Santos" }));

    expect((screen.getByLabelText("First name") as HTMLInputElement).value).toBe("Maria");
    expect((screen.getByLabelText("Last name") as HTMLInputElement).value).toBe("Santos");
    expect((screen.getByLabelText("Email") as HTMLInputElement).value).toBe("maria@example.com");
    const role = screen.getByLabelText("Role") as HTMLSelectElement;
    expect(role.value).toBe("lawyer");
    expect([...role.options].map((option) => [option.value, option.text])).toEqual([
      ["lawyer", "Lawyer"],
      ["user", "User"],
    ]);
    expect(screen.getByText("Demo mode — changes reset when this page is refreshed.")).toBeTruthy();
  });

  it("saves edits in the visible row for the current page session", () => {
    renderUsers();
    fireEvent.click(within(rowFor("maria@example.com")).getByRole("button", { name: "Edit Maria Santos" }));

    fireEvent.change(screen.getByLabelText("First name"), { target: { value: "Mariel" } });
    fireEvent.change(screen.getByLabelText("Role"), { target: { value: "user" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    const updatedRow = rowFor("maria@example.com");
    expect(within(updatedRow).getByText("Mariel Santos")).toBeTruthy();
    expect(within(updatedRow).getByText("User")).toBeTruthy();
    expect(screen.getByText("Demo account updated")).toBeTruthy();
    expect(screen.queryByText(["Backend endpoint", "needed"].join(" "))).toBeNull();
  });

  it("cancels edits without changing the visible row", () => {
    renderUsers();
    fireEvent.click(within(rowFor("maria@example.com")).getByRole("button", { name: "Edit Maria Santos" }));

    fireEvent.change(screen.getByLabelText("First name"), { target: { value: "Changed" } });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(within(rowFor("maria@example.com")).getByText("Maria Santos")).toBeTruthy();
    expect(screen.queryByText("Changed Santos")).toBeNull();
  });

  it("starts a fresh draft when an edit dialog is reopened", () => {
    renderUsers();
    const edit = within(rowFor("maria@example.com")).getByRole("button", { name: "Edit Maria Santos" });
    fireEvent.click(edit);
    fireEvent.change(screen.getByLabelText("First name"), { target: { value: "Discarded" } });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    fireEvent.click(edit);

    expect((screen.getByLabelText("First name") as HTMLInputElement).value).toBe("Maria");
  });

  it("suspends an active account in demo mode", () => {
    renderUsers();
    fireEvent.click(within(rowFor("maria@example.com")).getByRole("button", { name: "More actions for Maria Santos" }));
    fireEvent.click(screen.getByRole("button", { name: "Suspend user" }));

    expect(screen.getByText("Demo mode — changes reset when this page is refreshed.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Suspend" }));

    expect(within(rowFor("maria@example.com")).getByText("Suspended")).toBeTruthy();
  });

  it("reactivates a suspended account in demo mode", () => {
    renderUsers();
    fireEvent.click(within(rowFor("juan@example.com")).getByRole("button", { name: "More actions for Juan Cruz" }));
    fireEvent.click(screen.getByRole("button", { name: "Reactivate user" }));

    expect(screen.getByText("Demo mode — changes reset when this page is refreshed.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Reactivate" }));

    expect(within(rowFor("juan@example.com")).getByText("Active")).toBeTruthy();
  });

  it("does not allow the displayed current account to be suspended", () => {
    renderUsers();
    fireEvent.click(within(rowFor("admin@lexchain.local")).getByRole("button", { name: "More actions for LexChain Issuer" }));

    const guard = screen.getByRole("button", { name: "Current account cannot be suspended" }) as HTMLButtonElement;
    expect(guard.disabled).toBe(true);
  });
});

it("removes the redundant Roles & Permissions admin navigation", () => {
  render(<AdminShell><p>Admin content</p></AdminShell>);

  expect(screen.queryByRole("link", { name: "Roles & Permissions" })).toBeNull();
});
