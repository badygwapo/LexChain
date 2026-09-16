// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import InvitePage from "./page";

vi.mock("next/image", () => ({
  default: (props: React.ComponentProps<"img">) => React.createElement("img", props),
}));
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.ComponentProps<"a">) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

afterEach(cleanup);

it("uses the canonical Document Issuer name in the invite fallback", async () => {
  const view = await InvitePage({
    params: Promise.resolve({ token: "invite-token" }),
    searchParams: Promise.resolve({ email: "issuer@example.com" }),
  });
  render(view);

  expect(screen.getByRole("heading", { name: "You are invited to LexChain as a Lawyer" })).toBeTruthy();

});
