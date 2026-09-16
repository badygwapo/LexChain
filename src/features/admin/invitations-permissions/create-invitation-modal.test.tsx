// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CreateInvitationModal } from "@/features/admin/invitations-permissions/create-invitation-modal";

afterEach(cleanup);

describe("CreateInvitationModal", () => {
  it("creates a Document Issuer invitation without exposing a role choice", () => {
    const onCreate = vi.fn();
    render(<CreateInvitationModal onCreate={onCreate} />);

    fireEvent.click(screen.getByRole("button", { name: "Create Invitation" }));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "issuer@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Send Invitation" }));

    expect(onCreate).toHaveBeenCalledWith({ email: "issuer@example.com", role: "lawyer" });
    expect(screen.queryByText("Role")).toBeNull();
  });
});
