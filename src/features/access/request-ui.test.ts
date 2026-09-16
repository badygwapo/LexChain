import { expect, it } from "vitest";

import { getRequestActions, getRequestActionError } from "@/features/access/request-ui";

it("allows an issuer to decide a pending request", () => {
  expect(getRequestActions("lawyer", "pending")).toEqual(["Approve", "Reject"]);
});

it("does not show decision controls to a participant", () => {
  expect(getRequestActions("user", "pending")).toEqual([]);
});

it("does not show decision controls after a request is decided", () => {
  expect(getRequestActions("lawyer", "approved")).toEqual([]);
});

it("fails closed when a participant directly visits issuer request management", () => {
  expect(getRequestActions("user", "pending")).toEqual([]);
  expect(getRequestActions("unsupported", "pending")).toEqual([]);
});

it("provides an actionable error for a failed request decision", () => {
  expect(getRequestActionError("approve")).toBe("Unable to approve this request. Please try again.");
  expect(getRequestActionError("reject")).toBe("Unable to reject this request. Please try again.");
});
