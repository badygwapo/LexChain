// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { MockToastProvider, useMockToast } from "@/features/admin/components/mock-ui";

function ToastTrigger() {
  const { showToast } = useMockToast();
  return <button onClick={() => showToast({ title: "Saved" })}>Show toast</button>;
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

it("clears its pending toast removal when the provider unmounts", () => {
  vi.useFakeTimers();
  render(<MockToastProvider><ToastTrigger /></MockToastProvider>);

  fireEvent.click(screen.getByRole("button", { name: "Show toast" }));
  expect(vi.getTimerCount()).toBe(1);

  cleanup();
  expect(vi.getTimerCount()).toBe(0);
});
