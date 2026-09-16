import { describe, expect, it } from "vitest";
import { canManageParticipants, isParticipantAccessCapabilityError, validateParticipantInvitation } from "@/features/access/participant-access";

describe("participant access", () => {
  it("allows only the Document Issuer to manage document participants", () => {
    expect(canManageParticipants("lawyer")).toBe(true);
    expect(canManageParticipants("user")).toBe(false);
    expect(canManageParticipants("unsupported")).toBe(false);
  });

  it("requires an email and one supported document permission for invitations", () => {
    expect(validateParticipantInvitation({ email: "", role: "viewer" }).valid).toBe(false);
    expect(validateParticipantInvitation({ email: "not-an-email", role: "viewer" }).valid).toBe(false);
    expect(validateParticipantInvitation({ email: "person@example.com", role: "" }).valid).toBe(false);
    expect(validateParticipantInvitation({ email: "person@example.com", role: "owner" }).valid).toBe(false);
    expect(validateParticipantInvitation({ email: "person@example.com", role: "viewer" })).toEqual({
      valid: true,
      value: { email: "person@example.com", role: "viewer" },
    });
  });

  it("recognizes a rejected participant-access capability response", () => {
    expect(isParticipantAccessCapabilityError(new Error("API error: 403"))).toBe(true);
    expect(isParticipantAccessCapabilityError(new Error("API error: 500"))).toBe(false);
  });
});
