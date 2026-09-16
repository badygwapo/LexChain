// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AuditLogsManagementView } from "./audit-logs-management-view";
import { Toaster } from "sonner";

const logs = Array.from({ length: 25 }, (_, index) => ({
  id: `event-${index}`,
  user_id: "user-1",
  action: index === 0 ? "Uploaded document" : "Viewed document",
  target_type: "document",
  target_id: `doc-${index}`,
  details: null,
  ip_address: "127.0.0.1",
  user_agent: null,
  created_at: `2026-01-${String(index + 1).padStart(2, "0")}T12:00:00Z`,
}));

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it("coordinates trail filters, dropdowns, outside taps, and focus dismissal", () => {
  render(<AuditLogsManagementView logs={logs} total={25} />);
  fireEvent.click(screen.getByRole("button", { name: "More Filters" }));
  expect(screen.getByRole("region", { name: "Audit filters" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Target Type" }));
  expect(screen.queryByRole("region", { name: "Audit filters" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "More Filters" }));
  expect(screen.queryByRole("button", { name: "document" })).toBeNull();
  fireEvent.pointerDown(document.body);
  expect(screen.queryByRole("region", { name: "Audit filters" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "More Filters" }));
  fireEvent.focusIn(screen.getByLabelText("Search audit trail"));
  expect(screen.queryByRole("region", { name: "Audit filters" })).toBeNull();
});

it("searches the audit trail and resets pagination when filters change", () => {
  render(<AuditLogsManagementView logs={logs} total={25} />);
  fireEvent.click(screen.getByRole("button", { name: "Next page" }));
  fireEvent.change(screen.getByPlaceholderText("Search audit trail..."), { target: { value: "user-1" } });
  expect(screen.getByRole("button", { name: "View audit event event-0" })).toBeTruthy();
  fireEvent.change(screen.getByPlaceholderText("Search audit trail..."), { target: { value: "Uploaded" } });
  expect(screen.getByRole("button", { name: "View audit event event-0" })).toBeTruthy();
  expect(screen.getAllByRole("row")).toHaveLength(2);
});

it("keeps audit controls in the trail card without duplicate header controls", () => {
  render(<AuditLogsManagementView logs={logs} total={25} />);

  expect(screen.queryByPlaceholderText("Search logs by user, action, document, or IP...")).toBeNull();
  expect(screen.queryByRole("button", { name: "Filter" })).toBeNull();
  expect(screen.getByPlaceholderText("Search audit trail...")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Export" })).toBeTruthy();

  const heading = screen.getByRole("heading", { name: "Audit Logs", level: 1 });
  const view = heading.closest("header")?.parentElement;
  const card = screen.getByRole("heading", { name: "Audit Trail" }).closest("article");

  expect(view?.className).toContain("xl:h-[calc(100dvh-113px)]");
  expect(card?.className).toContain("h-fit");
  expect(card?.className).toContain("xl:h-full");
});

it("reveals inclusive date filters and resets them", () => {
  render(<AuditLogsManagementView logs={logs} total={25} />);
  fireEvent.click(screen.getByRole("button", { name: "More Filters" }));
  fireEvent.change(screen.getByLabelText("From date"), { target: { value: "2026-01-02" } });
  fireEvent.change(screen.getByLabelText("To date"), { target: { value: "2026-01-03" } });
  expect(screen.getAllByRole("row")).toHaveLength(3);
  expect(screen.getByRole("button", { name: "View audit event event-1" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "View audit event event-2" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Reset filters" }));
  expect(screen.getAllByRole("row")).toHaveLength(11);
});

it("opens an accessible filter panel and dismisses it with Escape", () => {
  render(<AuditLogsManagementView logs={logs} total={25} />);
  fireEvent.click(screen.getByRole("button", { name: "More Filters" }));
  const panel = screen.getByRole("region", { name: "Audit filters" });
  expect(screen.getByRole("button", { name: "More Filters" }).getAttribute("aria-expanded")).toBe("true");
  fireEvent.keyDown(panel, { key: "Escape" });
  expect(screen.queryByRole("region", { name: "Audit filters" })).toBeNull();
  expect(screen.getByRole("button", { name: "More Filters" }).getAttribute("aria-expanded")).toBe("false");
});

it("copies only the event ID instead of downloading an export", async () => {
  let copied = "";
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async (text: string) => { copied = text; } } });
  render(<AuditLogsManagementView logs={logs} total={25} />);
  fireEvent.click(screen.getByRole("button", { name: "More actions for audit event event-0" }));
  fireEvent.click(screen.getByRole("button", { name: "Copy event ID" }));
  await waitFor(() => expect(copied).toBe("event-0"));
});

it("reports clipboard failures without an unhandled rejection", async () => {
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async () => { throw new Error("Permission denied"); } } });
  render(<><Toaster /><AuditLogsManagementView logs={logs} total={25} /></>);
  fireEvent.click(screen.getByRole("button", { name: "More actions for audit event event-0" }));
  fireEvent.click(screen.getByRole("button", { name: "Copy event ID" }));
  expect(await screen.findByText("Could not copy event ID")).toBeTruthy();
});

it("shows an empty state for a search with no matching event", () => {
  render(<AuditLogsManagementView logs={logs} total={25} />);
  fireEvent.change(screen.getByPlaceholderText("Search audit trail..."), { target: { value: "missing-event" } });
  expect(screen.getByText("No audit events match the current filters.")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Next page" }).hasAttribute("disabled")).toBe(true);
});
