// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import RegisterPage from "@/features/auth/pages/register-page";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("token=invite-token&email=issuer@example.com"),
}));
vi.mock("@tanstack/react-query", () => ({
  useMutation: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock("next/image", () => ({
  default: (props: React.ComponentProps<"img">) => React.createElement("img", props),
}));
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.ComponentProps<"a">) => (
    <a href={href} {...props}>{children}</a>
  ),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

afterEach(cleanup);

it("uses the canonical Document Issuer name for invited registration", () => {
  render(<RegisterPage />);

  expect(screen.getByText("Complete your LexChain Lawyer invitation.")).toBeTruthy();

});
