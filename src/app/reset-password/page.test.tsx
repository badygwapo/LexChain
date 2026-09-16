// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ResetPasswordPage from "@/features/auth/pages/reset-password-page";

beforeEach(() => vi.stubEnv("NEXT_PUBLIC_USE_MOCK_API", "true"));

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

function renderResetPage(token?: string) {
  window.history.replaceState({}, "", token ? `/reset-password?token=${token}` : "/reset-password");
  return render(<ResetPasswordPage />);
}

describe("ResetPasswordPage", () => {
  it.each([undefined, "incorrect-token"])("shows an invalid-link state for token %s", async (token) => {
    renderResetPage(token);

    expect(await screen.findByText("This password reset link is invalid or has expired.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Back to sign in" }).getAttribute("href")).toBe("/login");
  });

  it.each([undefined, "incorrect-token"])("keeps invalid token %s invalid outside mock mode", async (token) => {
    vi.stubEnv("NEXT_PUBLIC_USE_MOCK_API", "false");
    renderResetPage(token);

    expect(await screen.findByText("This password reset link is invalid or has expired.")).toBeTruthy();
    expect(screen.queryByText(
      "Password recovery is not connected yet. The backend password-recovery endpoints are required before this can send a real email.",
    )).toBeNull();
  });

  it("does not offer demo completion for a valid token outside mock mode", async () => {
    vi.stubEnv("NEXT_PUBLIC_USE_MOCK_API", "false");
    renderResetPage("lexchain-web-demo-reset");

    expect(await screen.findByText(
      "Password recovery is not connected yet. The backend password-recovery endpoints are required before this can send a real email.",
    )).toBeTruthy();
    expect(screen.queryByLabelText("New password")).toBeNull();
    expect(screen.queryByText("Demo complete — no real password was changed.")).toBeNull();
  });

  it("keeps weak passwords on the form", async () => {
    renderResetPage("lexchain-web-demo-reset");

    fireEvent.change(await screen.findByLabelText("New password"), { target: { value: "weak" } });
    fireEvent.change(screen.getByLabelText("Confirm new password"), { target: { value: "weak" } });
    fireEvent.click(screen.getByRole("button", { name: "Reset password" }));

    expect(await screen.findByText("Use at least 8 characters.")).toBeTruthy();
    expect(screen.queryByText("Demo complete — no real password was changed.")).toBeNull();
  });

  it("keeps mismatched confirmation on the form", async () => {
    renderResetPage("lexchain-web-demo-reset");

    fireEvent.change(await screen.findByLabelText("New password"), { target: { value: "Password1" } });
    fireEvent.change(screen.getByLabelText("Confirm new password"), { target: { value: "Password2" } });
    fireEvent.click(screen.getByRole("button", { name: "Reset password" }));

    expect(await screen.findByText("Passwords do not match.")).toBeTruthy();
    expect(screen.queryByText("Demo complete — no real password was changed.")).toBeNull();
  });

  it("shows the demo completion state for a valid password and confirmation", async () => {
    renderResetPage("lexchain-web-demo-reset");

    fireEvent.change(await screen.findByLabelText("New password"), { target: { value: "Password1" } });
    fireEvent.change(screen.getByLabelText("Confirm new password"), { target: { value: "Password1" } });
    fireEvent.click(screen.getByRole("button", { name: "Reset password" }));

    expect(await screen.findByText("Demo complete — no real password was changed.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Back to sign in" }).getAttribute("href")).toBe("/login");
  });
});
