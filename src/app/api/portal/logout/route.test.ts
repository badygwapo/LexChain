import { describe, expect, it } from "vitest";
import { POST } from "./route";

describe("portal logout", () => {
  it("expires the complete browser session including stale authority", async () => {
    const response = await POST();

    expect(response.status).toBe(200);
    for (const name of ["portal_token", "issuer_token", "admin_token", "user_role"]) {
      expect(response.cookies.get(name)?.value).toBe("");
      expect(response.cookies.get(name)?.maxAge).toBe(0);
    }
    expect(response.cookies.get("portal_token")?.httpOnly).toBe(true);
    expect(response.cookies.get("issuer_token")?.httpOnly).toBe(true);
  });
});
